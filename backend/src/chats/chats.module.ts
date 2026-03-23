import { Module } from '@nestjs/common';
import { ChatsService } from './chats.service';
import { ChatsController } from './chats.controller';
import { ChatsGateway } from './chats.gateway';
import { PrismaModule } from '../prisma/prisma.module';

@Module({
  imports: [PrismaModule],
  providers: [ChatsService, ChatsGateway],
  controllers: [ChatsController]
})
export class ChatsModule { }
