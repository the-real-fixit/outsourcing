import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class ChatsService {
    constructor(private prisma: PrismaService) { }

    private getChatIds(userId1: string, userId2: string) {
        return userId1 < userId2
            ? { user1Id: userId1, user2Id: userId2 }
            : { user1Id: userId2, user2Id: userId1 };
    }

    async getChats(userId: string) {
        const chats = await this.prisma.chat.findMany({
            where: {
                OR: [
                    { user1Id: userId },
                    { user2Id: userId }
                ]
            },
            include: {
                user1: { select: { id: true, name: true, profile: { select: { photoUrl: true } } } },
                user2: { select: { id: true, name: true, profile: { select: { photoUrl: true } } } },
                messages: {
                    orderBy: { createdAt: 'desc' },
                    take: 1
                }
            }
        });

        // Compute unread count per chat
        return Promise.all(chats.map(async (chat) => {
            const isUser1 = chat.user1Id === userId;
            const myLastRead = isUser1 ? chat.user1LastRead : chat.user2LastRead;

            const unreadCount = await this.prisma.message.count({
                where: {
                    user1Id: chat.user1Id,
                    user2Id: chat.user2Id,
                    senderId: { not: userId },
                    ...(myLastRead ? { createdAt: { gt: myLastRead } } : {})
                }
            });

            return { ...chat, unreadCount };
        }));
    }

    async getChatAndMessages(currentUserId: string, peerId: string) {
        const { user1Id, user2Id } = this.getChatIds(currentUserId, peerId);

        let chat = await this.prisma.chat.findUnique({
            where: {
                user1Id_user2Id: { user1Id, user2Id }
            }
        });

        if (!chat) {
            chat = await this.prisma.chat.create({
                data: { user1Id, user2Id }
            });
        }

        return this.prisma.message.findMany({
            where: { user1Id, user2Id },
            orderBy: { createdAt: 'asc' }
        });
    }

    async markRead(userId: string, peerId: string) {
        const { user1Id, user2Id } = this.getChatIds(userId, peerId);
        const isUser1 = user1Id === userId;

        await this.prisma.chat.upsert({
            where: { user1Id_user2Id: { user1Id, user2Id } },
            create: { user1Id, user2Id, ...(isUser1 ? { user1LastRead: new Date() } : { user2LastRead: new Date() }) },
            update: isUser1 ? { user1LastRead: new Date() } : { user2LastRead: new Date() }
        });
    }

    async sendMessage(senderId: string, peerId: string, content: string, imageUrl?: string) {
        const { user1Id, user2Id } = this.getChatIds(senderId, peerId);

        await this.prisma.chat.upsert({
            where: { user1Id_user2Id: { user1Id, user2Id } },
            create: { user1Id, user2Id },
            update: {}
        });

        return this.prisma.message.create({
            data: {
                content,
                imageUrl,
                senderId,
                user1Id,
                user2Id
            }
        });
    }
}
