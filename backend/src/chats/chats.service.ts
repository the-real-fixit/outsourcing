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

        if (chats.length === 0) return [];

        // Compute unread count per chat in a single grouped query
        const unreadCounts = await this.prisma.message.groupBy({
            by: ['user1Id', 'user2Id'],
            _count: { _all: true },
            where: {
                senderId: { not: userId },
                OR: chats.map(chat => {
                    const isUser1 = chat.user1Id === userId;
                    const myLastRead = isUser1 ? chat.user1LastRead : chat.user2LastRead;
                    return {
                        user1Id: chat.user1Id,
                        user2Id: chat.user2Id,
                        ...(myLastRead ? { createdAt: { gt: myLastRead } } : {})
                    };
                })
            }
        });

        const countMap = new Map<string, number>();
        unreadCounts.forEach(c => {
            countMap.set(`${c.user1Id}_${c.user2Id}`, c._count._all);
        });

        return chats.map(chat => {
            const key = `${chat.user1Id}_${chat.user2Id}`;
            const unreadCount = countMap.get(key) || 0;
            return { ...chat, unreadCount };
        });
    }

    async getChatAndMessages(currentUserId: string, peerId: string, limit = 50, cursorId?: string) {
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

        const queryOptions: any = {
            where: { user1Id, user2Id },
            orderBy: { createdAt: 'desc' },
            take: limit
        };

        if (cursorId) {
            queryOptions.cursor = { id: cursorId };
            queryOptions.skip = 1;
        }

        const messages = await this.prisma.message.findMany(queryOptions);
        return messages.reverse();
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
