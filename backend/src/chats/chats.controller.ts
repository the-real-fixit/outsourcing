import { Controller, Get, Post, Patch, Body, Param, UseGuards, Request } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { ChatsService } from './chats.service';

@Controller('chats')
@UseGuards(AuthGuard('jwt'))
export class ChatsController {
    constructor(private readonly chatsService: ChatsService) { }

    @Get()
    async getChats(@Request() req) {
        return this.chatsService.getChats(req.user.userId);
    }

    @Get(':peerId')
    async getChatHistory(@Request() req, @Param('peerId') peerId: string) {
        return this.chatsService.getChatAndMessages(req.user.userId, peerId);
    }

    @Post(':peerId/messages')
    async sendMessage(@Request() req, @Param('peerId') peerId: string, @Body('content') content: string, @Body('imageUrl') imageUrl?: string) {
        return this.chatsService.sendMessage(req.user.userId, peerId, content, imageUrl);
    }

    @Patch(':peerId/read')
    async markRead(@Request() req, @Param('peerId') peerId: string) {
        await this.chatsService.markRead(req.user.userId, peerId);
        return { ok: true };
    }
}

