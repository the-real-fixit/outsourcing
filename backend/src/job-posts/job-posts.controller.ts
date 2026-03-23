import { Controller, Get, Post, Patch, Body, UseGuards, Request, Query, Param } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { JobPostsService, CreateJobPostDto } from './job-posts.service';

@Controller('job-posts')
export class JobPostsController {
    constructor(private readonly jobPostsService: JobPostsService) { }

    @Get()
    async getJobPosts(
        @Query('categoryId') categoryId?: string,
        @Query('status') status?: string,
        @Query('authorRole') authorRole?: string,
        @Query('authorId') authorId?: string,
        @Query('lat') lat?: string,
        @Query('lng') lng?: string,
        @Query('department') department?: string,
        @Query('municipality') municipality?: string,
        @Query('search') search?: string
    ) {
        return this.jobPostsService.findAll(categoryId, status, authorRole, authorId, lat, lng, department, municipality, search);
    }

    @UseGuards(AuthGuard('jwt'))
    @Post()
    async createJobPost(@Request() req, @Body() data: CreateJobPostDto) {
        return this.jobPostsService.create(req.user.userId, data);
    }

    // Static routes MUST come before :id to avoid being caught by the param route
    @UseGuards(AuthGuard('jwt'))
    @Get('offers/my')
    async getMyOffers(@Request() req) {
        return this.jobPostsService.getOffersForUser(req.user.userId);
    }

    @UseGuards(AuthGuard('jwt'))
    @Get('offers/between/:peerId')
    async getOffersBetween(@Request() req, @Param('peerId') peerId: string) {
        return this.jobPostsService.getOffersBetweenUsers(req.user.userId, peerId);
    }

    @UseGuards(AuthGuard('jwt'))
    @Patch('offers/:offerId/respond')
    async respondToOffer(@Request() req, @Param('offerId') offerId: string, @Body('status') status: string) {
        return this.jobPostsService.respondToOffer(offerId, req.user.userId, status);
    }

    @Get(':id')
    async getJobPost(@Param('id') id: string) {
        return this.jobPostsService.findOne(id);
    }

    @UseGuards(AuthGuard('jwt'))
    @Patch(':id/status')
    async updateJobStatus(@Request() req, @Param('id') id: string, @Body('status') status: string) {
        return this.jobPostsService.updateStatus(id, status, req.user.userId);
    }

    @UseGuards(AuthGuard('jwt'))
    @Post(':id/review')
    async addReview(@Request() req, @Param('id') id: string, @Body() data: { rating: number, content: string }) {
        return this.jobPostsService.addReview(id, req.user.userId, data);
    }

    @UseGuards(AuthGuard('jwt'))
    @Post(':id/offer')
    async createOffer(@Request() req, @Param('id') id: string, @Body() data: { description: string, price: number, estimatedDays?: number }) {
        return this.jobPostsService.createOffer(id, req.user.userId, data);
    }

    @UseGuards(AuthGuard('jwt'))
    @Patch('offers/:offerId/edit')
    async editOffer(@Request() req, @Param('offerId') offerId: string, @Body() data: { description?: string, price?: number, estimatedDays?: number }) {
        return this.jobPostsService.editOffer(offerId, req.user.userId, data);
    }

    @UseGuards(AuthGuard('jwt'))
    @Patch('offers/:offerId/approve')
    async approveOffer(@Request() req, @Param('offerId') offerId: string) {
        return this.jobPostsService.approveOffer(offerId, req.user.userId);
    }

    @UseGuards(AuthGuard('jwt'))
    @Patch('offers/:offerId/complete')
    async completeOffer(@Request() req, @Param('offerId') offerId: string) {
        return this.jobPostsService.completeOffer(offerId, req.user.userId);
    }

    @UseGuards(AuthGuard('jwt'))
    @Post('offers/:offerId/review')
    async submitOfferReview(@Request() req, @Param('offerId') offerId: string, @Body() data: { rating: number; content?: string }) {
        return this.jobPostsService.submitOfferReview(offerId, req.user.userId, data);
    }
}

