import { Controller, Get, Put, Body, UseGuards, Request, Param } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { UsersService, UpdateProfileDto, UpdateSettingsDto } from './users.service';

@Controller('users')
export class UsersController {
    constructor(private readonly usersService: UsersService) { }

    @Get('providers')
    async getProviders() {
        return this.usersService.findAllProviders();
    }

    @Get('public/:id')
    async getPublicProfile(@Param('id') id: string) {
        return this.usersService.getPublicProfile(id);
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
}
