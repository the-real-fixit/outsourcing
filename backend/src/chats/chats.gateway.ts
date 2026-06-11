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
            await client.join(`user:${payload.sub}`);
        } catch (err) {
            client.disconnect(true);
        }
    }

    handleDisconnect(client: Socket) {
        // No-op: Socket.io automatically cleans up room memberships upon disconnection.
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

        // Send to peer via their private room (distributed across instances by Redis Adapter)
        this.server.to(`user:${peerId}`).emit('newMessage', message);
    }

    @SubscribeMessage('offerUpdated')
    handleOfferUpdated(
        @ConnectedSocket() client: Socket,
        @MessageBody() data: { peerId: string },
    ) {
        this.server.to(`user:${data.peerId}`).emit('offerUpdated');
    }

    @SubscribeMessage('offerCompleted')
    handleOfferCompleted(
        @ConnectedSocket() client: Socket,
        @MessageBody() data: { peerId: string },
    ) {
        this.server.to(`user:${data.peerId}`).emit('offerUpdated');
    }
}

