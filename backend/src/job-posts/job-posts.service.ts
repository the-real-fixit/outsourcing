import { Injectable, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { Prisma, JobStatus, OfferStatus, Role } from '@prisma/client';

import { IsString, IsNotEmpty, IsOptional, IsNumber, IsArray, IsNumberString } from 'class-validator';

export class CreateJobPostDto {
    @IsString()
    @IsNotEmpty()
    title: string;

    @IsString()
    @IsNotEmpty()
    description: string;

    @IsOptional()
    budget?: string | number;

    @IsString()
    @IsOptional()
    location: string;

    @IsString()
    @IsOptional()
    department?: string;

    @IsString()
    @IsOptional()
    municipality?: string;

    @IsOptional()
    lat?: string | number;

    @IsOptional()
    lng?: string | number;

    @IsString()
    @IsOptional()
    categoryId?: string;

    @IsArray()
    @IsString({ each: true })
    @IsOptional()
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

    async findAll(
        categoryId?: string,
        status?: string,
        authorRole?: string,
        authorId?: string,
        lat?: string,
        lng?: string,
        department?: string,
        municipality?: string,
        search?: string,
        page = 1,
        limit = 20
    ) {
        const skip = (page - 1) * limit;
        const conditions: Prisma.Sql[] = [];

        if (categoryId) {
            conditions.push(Prisma.sql`jp."categoryId" = ${categoryId}`);
        }
        if (status) {
            conditions.push(Prisma.sql`jp."status" = ${status}::"JobStatus"`);
        }
        if (authorId) {
            conditions.push(Prisma.sql`jp."authorId" = ${authorId}`);
        }
        if (authorRole) {
            conditions.push(Prisma.sql`u."role" = ${authorRole}::"Role"`);
        }
        if (search) {
            const searchPattern = `%${search}%`;
            conditions.push(Prisma.sql`(jp."title" ILIKE ${searchPattern} OR jp."description" ILIKE ${searchPattern})`);
        }

        const whereClause = conditions.length > 0
            ? Prisma.sql`WHERE ${Prisma.join(conditions, ' AND ')}`
            : Prisma.empty;

        // Sorting clause
        let orderByClause = Prisma.sql`ORDER BY jp."createdAt" DESC`;

        const userLat = lat ? parseFloat(lat) : null;
        const userLng = lng ? parseFloat(lng) : null;

        if (userLat !== null && userLng !== null && !isNaN(userLat) && !isNaN(userLng)) {
            orderByClause = Prisma.sql`
                ORDER BY 
                    CASE 
                        WHEN jp."lat" IS NOT NULL AND jp."lng" IS NOT NULL THEN
                            6371 * acos(
                                LEAST(1.0, GREATEST(-1.0, 
                                    cos(radians(${userLat})) * cos(radians(jp."lat")) * cos(radians(jp."lng") - radians(${userLng})) + 
                                    sin(radians(${userLat})) * sin(radians(jp."lat"))
                                ))
                            )
                        ELSE NULL
                    END ASC NULLS LAST
            `;
        } else if (department || municipality) {
            orderByClause = Prisma.sql`
                ORDER BY 
                    (CASE WHEN jp."municipality" = ${municipality || ''} THEN 2 ELSE 0 END) + 
                    (CASE WHEN jp."department" = ${department || ''} THEN 1 ELSE 0 END) DESC,
                    jp."createdAt" DESC
            `;
        }

        const query = Prisma.sql`
            SELECT jp.id
            FROM "JobPost" jp
            LEFT JOIN "User" u ON jp."authorId" = u.id
            ${whereClause}
            ${orderByClause}
            LIMIT ${limit} OFFSET ${skip}
        `;

        const resultIds = await this.prisma.$queryRaw<{ id: string }[]>(query);
        const ids = resultIds.map(row => row.id);

        if (ids.length === 0) return [];

        const posts = await this.prisma.jobPost.findMany({
            where: { id: { in: ids } },
            include: {
                author: { select: { id: true, name: true, role: true, profile: { select: { photoUrl: true } } } },
                category: true
            }
        });

        const idToIndex = new Map(ids.map((id, index) => [id, index]));
        return posts.sort((a, b) => (idToIndex.get(a.id) ?? 0) - (idToIndex.get(b.id) ?? 0));
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
        if (!post) throw new BadRequestException('Job post not found');

        const updated = await this.prisma.jobPost.update({
            where: { id },
            data: { status: status as JobStatus }
        });

        // If the client closes the job post, we don't increment their jobsCompleted,
        // because jobsCompleted is meant for the PROVIDER who did the work.
        // Providers get their stats incremented when the JobOffer is marked as COMPLETED in the chat.

        return updated;
    }

    async addReview(jobPostId: string, reviewerId: string, data: { rating: number, content: string }) {
        const post = await this.prisma.jobPost.findUnique({ where: { id: jobPostId } });
        if (!post) throw new BadRequestException('Job post not found');

        // Find the profile of the job post author (the person being reviewed)
        const profile = await this.prisma.profile.findUnique({ where: { userId: post.authorId } });
        if (!profile) throw new BadRequestException('Profile not found');

        // Create the review
        const review = await this.prisma.review.create({
            data: {
                content: data.content,
                rating: data.rating,
                authorId: reviewerId,
                profileId: profile.id
            }
        });

        // Recalculate average rating using db aggregation
        const aggregate = await this.prisma.review.aggregate({
            _avg: { rating: true },
            where: { profileId: profile.id }
        });
        const avgRating = aggregate._avg.rating || 0;

        await this.prisma.profile.update({
            where: { id: profile.id },
            data: { rating: avgRating }
        });

        return review;
    }

    async createOffer(jobPostId: string, senderId: string, data: { description: string, price: number, estimatedDays?: number, estimatedHours?: number }) {
        const post = await this.prisma.jobPost.findUnique({ where: { id: jobPostId } });
        if (!post) throw new BadRequestException('Job post not found');

        const offer = await this.prisma.jobOffer.create({
            data: {
                jobPostId,
                senderId,
                receiverId: post.authorId,
                description: data.description,
                price: data.price,
                estimatedDays: data.estimatedDays || null,
                estimatedHours: data.estimatedHours || null,
            },
            include: {
                sender: { select: { id: true, name: true, profile: { select: { photoUrl: true } } } },
                receiver: { select: { id: true, name: true, profile: { select: { photoUrl: true } } } },
                jobPost: { select: { id: true, title: true, authorId: true, status: true } }
            }
        });

        // Auto-send message to the chat
        const daysText = data.estimatedDays ? ` ${data.estimatedDays} d\u00edas` : '';
        const hoursText = data.estimatedHours ? ` ${data.estimatedHours} horas` : '';
        const timeText = (daysText || hoursText) ? ` ·${daysText}${hoursText}` : '';
        
        const chatContent = `[Propuesta] "${post.title}"\nDetalles: ${data.description}\nMonto: Q${data.price}${timeText}`;
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
        if (!offer) throw new BadRequestException('Offer not found');

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

    async editOffer(offerId: string, userId: string, data: { description?: string, price?: number, estimatedDays?: number, estimatedHours?: number }) {
        const offer = await this.prisma.jobOffer.findUnique({
            where: { id: offerId },
            include: { jobPost: { select: { title: true } } }
        });
        if (!offer) throw new BadRequestException('Offer not found');
        // Both sender and receiver can counter-propose
        if (offer.senderId !== userId && offer.receiverId !== userId) throw new BadRequestException('You are not part of this offer');

        const oldPrice = offer.price;
        const oldDays = offer.estimatedDays;
        const oldHours = offer.estimatedHours;
        const oldDesc = offer.description;

        const newPrice = data.price !== undefined ? data.price : oldPrice;
        const newDays = data.estimatedDays !== undefined ? data.estimatedDays : oldDays;
        const newHours = data.estimatedHours !== undefined ? data.estimatedHours : oldHours;
        const newDesc = data.description !== undefined ? data.description : oldDesc;

        const updated = await this.prisma.jobOffer.update({
            where: { id: offerId },
            data: {
                description: newDesc,
                price: newPrice,
                estimatedDays: newDays,
                estimatedHours: newHours,
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
        const oldDaysText = oldDays ? ` ${oldDays} d\u00edas` : '';
        const oldHoursText = oldHours ? ` ${oldHours} horas` : '';
        const oldTimeText = (oldDaysText || oldHoursText) ? ` ·${oldDaysText}${oldHoursText}` : '';

        const newDaysText = newDays ? ` ${newDays} d\u00edas` : '';
        const newHoursText = newHours ? ` ${newHours} horas` : '';
        const newTimeText = (newDaysText || newHoursText) ? ` ·${newDaysText}${newHoursText}` : '';

        const chatContent = `[Contra-propuesta] "${offer.jobPost.title}"\nAnterior: Q${oldPrice}${oldTimeText}\nNueva: Q${newPrice}${newTimeText}\nDetalles: ${newDesc}`;
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
        if (!offer) throw new BadRequestException('Offer not found');
        if (offer.status !== 'PENDING') throw new BadRequestException('Offer is not pending');

        const isSender = offer.senderId === userId;
        const isReceiver = offer.receiverId === userId;

        if (!isSender && !isReceiver) throw new BadRequestException('You are not part of this offer');

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
        if (!offer) throw new BadRequestException('Offer not found');
        if (offer.status !== 'ACCEPTED') throw new BadRequestException('Offer must be ACCEPTED to be completed');

        const isSender = offer.senderId === userId;
        const isReceiver = offer.receiverId === userId;
        if (!isSender && !isReceiver) throw new BadRequestException('You are not part of this offer');

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
                const daysToAdd = offer.estimatedDays ?? 0;
                const hoursToAdd = offer.estimatedHours ?? 0;
                await this.prisma.profile.updateMany({
                    where: { userId: providerUser.id },
                    data: {
                        jobsCompleted: { increment: 1 },
                        days: { increment: daysToAdd },
                        hours: { increment: hoursToAdd }
                    }
                });
            }
        }

        return updated;
    }

    async submitOfferReview(offerId: string, reviewerId: string, data: { rating: number; content?: string }) {
        const offer = await this.prisma.jobOffer.findUnique({ where: { id: offerId } });
        if (!offer) throw new BadRequestException('Offer not found');
        if (offer.status !== 'COMPLETED') throw new BadRequestException('Offer must be COMPLETED to leave a review');

        const isSender = offer.senderId === reviewerId;
        const isReceiver = offer.receiverId === reviewerId;
        if (!isSender && !isReceiver) throw new BadRequestException('You are not part of this offer');

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
        if (existing) throw new BadRequestException('You have already reviewed this job');

        const review = await this.prisma.review.create({
            data: {
                content: data.content || '',
                rating: data.rating,
                authorId: reviewerId,
                profileId: profile.id,
                offerId
            }
        });

        // Recalculate average rating using db aggregation
        const aggregate = await this.prisma.review.aggregate({
            _avg: { rating: true },
            where: { profileId: profile.id }
        });
        const avgRating = aggregate._avg.rating || 0;
        await this.prisma.profile.update({
            where: { id: profile.id },
            data: { rating: avgRating }
        });

        return review;
    }
}
