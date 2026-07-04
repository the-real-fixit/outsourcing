import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { User, Prisma } from '@prisma/client';
import { IsString, IsOptional, IsBoolean, IsArray } from 'class-validator';

export class UpdateProfileDto {
    @IsOptional() @IsString() bio?: string;
    @IsOptional() @IsString() photoUrl?: string;
    @IsOptional() @IsString() phone?: string;
    @IsOptional() @IsString() address?: string;
    @IsOptional() @IsString() department?: string;
    @IsOptional() @IsString() municipality?: string;
    @IsOptional() lat?: number | string;
    @IsOptional() lng?: number | string;
    @IsOptional() @IsArray() categoryIds?: string[];
    @IsOptional() @IsString() name?: string;
    @IsOptional() @IsBoolean() canTravel?: boolean;
    @IsOptional() @IsBoolean() hasVehicle?: boolean;
    @IsOptional() @IsString() travelDetails?: string;
}

export class UpdateSettingsDto {
    @IsOptional() @IsBoolean() notificationsEnabled?: boolean;
    @IsOptional() @IsBoolean() emailNotifications?: boolean;
    @IsOptional() @IsBoolean() darkMode?: boolean;
    @IsOptional() @IsString() language?: string;
}

@Injectable()
export class UsersService {
    constructor(private prisma: PrismaService) { }

    async findOne(email: string): Promise<User | null> {
        return this.prisma.user.findUnique({
            where: { email },
        });
    }

    async create(data: Prisma.UserCreateInput): Promise<User> {
        return this.prisma.user.create({
            data,
        });
    }

    async findAllProviders(page = 1, limit = 20): Promise<any> {
        const skip = (page - 1) * limit;
        const [providers, total] = await Promise.all([
            this.prisma.user.findMany({
                where: {
                    role: 'PROVIDER'
                },
                include: {
                    profile: {
                        include: {
                            categories: true
                        }
                    }
                },
                skip,
                take: limit,
            }),
            this.prisma.user.count({
                where: { role: 'PROVIDER' }
            })
        ]);

        return {
            providers,
            total,
            page,
            limit,
            totalPages: Math.ceil(total / limit)
        };
    }

    async getProfile(userId: string) {
        return this.prisma.user.findUnique({
            where: { id: userId },
            include: {
                profile: {
                    include: {
                        categories: true
                    }
                }
            }
        });
    }

    async getPublicProfile(userId: string) {
        return this.prisma.user.findUnique({
            where: { id: userId },
            select: {
                id: true,
                name: true,
                email: true,
                role: true,
                profile: {
                    include: {
                        categories: true,
                        profileObservations: {
                            orderBy: { createdAt: 'desc' }
                        }
                    }
                }
            }
        });
    }

    async findPublicReviews(userId: string, page = 1, limit = 5) {
        const skip = (page - 1) * limit;

        const user = await this.prisma.user.findUnique({
            where: { id: userId },
            select: { profile: { select: { id: true } } }
        });

        if (!user || !user.profile) {
            return {
                reviews: [],
                total: 0,
                page,
                limit,
                totalPages: 0
            };
        }

        const [reviews, total] = await Promise.all([
            this.prisma.review.findMany({
                where: { profileId: user.profile.id },
                include: {
                    author: {
                        select: {
                            id: true,
                            name: true,
                            profile: { select: { photoUrl: true } }
                        }
                    }
                },
                orderBy: { createdAt: 'desc' },
                skip,
                take: limit,
            }),
            this.prisma.review.count({
                where: { profileId: user.profile.id }
            })
        ]);

        return {
            reviews,
            total,
            page,
            limit,
            totalPages: Math.ceil(total / limit)
        };
    }

    async updateProfile(userId: string, data: UpdateProfileDto) {
        let { bio, photoUrl, phone, address, department, municipality, lat, lng, categoryIds, name, canTravel, hasVehicle, travelDetails } = data;

        if (name) {
            await this.prisma.user.update({
                where: { id: userId },
                data: { name }
            });
        }

        let latNumber = lat ? parseFloat(lat as string) : null;
        let lngNumber = lng ? parseFloat(lng as string) : null;

        await this.prisma.profile.upsert({
            where: { userId },
            update: { 
                bio, photoUrl, phone, address, department, municipality, 
                lat: latNumber, lng: lngNumber, 
                canTravel: canTravel ?? false, hasVehicle: hasVehicle ?? false, travelDetails: travelDetails || null,
                categories: categoryIds ? { set: categoryIds.map(id => ({ id })) } : undefined
            },
            create: { 
                userId, bio, photoUrl, phone, address, department, municipality, 
                lat: latNumber, lng: lngNumber, 
                canTravel: canTravel ?? false, hasVehicle: hasVehicle ?? false, travelDetails: travelDetails || null,
                categories: categoryIds ? { connect: categoryIds.map(id => ({ id })) } : undefined
            }
        });

        return this.getProfile(userId);
    }

    async getSettings(userId: string) {
        const settings = await this.prisma.settings.findUnique({
            where: { userId }
        });
        if (!settings) {
            return {
                notificationsEnabled: true,
                emailNotifications: true,
                darkMode: false,
                language: 'es'
            };
        }
        return settings;
    }

    async updateSettings(userId: string, data: UpdateSettingsDto) {
        const { notificationsEnabled, emailNotifications, darkMode, language } = data;
        return this.prisma.settings.upsert({
            where: { userId },
            update: { notificationsEnabled, emailNotifications, darkMode, language },
            create: { userId, notificationsEnabled, emailNotifications, darkMode, language }
        });
    }
}
