import { Injectable, OnModuleInit, OnModuleDestroy } from '@nestjs/common';
import { PrismaClient } from '@prisma/client';

@Injectable()
export class PrismaService extends PrismaClient implements OnModuleInit, OnModuleDestroy {
    constructor() {
        const url = process.env.DATABASE_URL;
        const newUrl = url 
            ? url + (url.includes('?') ? '&' : '?') + 'connection_limit=20&pool_timeout=10'
            : undefined;
            
        super(newUrl ? { datasources: { db: { url: newUrl } } } : undefined);
    }

    async onModuleInit() {
        await this.$connect();
    }

    async onModuleDestroy() {
        await this.$disconnect();
    }
}
