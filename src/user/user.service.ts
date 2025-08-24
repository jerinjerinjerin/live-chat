import { BadRequestException, Injectable } from '@nestjs/common';
import { CreateUserInput } from './dto/create-user.input';
import { PrismaService } from 'src/prisma/prisma.service';
import { InjectRedis } from '@nestjs-modules/ioredis';
import * as bcrypt from 'bcryptjs';
import Redis from 'ioredis';

@Injectable()
export class UserService {
  constructor(
    private readonly prisma: PrismaService,
    @InjectRedis() private readonly redis: Redis,
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
      }),
      'EX',
      300,
    );
    return 'User registered successfully. Please verify your email with the OTP sent.';
  }
}
