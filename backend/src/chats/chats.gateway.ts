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

    constructor(private readonly chatsService: ChatsService) { }

    handleConnection(client: Socket) {
        // Log removed
    }

    handleDisconnect(client: Socket) {
        // Remove user from online map
        for (const [userId, socketId] of this.onlineUsers.entries()) {
            if (socketId === client.id) {
                this.onlineUsers.delete(userId);
                break;
            }
        }
        // Log removed
    }

    @SubscribeMessage('register')
    handleRegister(
        @ConnectedSocket() client: Socket,
        @MessageBody() data: { userId: string },
    ) {
        this.onlineUsers.set(data.userId, client.id);
        // Log removed
    }

    @SubscribeMessage('sendMessage')
    async handleSendMessage(
        @ConnectedSocket() client: Socket,
        @MessageBody() data: { senderId: string; peerId: string; content: string; imageUrl?: string },
    ) {
        const { senderId, peerId, content, imageUrl } = data;

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

