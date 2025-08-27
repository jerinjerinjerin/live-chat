import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { CreateUserInput } from './dto/create-user.input';
import { PrismaService } from 'src/prisma/prisma.service';
import { InjectRedis } from '@nestjs-modules/ioredis';
import * as bcrypt from 'bcryptjs';
import Redis from 'ioredis';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class UserService {
  constructor(
    private readonly prisma: PrismaService,
    @InjectRedis() private readonly redis: Redis,
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
  ) {}

  async registerUser(data: CreateUserInput): Promise<string> {
    const exists = await this.prisma.user.findUnique({
      where: { email: data.email },
    });

    if (exists) throw new BadRequestException('Email already exists');

    const hashPassword = await bcrypt.hash(data.password, 10);

    const otp = Math.floor(100000 + Math.random() * 900000).toString();

    await this.redis.set(
      `pending_user: ${data.email}`,
      JSON.stringify({
        ...data,
        password: hashPassword,
        otp,
        attempts: 0,
        lockedUntil: null,
      }),
      'EX',
      300,
    );
    return 'User registered successfully. Please verify your email with the OTP sent.';
  }

  async verifyUser(
    otp: string,
    email: string,
  ): Promise<{ accessToken: string; refreshToken: string }> {
    const pendingUserStr = await this.redis.get(`pending_user: ${email}`);

    if (!pendingUserStr) {
      throw new BadRequestException('invalid otp No pending user found');
    }

    const pendingUser = JSON.parse(pendingUserStr);

    if (pendingUser.lockedUntil && Date.now() < pendingUser.lockedUntil) {
      throw new ForbiddenException(
        'Too many attempts. Please try again later.',
      );
    }

    if (pendingUser.otp !== otp) {
      pendingUser.attempts += 1;

      if (pendingUser.attempts >= 3) {
        pendingUser.lockedUntil = Date.now() + 5 * 60 * 1000;
      }

      await this.redis.set(
        `pending_user: ${email}`,
        JSON.stringify(pendingUser),
        'EX',
        300,
      );
      throw new UnauthorizedException(
        `Invalid OTP. You have ${Math.max(0, 3 - pendingUser.attempts)}`,
      );
    }

    const newUser = await this.prisma.user.create({
      data: {
        name: pendingUser.name,
        email: pendingUser.email,
        password: pendingUser.password,
        role: pendingUser.role,
        avatarUrl: pendingUser?.avatarUrl,
      },
    });

    await this.redis.del(`pending_user: ${email}`);

    const accessToken = await this.jwtService.signAsync(
      { sub: newUser.id, email: newUser.email },
      {
        secret: this.configService.get<string>('JWT_ACCESS_TOKEN_SECRET'),
        expiresIn: this.configService.get<string>(
          'JWT_ACCESS_TOKEN_SECRET_EXPIRES_IN',
        ),
      },
    );

    const refreshToken = await this.jwtService.signAsync(
      { sub: newUser.id, email: newUser.email },
      {
        secret: this.configService.get<string>('JWT_REFRESH_TOKEN_SECRET'),
        expiresIn: this.configService.get<string>(
          'JWT_REFRESH_TOKEN_SECRET_EXPIRES_IN',
        ),
      },
    );

    await this.prisma.user.update({
      where: { id: newUser.id },
      data: {
        refreshToken: await bcrypt.hash(refreshToken, 10),
        refreshTokenExpiry: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days
      },
    });

    return {
      accessToken,
      refreshToken,
    };
  }
}
