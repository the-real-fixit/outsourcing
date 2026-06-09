import {
    WebSocketGateway,
    WebSocketServer,
    SubscribeMessage,
    OnGatewayConnection,
    OnGatewayDisconnect,
    ConnectedSocket,
    MessageBody,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { ChatsService } from './chats.service';
import { JwtService } from '@nestjs/jwt';

@WebSocketGateway({
    cors: {
        origin: '*',
    },
})
export class ChatsGateway implements OnGatewayConnection, OnGatewayDisconnect {
    @WebSocketServer()
    server: Server;

    // Map userId -> socketId
    private onlineUsers = new Map<string, string>();

    constructor(
        private readonly chatsService: ChatsService,
        private readonly jwtService: JwtService
    ) { }

    async handleConnection(client: Socket) {
        let token = client.handshake.auth?.token || client.handshake.headers?.authorization;
        if (token && token.startsWith('Bearer ')) {
            token = token.split(' ')[1];
        }

        if (!token) {
            client.disconnect(true);
            return;
        }

        try {
            const payload = this.jwtService.verify(token);
            client.data.user = { id: payload.sub, email: payload.email, role: payload.role };
            this.onlineUsers.set(payload.sub, client.id);
        } catch (err) {
            client.disconnect(true);
        }
    }

    handleDisconnect(client: Socket) {
        const userId = client.data.user?.id;
        if (userId) {
            this.onlineUsers.delete(userId);
        }
    }

    @SubscribeMessage('register')
    handleRegister(
        @ConnectedSocket() client: Socket,
        @MessageBody() data: { userId: string },
    ) {
        // No-op for backward compatibility. Handshake auth performs connection-level registration.
    }

    @SubscribeMessage('sendMessage')
    async handleSendMessage(
        @ConnectedSocket() client: Socket,
        @MessageBody() data: { senderId: string; peerId: string; content: string; imageUrl?: string },
    ) {
        const senderId = client.data.user?.id;
        if (!senderId) {
            client.disconnect(true);
            return;
        }

        const { peerId, content, imageUrl } = data;

        // Save to database
        const message = await this.chatsService.sendMessage(senderId, peerId, content, imageUrl);

        // Send to sender (confirmation)
        client.emit('newMessage', message);

        // Send to peer if online
        const peerSocketId = this.onlineUsers.get(peerId);
        if (peerSocketId) {
            this.server.to(peerSocketId).emit('newMessage', message);
        }
    }

    @SubscribeMessage('offerUpdated')
    handleOfferUpdated(
        @ConnectedSocket() client: Socket,
        @MessageBody() data: { peerId: string },
    ) {
        const peerSocketId = this.onlineUsers.get(data.peerId);
        if (peerSocketId) {
            this.server.to(peerSocketId).emit('offerUpdated');
        }
    }

    @SubscribeMessage('offerCompleted')
    handleOfferCompleted(
        @ConnectedSocket() client: Socket,
        @MessageBody() data: { peerId: string },
    ) {
        const peerSocketId = this.onlineUsers.get(data.peerId);
        if (peerSocketId) {
            this.server.to(peerSocketId).emit('offerUpdated');
        }
    }
}

