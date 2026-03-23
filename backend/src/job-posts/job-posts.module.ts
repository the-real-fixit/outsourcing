import { Module } from '@nestjs/common';
import { JobPostsService } from './job-posts.service';
import { JobPostsController } from './job-posts.controller';
import { PrismaModule } from '../prisma/prisma.module';

@Module({
  imports: [PrismaModule],
  providers: [JobPostsService],
  controllers: [JobPostsController]
})
export class JobPostsModule { }
