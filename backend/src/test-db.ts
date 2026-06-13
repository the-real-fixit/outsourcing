import { PrismaClient } from '@prisma/client';

async function main() {
    const prisma = new PrismaClient();
    try {
        console.log('Connecting to database using DATABASE_URL...');
        const users = await prisma.user.findMany({ take: 1 });
        console.log('Success! Connection verified. Users found:', users.length);
    } catch (error) {
        console.error('Database connection failed:', error);
    } finally {
        await prisma.$disconnect();
    }
}

main();
