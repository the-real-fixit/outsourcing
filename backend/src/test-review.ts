import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function main() {
    // Find a completed offer
    const offer = await prisma.jobOffer.findFirst({
        where: { status: 'COMPLETED' },
        include: { sender: true, receiver: true }
    });

    if (!offer) {
        console.log("No completed offer found.");
        return;
    }
    console.log("Found offer:", offer.id);

    const reviewerId = offer.senderId;
    const recipientUserId = offer.receiverId;

    try {
        let profile = await prisma.profile.findUnique({ where: { userId: recipientUserId } });
        if (!profile) {
            console.log("Creating profile...");
            profile = await prisma.profile.create({ data: { userId: recipientUserId } });
        }
        
        console.log("Profile ID:", profile.id);

        const existing = await prisma.review.findFirst({
            where: { offerId: offer.id, authorId: reviewerId }
        });
        if (existing) {
             console.log("Review already exists. Deleting it for test...");
             await prisma.review.delete({ where: { id: existing.id } });
        }

        console.log("Creating review...");
        const review = await prisma.review.create({
            data: {
                content: 'Test content',
                rating: 5,
                authorId: reviewerId,
                profileId: profile.id,
                offerId: offer.id
            }
        });

        console.log("Review created:", review.id);

        console.log("Aggregating...");
        const aggregate = await prisma.review.aggregate({
            _avg: { rating: true },
            where: { profileId: profile.id }
        });
        
        console.log("Aggregated:", aggregate);

        const avgRating = aggregate._avg.rating || 0;
        await prisma.profile.update({
            where: { id: profile.id },
            data: { rating: avgRating }
        });

        console.log("Success!");

    } catch (e) {
        console.error("Error occurred:", e);
    }
}

main().catch(console.error).finally(() => prisma.$disconnect());
