import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { Prisma, JobStatus, OfferStatus, Role } from '@prisma/client';

export class CreateJobPostDto {
    title: string;
    description: string;
    budget?: string | number;
    location: string;
    department?: string;
    municipality?: string;
    lat?: string | number;
    lng?: string | number;
    categoryId?: string;
    photos?: string[];
}

@Injectable()
export class JobPostsService {
    constructor(private prisma: PrismaService) { }

    async create(authorId: string, data: CreateJobPostDto) {
        const { title, description, budget, location, department, municipality, lat, lng, categoryId, photos } = data;

        return this.prisma.jobPost.create({
            data: {
                title,
                description,
                budget: budget ? parseFloat(budget as string) : null,
                location,
                department,
                municipality,
                lat: lat ? parseFloat(lat as string) : null,
                lng: lng ? parseFloat(lng as string) : null,
                categoryId: categoryId || null,
                photos: photos || [],
                authorId
            },
            include: {
                author: { select: { name: true, email: true } },
                category: true
            }
        });
    }

    async findAll(categoryId?: string, status?: string, authorRole?: string, authorId?: string, lat?: string, lng?: string, department?: string, municipality?: string, search?: string) {
        const where: Prisma.JobPostWhereInput = {};

        if (categoryId) where.categoryId = categoryId;
        if (status) where.status = status as JobStatus;
        if (authorId) where.authorId = authorId;
        if (authorRole) {
            where.author = {
                role: authorRole as Role
            };
        }
        if (search) {
            where.OR = [
                { title: { contains: search, mode: 'insensitive' } },
                { description: { contains: search, mode: 'insensitive' } },
            ];
        }

        const posts = await this.prisma.jobPost.findMany({
            where,
            include: {
                author: { select: { id: true, name: true, role: true, profile: { select: { photoUrl: true } } } },
                category: true
            },
            orderBy: { createdAt: 'desc' }
        });

        // Parse coordinates
        const userLat = lat ? parseFloat(lat) : null;
        const userLng = lng ? parseFloat(lng) : null;

        if (userLat !== null && userLng !== null && !isNaN(userLat) && !isNaN(userLng)) {
            // Sort by Haversine distance
            const haversine = (lat1: number, lon1: number, lat2: number, lon2: number) => {
                const R = 6371; // Earth radius in km
                const dLat = (lat2 - lat1) * Math.PI / 180;
                const dLon = (lon2 - lon1) * Math.PI / 180;
                const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
                    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
                    Math.sin(dLon / 2) * Math.sin(dLon / 2);
                const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
                return R * c;
            };

            return posts.sort((a, b) => {
                if (a.lat !== null && a.lng !== null && b.lat !== null && b.lng !== null) {
                    const distA = haversine(userLat, userLng, a.lat, a.lng);
                    const distB = haversine(userLat, userLng, b.lat, b.lng);
                    return distA - distB;
                }
                if (a.lat !== null && a.lng !== null) return -1;
                if (b.lat !== null && b.lng !== null) return 1;
                return 0;
            });
        }

        if (department || municipality) {
            // Sort by exact match score
            return posts.sort((a, b) => {
                let scoreA = 0;
                let scoreB = 0;
                if (a.municipality === municipality) scoreA += 2;
                if (a.department === department) scoreA += 1;
                if (b.municipality === municipality) scoreB += 2;
                if (b.department === department) scoreB += 1;
                return scoreB - scoreA;
            });
        }

        return posts;
    }

    async findOne(id: string) {
        return this.prisma.jobPost.findUnique({
            where: { id },
            include: {
                author: {
                    select: {
                        id: true,
                        name: true,
                        role: true,
                        profile: {
                            select: {
                                photoUrl: true,
                                phone: true,
                                rating: true,
                                jobsCompleted: true,
                                address: true,
                                bio: true,
                                canTravel: true,
                                hasVehicle: true,
                                travelDetails: true,
                                department: true,
                                municipality: true,
                                reviewsReceived: {
                                    include: {
                                        author: { select: { id: true, name: true, profile: { select: { photoUrl: true } } } }
                                    },
                                    orderBy: { createdAt: 'desc' as const },
                                    take: 10
                                }
                            }
                        }
                    }
                },
                category: true
            }
        });
    }

    async updateStatus(id: string, status: string, userId: string) {
        const post = await this.prisma.jobPost.findUnique({ where: { id } });
        if (!post) throw new Error('Job post not found');

        const updated = await this.prisma.jobPost.update({
            where: { id },
            data: { status: status as JobStatus }
        });

        // If job is completed (CLOSED), increment the author's jobsCompleted
        if (status === 'CLOSED') {
            await this.prisma.profile.updateMany({
                where: { userId: post.authorId },
                data: { jobsCompleted: { increment: 1 } }
            });
        }

        return updated;
    }

    async addReview(jobPostId: string, reviewerId: string, data: { rating: number, content: string }) {
        const post = await this.prisma.jobPost.findUnique({ where: { id: jobPostId } });
        if (!post) throw new Error('Job post not found');

        // Find the profile of the job post author (the person being reviewed)
        const profile = await this.prisma.profile.findUnique({ where: { userId: post.authorId } });
        if (!profile) throw new Error('Profile not found');

        // Create the review
        const review = await this.prisma.review.create({
            data: {
                content: data.content,
                rating: data.rating,
                authorId: reviewerId,
                profileId: profile.id
            }
        });

        // Recalculate average rating
        const allReviews = await this.prisma.review.findMany({
            where: { profileId: profile.id }
        });
        const avgRating = allReviews.reduce((sum, r) => sum + r.rating, 0) / allReviews.length;

        await this.prisma.profile.update({
            where: { id: profile.id },
            data: { rating: avgRating }
        });

        return review;
    }

    async createOffer(jobPostId: string, senderId: string, data: { description: string, price: number, estimatedDays?: number }) {
        const post = await this.prisma.jobPost.findUnique({ where: { id: jobPostId } });
        if (!post) throw new Error('Job post not found');

        const offer = await this.prisma.jobOffer.create({
            data: {
                jobPostId,
                senderId,
                receiverId: post.authorId,
                description: data.description,
                price: data.price,
                estimatedDays: data.estimatedDays || null,
            },
            include: {
                sender: { select: { id: true, name: true, profile: { select: { photoUrl: true } } } },
                receiver: { select: { id: true, name: true, profile: { select: { photoUrl: true } } } },
                jobPost: { select: { id: true, title: true, authorId: true, status: true } }
            }
        });

        // Auto-send message to the chat
        const daysText = data.estimatedDays ? ` · ${data.estimatedDays} d\u00edas` : '';
        const chatContent = `[Propuesta] "${post.title}"\nDetalles: ${data.description}\nMonto: Q${data.price}${daysText}`;
        const { user1Id, user2Id } = senderId < post.authorId
            ? { user1Id: senderId, user2Id: post.authorId }
            : { user1Id: post.authorId, user2Id: senderId };
        await this.prisma.chat.upsert({
            where: { user1Id_user2Id: { user1Id, user2Id } },
            create: { user1Id, user2Id },
            update: {}
        });
        await this.prisma.message.create({
            data: { content: chatContent, senderId, user1Id, user2Id }
        });

        return offer;
    }

    async getOffersForUser(userId: string) {
        return this.prisma.jobOffer.findMany({
            where: {
                OR: [{ senderId: userId }, { receiverId: userId }]
            },
            include: {
                sender: { select: { id: true, name: true, profile: { select: { photoUrl: true } } } },
                receiver: { select: { id: true, name: true, profile: { select: { photoUrl: true } } } },
                jobPost: { select: { id: true, title: true, authorId: true, status: true } }
            },
            orderBy: { createdAt: 'desc' }
        });
    }

    async respondToOffer(offerId: string, userId: string, status: string) {
        const offer = await this.prisma.jobOffer.findUnique({ where: { id: offerId } });
        if (!offer) throw new Error('Offer not found');

        const updated = await this.prisma.jobOffer.update({
            where: { id: offerId },
            data: { status: status as OfferStatus },
            include: {
                sender: { select: { id: true, name: true, profile: { select: { photoUrl: true } } } },
                receiver: { select: { id: true, name: true, profile: { select: { photoUrl: true } } } },
                jobPost: { select: { id: true, title: true, authorId: true, status: true } }
            }
        });

        // If accepted, update job post status to IN_PROGRESS
        if (status === 'ACCEPTED') {
            await this.prisma.jobPost.update({
                where: { id: offer.jobPostId },
                data: { status: 'IN_PROGRESS' }
            });
        }

        return updated;
    }

    async getOffersBetweenUsers(userId: string, peerId: string) {
        return this.prisma.jobOffer.findMany({
            where: {
                OR: [
                    { senderId: userId, receiverId: peerId },
                    { senderId: peerId, receiverId: userId }
                ]
            },
            include: {
                sender: { select: { id: true, name: true } },
                receiver: { select: { id: true, name: true } },
                jobPost: { select: { id: true, title: true, authorId: true, status: true } },
                reviews: { select: { authorId: true } }
            },
            orderBy: { createdAt: 'desc' }
        });
    }

    async editOffer(offerId: string, userId: string, data: { description?: string, price?: number, estimatedDays?: number }) {
        const offer = await this.prisma.jobOffer.findUnique({
            where: { id: offerId },
            include: { jobPost: { select: { title: true } } }
        });
        if (!offer) throw new Error('Offer not found');
        // Both sender and receiver can counter-propose
        if (offer.senderId !== userId && offer.receiverId !== userId) throw new Error('You are not part of this offer');

        const oldPrice = offer.price;
        const oldDays = offer.estimatedDays;
        const oldDesc = offer.description;

        const newPrice = data.price !== undefined ? data.price : oldPrice;
        const newDays = data.estimatedDays !== undefined ? data.estimatedDays : oldDays;
        const newDesc = data.description !== undefined ? data.description : oldDesc;

        const updated = await this.prisma.jobOffer.update({
            where: { id: offerId },
            data: {
                description: newDesc,
                price: newPrice,
                estimatedDays: newDays,
                status: 'PENDING',
                senderApproved: false,
                receiverApproved: false
            },
            include: {
                sender: { select: { id: true, name: true, profile: { select: { photoUrl: true } } } },
                receiver: { select: { id: true, name: true, profile: { select: { photoUrl: true } } } },
                jobPost: { select: { id: true, title: true } }
            }
        });

        // Auto-send diff message to chat
        const peerId = offer.senderId === userId ? offer.receiverId : offer.senderId;
        const oldDaysText = oldDays ? ` · ${oldDays} d\u00edas` : '';
        const newDaysText = newDays ? ` · ${newDays} d\u00edas` : '';
        const chatContent = `[Contra-propuesta] "${offer.jobPost.title}"\nAnterior: Q${oldPrice}${oldDaysText}\nNueva: Q${newPrice}${newDaysText}\nDetalles: ${newDesc}`;
        const { user1Id, user2Id } = userId < peerId
            ? { user1Id: userId, user2Id: peerId }
            : { user1Id: peerId, user2Id: userId };
        await this.prisma.message.create({
            data: { content: chatContent, senderId: userId, user1Id, user2Id }
        });

        return updated;
    }

    async approveOffer(offerId: string, userId: string) {
        const offer = await this.prisma.jobOffer.findUnique({ where: { id: offerId } });
        if (!offer) throw new Error('Offer not found');
        if (offer.status !== 'PENDING') throw new Error('Offer is not pending');

        const isSender = offer.senderId === userId;
        const isReceiver = offer.receiverId === userId;

        if (!isSender && !isReceiver) throw new Error('You are not part of this offer');

        const updateData: Prisma.JobOfferUpdateInput = {};
        if (isSender) updateData.senderApproved = true;
        if (isReceiver) updateData.receiverApproved = true;

        const senderApproved = isSender ? true : offer.senderApproved;
        const receiverApproved = isReceiver ? true : offer.receiverApproved;

        if (senderApproved && receiverApproved) {
            updateData.status = 'ACCEPTED';
        }

        const updated = await this.prisma.jobOffer.update({
            where: { id: offerId },
            data: updateData,
            include: {
                sender: { select: { id: true, name: true, profile: { select: { photoUrl: true } } } },
                receiver: { select: { id: true, name: true, profile: { select: { photoUrl: true } } } },
                jobPost: { select: { id: true, title: true } }
            }
        });

        if (updated.status === 'ACCEPTED') {
            await this.prisma.jobPost.update({
                where: { id: offer.jobPostId },
                data: { status: 'IN_PROGRESS' }
            });
        }

        return updated;
    }

    async completeOffer(offerId: string, userId: string) {
        const offer = await this.prisma.jobOffer.findUnique({
            where: { id: offerId },
            include: {
                sender: { select: { id: true, name: true, role: true } },
                receiver: { select: { id: true, name: true, role: true } },
            }
        });
        if (!offer) throw new Error('Offer not found');
        if (offer.status !== 'ACCEPTED') throw new Error('Offer must be ACCEPTED to be completed');

        const isSender = offer.senderId === userId;
        const isReceiver = offer.receiverId === userId;
        if (!isSender && !isReceiver) throw new Error('You are not part of this offer');

        const updateData: Prisma.JobOfferUpdateInput = {};
        if (isSender) updateData.senderCompleted = true;
        if (isReceiver) updateData.receiverCompleted = true;

        const senderCompleted = isSender ? true : offer.senderCompleted;
        const receiverCompleted = isReceiver ? true : offer.receiverCompleted;

        if (senderCompleted && receiverCompleted) {
            updateData.status = 'COMPLETED';
        }

        const updated = await this.prisma.jobOffer.update({
            where: { id: offerId },
            data: updateData,
            include: {
                sender: { select: { id: true, name: true, role: true, profile: { select: { photoUrl: true } } } },
                receiver: { select: { id: true, name: true, role: true, profile: { select: { photoUrl: true } } } },
                jobPost: { select: { id: true, title: true, authorId: true, status: true } }
            }
        });

        // When both parties confirm → update employee profile stats
        if (updated.status === 'COMPLETED') {
            // Identify the PROVIDER (employee) between sender and receiver
            const providerUser = (offer.sender as any).role === 'PROVIDER'
                ? offer.sender
                : (offer.receiver as any).role === 'PROVIDER'
                    ? offer.receiver
                    : null;

            if (providerUser) {
                const hoursToAdd = offer.estimatedDays ?? 1;
                await this.prisma.profile.updateMany({
                    where: { userId: providerUser.id },
                    data: {
                        jobsCompleted: { increment: 1 },
                        hours: { increment: hoursToAdd }
                    }
                });
            }
        }

        return updated;
    }

    async submitOfferReview(offerId: string, reviewerId: string, data: { rating: number; content?: string }) {
        const offer = await this.prisma.jobOffer.findUnique({ where: { id: offerId } });
        if (!offer) throw new Error('Offer not found');
        if (offer.status !== 'COMPLETED') throw new Error('Offer must be COMPLETED to leave a review');

        const isSender = offer.senderId === reviewerId;
        const isReceiver = offer.receiverId === reviewerId;
        if (!isSender && !isReceiver) throw new Error('You are not part of this offer');

        // The reviewer rates the OTHER person
        const recipientUserId = isSender ? offer.receiverId : offer.senderId;

        // Find or ensure recipient has a profile
        let profile = await this.prisma.profile.findUnique({ where: { userId: recipientUserId } });
        if (!profile) {
            profile = await this.prisma.profile.create({ data: { userId: recipientUserId } });
        }

        // Check for duplicate review from this author for this offer
        const existing = await this.prisma.review.findFirst({
            where: { offerId, authorId: reviewerId }
        });
        if (existing) throw new Error('You have already reviewed this job');

        const review = await this.prisma.review.create({
            data: {
                content: data.content || '',
                rating: data.rating,
                authorId: reviewerId,
                profileId: profile.id,
                offerId
            }
        });

        // Recalculate average rating
        const allReviews = await this.prisma.review.findMany({ where: { profileId: profile.id } });
        const avgRating = allReviews.reduce((sum, r) => sum + r.rating, 0) / allReviews.length;
        await this.prisma.profile.update({
            where: { id: profile.id },
            data: { rating: avgRating }
        });

        return review;
    }
}
