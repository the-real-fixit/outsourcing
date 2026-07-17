import { Module } from '@nestjs/common';
import { CacheModule } from '@nestjs/cache-manager';
import { redisStore } from 'cache-manager-redis-yet';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { PrismaModule } from './prisma/prisma.module';
import { ConfigModule } from '@nestjs/config';
import { UsersModule } from './users/users.module';
import { AuthModule } from './auth/auth.module';
import { AdsModule } from './ads/ads.module';
import { ChatsModule } from './chats/chats.module';
import { JobPostsModule } from './job-posts/job-posts.module';
import { CategoriesModule } from './categories/categories.module';
import { UploadsModule } from './uploads/uploads.module';
import { ServeStaticModule } from '@nestjs/serve-static';
import { join } from 'path';
import { ThrottlerModule, ThrottlerGuard } from '@nestjs/throttler';
import { APP_GUARD } from '@nestjs/core';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
    }),
    CacheModule.registerAsync({
      isGlobal: true,
      useFactory: async () => {
        if (process.env.REDIS_URL) {
          const store = await redisStore({
            url: process.env.REDIS_URL,
            ttl: 300000,
          });
          return { store };
        }
        return {
          ttl: 300000,
        };
      },
    }),
    ThrottlerModule.forRoot([{
      ttl: 60000,
      limit: process.env.NODE_ENV === 'stress' ? 0 : 85, // Disabled during stress tests
    }]),
    PrismaModule,
    UsersModule,
    AuthModule,
    AdsModule,
    ChatsModule,
    JobPostsModule,
    CategoriesModule,
    UploadsModule,
    ServeStaticModule.forRoot({
      rootPath: join(process.cwd(), 'uploads'),
      serveRoot: '/uploads',
    }),
  ],
  controllers: [AppController],
  providers: [
    AppService,
    ...(process.env.NODE_ENV === 'stress' ? [] : [{
      provide: APP_GUARD,
      useClass: ThrottlerGuard,
    }]),
  ],
})
export class AppModule { }
