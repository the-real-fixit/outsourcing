import { Injectable, UnauthorizedException } from '@nestjs/common';
import { UsersService } from '../users/users.service';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import { Prisma, User } from '@prisma/client';

@Injectable()
export class AuthService {
    constructor(
        private usersService: UsersService,
        private jwtService: JwtService,
    ) { }

    async validateUser(email: string, pass: string): Promise<Omit<User, 'password'> | null> {
        const normalizedEmail = email.toLowerCase().trim();
        const user = await this.usersService.findOne(normalizedEmail);
        if (user && (await bcrypt.compare(pass, user.password))) {
            const { password, ...result } = user;
            return result;
        }
        return null;
    }

    async login(user: Omit<User, 'password'>) {
        const payload = { email: user.email, sub: user.id, role: user.role };
        return {
            access_token: this.jwtService.sign(payload),
            user: {
                id: user.id,
                name: user.name,
                email: user.email,
                role: user.role
            }
        };
    }

    async register(data: Prisma.UserCreateInput) {
        const normalizedEmail = data.email.toLowerCase().trim();
        const hashedPassword = await bcrypt.hash(data.password, 10);
        const user = await this.usersService.create({
            ...data,
            email: normalizedEmail,
            password: hashedPassword,
        });
        return this.login(user);
    }
}
