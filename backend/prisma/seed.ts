import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

const categories = [
    { name: 'Electricista', icon: 'Zap' },
    { name: 'Plomería', icon: 'Wrench' },
    { name: 'Pintura', icon: 'Paintbrush' },
    { name: 'Carpintería', icon: 'Hammer' },
    { name: 'Mudanza', icon: 'Truck' },
    { name: 'Jardinería', icon: 'Scissors' },
    { name: 'Técnico', icon: 'Monitor' },
    { name: 'Albañil', icon: 'Hammer' },
    { name: 'Paseo de mascotas', icon: 'Dog' },
    { name: 'Cuidado de mascotas', icon: 'PawPrint' },
    { name: 'Limpieza', icon: 'Sparkles' },
    { name: 'Fotografía', icon: 'Camera' },
    { name: 'Clases', icon: 'GraduationCap' },
];

async function main() {
    console.log(`Start seeding ...`);
    for (const cat of categories) {
        // use upsert to avoid creating duplicates if run multiple times
        const dbCat = await prisma.category.findFirst({
            where: { name: cat.name }
        });

        if (!dbCat) {
            await prisma.category.create({
                data: {
                    name: cat.name,
                    icon: cat.icon
                }
            });
            console.log(`Created category: ${cat.name}`);
        } else {
            console.log(`Category already exists: ${cat.name}`);
        }
    }
    console.log(`Seeding finished.`);
}

main()
    .then(async () => {
        await prisma.$disconnect();
    })
    .catch(async (e) => {
        console.error(e);
        await prisma.$disconnect();
        process.exit(1);
    });
