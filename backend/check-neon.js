const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
async function main() {
  const users = await prisma.user.findMany({ 
      orderBy: { createdAt: 'desc' }, 
      take: 10, 
      select: { email: true, createdAt: true, role: true } 
  });
  console.log("Últimos usuarios en Neon DB:");
  console.table(users);
}
main().catch(console.error).finally(() => prisma.$disconnect());
