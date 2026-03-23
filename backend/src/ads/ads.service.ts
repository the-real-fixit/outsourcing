import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { Prisma, Role } from '@prisma/client';

@Injectable()
export class AdsService {
    constructor(private prisma: PrismaService) { }

    async getHighlightedAds(authorRole?: string) {
        // 1. Try to fetch active PromotedAds
        const wherePromoted: Prisma.PromotedAdWhereInput = {
            status: 'ACTIVE',
            endDate: {
                gt: new Date(),
            },
        };

        if (authorRole) {
            wherePromoted.jobPost = {
                author: {
                    role: authorRole as Role
                }
            };
        }

        const promotedAds = await this.prisma.promotedAd.findMany({
            where: wherePromoted,
            include: {
                jobPost: {
                    include: {
                        category: true,
                    }
                },
                profile: {
                    include: {
                        user: true,
                    }
                },
            },
            take: 4,
        });

        // If we have 4, return them
        if (promotedAds.length >= 4) {
            return promotedAds.map(ad => ({
                id: ad.id,
                title: ad.jobPost?.title || ad.profile?.user?.name || 'Anuncio Destacado', // Simple fallback
                description: ad.jobPost?.description || ad.profile?.bio || '',
                imageUrl: ad.images[0] || ad.jobPost?.photos[0] || ad.profile?.photoUrl || null,
                type: ad.jobPost ? 'JOB' : 'PROFILE',
                targetId: ad.jobPostId || ad.profileId,
                isPromoted: true,
            }));
        }

        // 2. If not enough, fetch recent JobPosts to fill the gap
        const needed = 4 - promotedAds.length;

        // We need to exclude job posts that are already in promotedAds
        const existingJobPostIds = promotedAds
            .map(ad => ad.jobPostId)
            .filter((id): id is string => id !== null);

        const whereRecent: Prisma.JobPostWhereInput = {
            status: 'OPEN',
            id: {
                notIn: existingJobPostIds,
            },
        };

        if (authorRole) {
            whereRecent.author = {
                role: authorRole as Role
            };
        }

        const recentJobs = await this.prisma.jobPost.findMany({
            where: whereRecent,
            include: {
                category: true,
            },
            orderBy: {
                createdAt: 'desc',
            },
            take: needed,
        });

        // Format promoted ads
        const formattedPromoted = promotedAds.map(ad => ({
            id: ad.id,
            title: ad.jobPost?.title || 'Anuncio',
            description: ad.jobPost?.description || '',
            imageUrl: ad.images[0] || ad.jobPost?.photos[0] || null,
            type: 'PROMOTED',
            targetId: ad.jobPostId || ad.profileId,
            isPromoted: true,
            categoryName: ad.jobPost?.category?.name || 'General',
        }));

        // Format recent jobs
        const formattedRecent = recentJobs.map(job => ({
            id: job.id,
            title: job.title,
            description: job.description,
            imageUrl: job.photos[0] || null,
            type: 'JOB',
            targetId: job.id,
            isPromoted: false,
            categoryName: job.category?.name || 'Trabajo',
        }));

        return [...formattedPromoted, ...formattedRecent];
    }
}
