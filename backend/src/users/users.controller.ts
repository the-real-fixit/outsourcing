import { Controller, Get, Put, Delete, Body, UseGuards, Request, Param, Query } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { UsersService, UpdateProfileDto, UpdateSettingsDto, ChangePasswordDto } from './users.service';

@Controller('users')
export class UsersController {
    constructor(private readonly usersService: UsersService) { }

    @Get('providers')
    async getProviders(
        @Query('page') page?: string,
        @Query('limit') limit?: string,
    ) {
        let parsedPage = page ? parseInt(page, 10) : 1;
        let parsedLimit = limit ? parseInt(limit, 10) : 20;

        if (isNaN(parsedPage) || parsedPage < 1) parsedPage = 1;
        if (isNaN(parsedLimit) || parsedLimit < 1) parsedLimit = 20;
        if (parsedLimit > 100) parsedLimit = 100; // Enforce maximum limit to prevent DB saturation

        return this.usersService.findAllProviders(parsedPage, parsedLimit);
    }

    @Get('public/:id')
    async getPublicProfile(@Param('id') id: string) {
        return this.usersService.getPublicProfile(id);
    }

    @Get('public/:id/reviews')
    async getPublicReviews(
        @Param('id') id: string,
        @Query('page') page?: string,
        @Query('limit') limit?: string,
    ) {
        let parsedPage = page ? parseInt(page, 10) : 1;
        let parsedLimit = limit ? parseInt(limit, 10) : 5;

        if (isNaN(parsedPage) || parsedPage < 1) parsedPage = 1;
        if (isNaN(parsedLimit) || parsedLimit < 1) parsedLimit = 5;
        if (parsedLimit > 50) parsedLimit = 50; // Enforce maximum limit to prevent DB saturation

        return this.usersService.findPublicReviews(id, parsedPage, parsedLimit);
    }

    @UseGuards(AuthGuard('jwt'))
    @Get('profile')
    async getProfile(@Request() req) {
        return this.usersService.getProfile(req.user.userId);
    }

    @UseGuards(AuthGuard('jwt'))
    @Put('profile')
    async updateProfile(@Request() req, @Body() data: UpdateProfileDto) {
        return this.usersService.updateProfile(req.user.userId, data);
    }

    @UseGuards(AuthGuard('jwt'))
    @Get('settings')
    async getSettings(@Request() req) {
        return this.usersService.getSettings(req.user.userId);
    }

    @UseGuards(AuthGuard('jwt'))
    @Put('settings')
    async updateSettings(@Request() req, @Body() data: UpdateSettingsDto) {
        return this.usersService.updateSettings(req.user.userId, data);
    }

    @UseGuards(AuthGuard('jwt'))
    @Put('change-password')
    async changePassword(@Request() req, @Body() data: ChangePasswordDto) {
        return this.usersService.changePassword(req.user.userId, data);
    }

    @UseGuards(AuthGuard('jwt'))
    @Delete('me')
    async deleteAccount(@Request() req) {
        return this.usersService.deleteAccount(req.user.userId);
    }
}
