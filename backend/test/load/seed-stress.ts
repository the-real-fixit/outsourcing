/**
 * Stress Test Seed Script
 * Generates ~5,000+ records across all tables for realistic load testing.
 * 
 * Run: npx ts-node test/load/seed-stress.ts
 */

import { PrismaClient, Role } from '@prisma/client';
import * as bcrypt from 'bcrypt';

const prisma = new PrismaClient();

const STRESS_PASSWORD = 'StressTest123!';
const NUM_CLIENTS = 250;
const NUM_PROVIDERS = 250;
const NUM_JOB_POSTS = 2000;
const NUM_OFFERS = 1000;
const NUM_REVIEWS = 500;
const NUM_CHATS = 200;
const MSGS_PER_CHAT = 50;

const DEPARTMENTS = ['Guatemala', 'Sacatepéquez', 'Escuintla', 'Quetzaltenango', 'Petén', 'Alta Verapaz', 'Izabal', 'Chimaltenango'];
const MUNICIPALITIES: Record<string, string[]> = {
  'Guatemala': ['Guatemala', 'Mixco', 'Villa Nueva', 'San Miguel Petapa', 'Santa Catarina Pinula'],
  'Sacatepéquez': ['Antigua Guatemala', 'Jocotenango', 'Ciudad Vieja'],
  'Escuintla': ['Escuintla', 'Santa Lucía Cotzumalguapa'],
  'Quetzaltenango': ['Quetzaltenango', 'Salcajá', 'Cantel'],
  'Petén': ['Flores', 'San Benito', 'Santa Elena'],
  'Alta Verapaz': ['Cobán', 'San Pedro Carchá'],
  'Izabal': ['Puerto Barrios', 'Livingston'],
  'Chimaltenango': ['Chimaltenango', 'San Martín Jilotepeque'],
};

const JOB_TITLES = [
  'Reparación de tubería rota', 'Instalación eléctrica completa', 'Pintura de apartamento',
  'Mudanza de oficina', 'Mantenimiento de jardín', 'Reparación de techo', 'Instalación de piso cerámico',
  'Plomería de emergencia', 'Electricista para cortocircuito', 'Carpintería a medida',
  'Limpieza profunda de casa', 'Albañilería para muro perimetral', 'Técnico de computadoras',
  'Fumigación de casa', 'Instalación de cámaras de seguridad', 'Reparación de lavadora',
  'Construcción de closet', 'Herrería para portón', 'Vidriera para ventana rota',
  'Impermeabilización de terraza',
];

const BIOS = [
  'Profesional con más de 10 años de experiencia en el ramo.',
  'Trabajo garantizado y precios accesibles.',
  'Especialista certificado, atención las 24 horas.',
  'Trabajos de calidad, puntualidad garantizada.',
  'Experiencia en proyectos residenciales y comerciales.',
];

function randomItem<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

function randomFloat(min: number, max: number): number {
  return Math.round((Math.random() * (max - min) + min) * 10000) / 10000;
}

function randomInt(min: number, max: number): number {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

async function main() {
  console.log('🧹 Cleaning existing data...');
  await prisma.message.deleteMany();
  await prisma.chat.deleteMany();
  await prisma.review.deleteMany();
  await prisma.profileObservation.deleteMany();
  await prisma.promotedAd.deleteMany();
  await prisma.jobOffer.deleteMany();
  await prisma.jobPost.deleteMany();
  await prisma.settings.deleteMany();
  await prisma.profile.deleteMany();
  await prisma.user.deleteMany();
  // Don't delete categories — they might have seeds
  console.log('✅ Database cleaned.');

  // ── Categories ───────────────────────────────────────────
  console.log('📦 Seeding categories...');
  const categoryNames = ['Electricista', 'Plomería', 'Pintura', 'Carpintería', 'Mudanza', 'Jardinería', 'Técnico', 'Albañil', 'Limpieza'];
  await prisma.category.deleteMany();
  const categories = await Promise.all(
    categoryNames.map(name =>
      prisma.category.create({ data: { name, description: `Servicios de ${name.toLowerCase()}` } })
    )
  );
  const categoryIds = categories.map(c => c.id);
  console.log(`✅ ${categories.length} categories created.`);

  // ── Users + Profiles ────────────────────────────────────
  console.log(`👤 Seeding ${NUM_CLIENTS + NUM_PROVIDERS} users...`);
  const hashedPassword = await bcrypt.hash(STRESS_PASSWORD, 10);

  const userIds: string[] = [];
  const clientIds: string[] = [];
  const providerIds: string[] = [];

  // Create users in batches to avoid overwhelming the DB
  const BATCH_SIZE = 50;
  const totalUsers = NUM_CLIENTS + NUM_PROVIDERS;

  for (let batch = 0; batch < totalUsers; batch += BATCH_SIZE) {
    const batchEnd = Math.min(batch + BATCH_SIZE, totalUsers);
    const promises: ReturnType<typeof prisma.user.create>[] = [];

    for (let i = batch; i < batchEnd; i++) {
      const isProvider = i >= NUM_CLIENTS;
      const role: Role = isProvider ? 'PROVIDER' : 'CLIENT';
      const prefix = isProvider ? 'provider' : 'client';
      const idx = isProvider ? i - NUM_CLIENTS : i;
      const dept = randomItem(DEPARTMENTS);
      const muni = randomItem(MUNICIPALITIES[dept]);

      promises.push(
        prisma.user.create({
          data: {
            email: `stress_${prefix}_${idx}@test.com`,
            password: hashedPassword,
            name: `Stress ${prefix.charAt(0).toUpperCase() + prefix.slice(1)} ${idx}`,
            role,
            profile: {
              create: {
                bio: randomItem(BIOS),
                phone: `5555${String(idx).padStart(4, '0')}`,
                department: dept,
                municipality: muni,
                lat: randomFloat(13.7, 17.8),
                lng: randomFloat(-92.2, -88.2),
                rating: randomFloat(2.0, 5.0),
                jobsCompleted: randomInt(0, 50),
                days: randomInt(0, 200),
                hours: randomInt(0, 1000),
                canTravel: Math.random() > 0.5,
                hasVehicle: Math.random() > 0.7,
                ...(isProvider ? { categories: { connect: [{ id: randomItem(categoryIds) }] } } : {}),
              },
            },
            settings: {
              create: {
                notificationsEnabled: true,
                emailNotifications: Math.random() > 0.3,
                darkMode: Math.random() > 0.5,
                language: Math.random() > 0.8 ? 'en' : 'es',
              },
            },
          },
        })
      );
    }

    const batchUsers = await Promise.all(promises);
    for (const u of batchUsers) {
      userIds.push(u.id);
      if (u.role === 'CLIENT') clientIds.push(u.id);
      else providerIds.push(u.id);
    }
    process.stdout.write(`\r  Created ${batchEnd}/${totalUsers} users...`);
  }
  console.log(`\n✅ ${userIds.length} users created (${clientIds.length} clients, ${providerIds.length} providers).`);

  // ── Job Posts ────────────────────────────────────────────
  console.log(`📋 Seeding ${NUM_JOB_POSTS} job posts...`);
  const jobPostIds: string[] = [];

  for (let batch = 0; batch < NUM_JOB_POSTS; batch += BATCH_SIZE) {
    const batchEnd = Math.min(batch + BATCH_SIZE, NUM_JOB_POSTS);
    const promises: ReturnType<typeof prisma.jobPost.create>[] = [];

    for (let i = batch; i < batchEnd; i++) {
      const dept = randomItem(DEPARTMENTS);
      const muni = randomItem(MUNICIPALITIES[dept]);
      const authorId = randomItem(userIds);

      promises.push(
        prisma.jobPost.create({
          data: {
            title: `${randomItem(JOB_TITLES)} #${i}`,
            description: `Necesito ayuda con este trabajo. Descripción detallada de la tarea número ${i} para pruebas de estrés del sistema. Se requiere experiencia previa y herramientas propias.`,
            budget: Math.random() > 0.3 ? randomInt(100, 5000) : null,
            location: `Zona ${randomInt(1, 25)}, ${muni}`,
            department: dept,
            municipality: muni,
            lat: randomFloat(13.7, 17.8),
            lng: randomFloat(-92.2, -88.2),
            status: randomItem(['OPEN', 'OPEN', 'OPEN', 'IN_PROGRESS', 'CLOSED']),
            authorId,
            categoryId: randomItem(categoryIds),
            photos: Math.random() > 0.6 ? ['https://res.cloudinary.com/demo/image/upload/sample.jpg'] : [],
          },
        })
      );
    }

    const batchPosts = await Promise.all(promises);
    jobPostIds.push(...batchPosts.map(p => p.id));
    process.stdout.write(`\r  Created ${batchEnd}/${NUM_JOB_POSTS} job posts...`);
  }
  console.log(`\n✅ ${jobPostIds.length} job posts created.`);

  // ── Job Offers ──────────────────────────────────────────
  console.log(`💼 Seeding ${NUM_OFFERS} job offers...`);
  const offerIds: string[] = [];

  for (let batch = 0; batch < NUM_OFFERS; batch += BATCH_SIZE) {
    const batchEnd = Math.min(batch + BATCH_SIZE, NUM_OFFERS);
    const promises: ReturnType<typeof prisma.jobOffer.create>[] = [];

    for (let i = batch; i < batchEnd; i++) {
      const senderId = randomItem(providerIds);
      let receiverId = randomItem(clientIds);
      // Ensure sender != receiver
      while (receiverId === senderId) receiverId = randomItem(clientIds);

      promises.push(
        prisma.jobOffer.create({
          data: {
            jobPostId: randomItem(jobPostIds),
            senderId,
            receiverId,
            description: `Propuesta de estrés #${i}: Puedo completar este trabajo con calidad y puntualidad.`,
            price: randomInt(150, 3000),
            estimatedDays: randomInt(1, 15),
            estimatedHours: randomInt(2, 40),
            status: randomItem(['PENDING', 'PENDING', 'ACCEPTED', 'REJECTED']),
          },
        })
      );
    }

    const batchOffers = await Promise.all(promises);
    offerIds.push(...batchOffers.map(o => o.id));
    process.stdout.write(`\r  Created ${batchEnd}/${NUM_OFFERS} offers...`);
  }
  console.log(`\n✅ ${offerIds.length} offers created.`);

  // ── Reviews ─────────────────────────────────────────────
  console.log(`⭐ Seeding ${NUM_REVIEWS} reviews...`);
  const profiles = await prisma.profile.findMany({ select: { id: true } });
  const profileIds = profiles.map(p => p.id);

  for (let batch = 0; batch < NUM_REVIEWS; batch += BATCH_SIZE) {
    const batchEnd = Math.min(batch + BATCH_SIZE, NUM_REVIEWS);
    const promises: ReturnType<typeof prisma.review.create>[] = [];

    for (let i = batch; i < batchEnd; i++) {
      promises.push(
        prisma.review.create({
          data: {
            content: `Reseña de prueba #${i}. ${randomItem(['Excelente trabajo', 'Muy puntual', 'Buen precio', 'Recomendado', 'Podría mejorar'])}`,
            rating: randomFloat(1.0, 5.0),
            authorId: randomItem(userIds),
            profileId: randomItem(profileIds),
          },
        })
      );
    }

    await Promise.all(promises);
    process.stdout.write(`\r  Created ${batchEnd}/${NUM_REVIEWS} reviews...`);
  }
  console.log(`\n✅ ${NUM_REVIEWS} reviews created.`);

  // ── Chats + Messages ────────────────────────────────────
  console.log(`💬 Seeding ${NUM_CHATS} chats with ${MSGS_PER_CHAT} messages each...`);
  let totalMessages = 0;

  for (let i = 0; i < NUM_CHATS; i++) {
    let u1 = randomItem(userIds);
    let u2 = randomItem(userIds);
    while (u2 === u1) u2 = randomItem(userIds);

    // Enforce ordering for composite key
    const [user1Id, user2Id] = u1 < u2 ? [u1, u2] : [u2, u1];

    try {
      await prisma.chat.upsert({
        where: { user1Id_user2Id: { user1Id, user2Id } },
        create: { user1Id, user2Id },
        update: {},
      });

      // Batch insert messages
      const msgData = Array.from({ length: MSGS_PER_CHAT }, (_, j) => ({
        content: `Mensaje de estrés ${i}-${j}: ${randomItem(['Hola', 'Cuánto cuesta?', 'Está disponible?', 'Perfecto', 'Cuándo puede?', 'Ok, confirmado'])}`,
        senderId: Math.random() > 0.5 ? user1Id : user2Id,
        user1Id,
        user2Id,
      }));

      await prisma.message.createMany({ data: msgData });
      totalMessages += MSGS_PER_CHAT;
    } catch {
      // Skip duplicate chat pairs silently
    }

    if (i % 20 === 0) process.stdout.write(`\r  Created ${i}/${NUM_CHATS} chats...`);
  }
  console.log(`\n✅ ${NUM_CHATS} chats, ${totalMessages} messages created.`);

  // ── Export IDs for Artillery ─────────────────────────────
  const fs = await import('fs');
  const path = await import('path');

  const testData = {
    clientEmails: Array.from({ length: NUM_CLIENTS }, (_, i) => `stress_client_${i}@test.com`),
    providerEmails: Array.from({ length: NUM_PROVIDERS }, (_, i) => `stress_provider_${i}@test.com`),
    password: STRESS_PASSWORD,
    categoryIds,
    jobPostIds: jobPostIds.slice(0, 200), // Sample for artillery
    offerIds: offerIds.filter((_, i) => i < 100), // Sample pending offers
    userIds: userIds.slice(0, 100),
    providerIds: providerIds.slice(0, 50),
    clientIds: clientIds.slice(0, 50),
  };

  const outPath = path.join(__dirname, 'test-data.json');
  fs.writeFileSync(outPath, JSON.stringify(testData, null, 2));
  console.log(`\n📄 Test data exported to ${outPath}`);

  // ── Summary ─────────────────────────────────────────────
  console.log('\n═══════════════════════════════════════');
  console.log('  SEED COMPLETO');
  console.log('═══════════════════════════════════════');
  console.log(`  Users:      ${userIds.length}`);
  console.log(`  Profiles:   ${userIds.length}`);
  console.log(`  Categories: ${categories.length}`);
  console.log(`  Job Posts:  ${jobPostIds.length}`);
  console.log(`  Offers:     ${offerIds.length}`);
  console.log(`  Reviews:    ${NUM_REVIEWS}`);
  console.log(`  Chats:      ${NUM_CHATS}`);
  console.log(`  Messages:   ${totalMessages}`);
  console.log('═══════════════════════════════════════\n');
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
