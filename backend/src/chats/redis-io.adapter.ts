import { IoAdapter } from '@nestjs/platform-socket.io';
import { ServerOptions } from 'socket.io';
import { createClient } from 'redis';
import { createAdapter } from '@socket.io/redis-adapter';
import { Logger } from '@nestjs/common';

export class RedisIoAdapter extends IoAdapter {
    private adapterConstructor: ReturnType<typeof createAdapter>;
    private readonly logger = new Logger(RedisIoAdapter.name);

    async connectToRedis(): Promise<void> {
        const redisUrl = process.env.REDIS_URL || 'redis://localhost:6379';
        this.logger.log(`Connecting to Redis for WebSockets at URL: ${redisUrl}`);

        const pubClient = createClient({ url: redisUrl });
        const subClient = pubClient.duplicate();

        pubClient.on('error', (err) => this.logger.error('Redis Publisher Client Error', err));
        subClient.on('error', (err) => this.logger.error('Redis Subscriber Client Error', err));

        await Promise.all([pubClient.connect(), subClient.connect()]);

        this.adapterConstructor = createAdapter(pubClient, subClient);
        this.logger.log('Redis WebSockets Adapter successfully initialized');
    }

    createIOServer(port: number, options?: ServerOptions): any {
        const server = super.createIOServer(port, options);
        server.adapter(this.adapterConstructor);
        return server;
    }
}
