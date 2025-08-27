import { PrismaService } from 'src/prisma/prisma.service';
import { UserService } from './user.service';
import * as bcrypt from 'bcryptjs';

jest.mock('bcryptjs', () => ({
  ...jest.requireActual('bcryptjs'),
  compare: jest.fn(),
  hash: jest.fn(),
}));

import { Test, TestingModule } from '@nestjs/testing';
import {
  BadRequestException,
  ForbiddenException,
  UnauthorizedException,
} from '@nestjs/common';
import { UserRole } from '@prisma/client';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { TokenService } from 'src/utils/token.service';

describe('userService', () => {
  let service: UserService;
  const prismaMock = {
    user: {
      findUnique: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
    },
  };

  const redisMock = {
    set: jest.fn(),
    get: jest.fn(),
    del: jest.fn(),
  };

  const jwtMoke = {
    signAsync: jest.fn(),
  };

  const configMock = {
    get: jest.fn((key) => {
      if (key === 'JWT_ACCESS_TOKEN_SECRET') return 'access-secret';
      if (key === 'JWT_ACCESS_TOKEN_SECRET_EXPIRES_IN') return '15m';
      if (key === 'JWT_REFRESH_TOKEN_SECRET') return 'refresh-secret';
      if (key === 'JWT_REFRESH_TOKEN_SECRET_EXPIRES_IN') return '7d';
    }),
  };

  const tokenServiceMock = {
    generateTokens: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        UserService,
        { provide: PrismaService, useValue: prismaMock },
        {
          provide: 'default_IORedisModuleConnectionToken',
          useValue: redisMock,
        },
        { provide: JwtService, useValue: jwtMoke },
        { provide: ConfigService, useValue: configMock },
        { provide: TokenService, useValue: tokenServiceMock },
      ],
    }).compile();

    service = module.get<UserService>(UserService);
  });

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('register', () => {
    const mockInput = {
      name: 'test',
      email: 'test@gmail.com',
      password: 'test password',
      role: UserRole.USER,
    };

    it('should throw BadRequestException if email exists', async () => {
      prismaMock.user.findUnique.mockResolvedValue(mockInput);

      await expect(service.registerUser(mockInput)).rejects.toThrow(
        BadRequestException,
      );
      expect(prismaMock.user.findUnique).toHaveBeenCalledWith({
        where: { email: mockInput.email },
      });
    });

    it('should register user successfully and store in Redis', async () => {
      prismaMock.user.findUnique.mockResolvedValue(null);
      (bcrypt.hash as jest.Mock).mockResolvedValue('hashedPassword');

      const result = await service.registerUser(mockInput);

      expect(bcrypt.hash).toHaveBeenCalledWith(mockInput.password, 10);
      expect(redisMock.set).toHaveBeenCalledTimes(1);
      const [key, value, ex, ttl] = redisMock.set.mock.calls[0];
      expect(key).toBe(`pending_user: ${mockInput.email}`);
      expect(JSON.parse(value)).toMatchObject({
        email: mockInput.email,
        password: 'hashedPassword',
      });
      expect(ex).toBe('EX');
      expect(ttl).toBe(300);
      expect(result).toBe(
        'User registered successfully. Please verify your email with the OTP sent.',
      );
    });
  });

  describe('verifyUser', () => {
    const email = 'test@gmail.com';
    const validOtp = '123456';

    it('should throw BadRequestException if no pending user found', async () => {
      redisMock.get.mockResolvedValue(null);
      await expect(service.verifyUser(validOtp, email)).rejects.toThrow(
        BadRequestException,
      );
    });

    it('should throw ForbiddenException if locked', async () => {
      const lockedUser = {
        otp: validOtp,
        attempts: 3,
        lockedUntil: Date.now() + 10000,
        email: email,
        password: 'hashedPassword',
        name: 'test',
        role: UserRole.USER,
      };

      redisMock.get.mockResolvedValue(JSON.stringify(lockedUser));

      await expect(service.verifyUser(validOtp, email)).rejects.toThrow(
        ForbiddenException,
      );
    });

    it('should throw UnauthorizedException and increment attempts if otp is wrong', async () => {
      const pendingUser = {
        otp: '654321',
        attempts: 1,
        lockedUntil: null,
      };
      redisMock.get.mockResolvedValue(JSON.stringify(pendingUser));

      await expect(service.verifyUser(validOtp, email)).rejects.toThrow(
        UnauthorizedException,
      );
      expect(redisMock.set).toHaveBeenCalled();
    });

    it('should create user, generate tokens, and update refreshToken if OTP is valid', async () => {
      const pendingUser = {
        name: 'test',
        email,
        password: 'hashedPassword',
        otp: validOtp,
        attempts: 0,
        lockedUntil: null,
      };
      redisMock.get.mockResolvedValue(JSON.stringify(pendingUser));
      prismaMock.user.create.mockResolvedValue({ id: 1, email });
      jwtMoke.signAsync
        .mockResolvedValueOnce('accessToken')
        .mockResolvedValueOnce('refreshToken');
      (bcrypt.hash as jest.Mock).mockResolvedValue('hashedRefreshToken');

      const result = await service.verifyUser(validOtp, email);

      expect(prismaMock.user.create).toHaveBeenCalled();
      expect(redisMock.del).toHaveBeenCalledWith(`pending_user: ${email}`);
      expect(prismaMock.user.update).toHaveBeenCalledWith({
        where: { id: 1 },
        data: {
          refreshToken: 'hashedRefreshToken',
          refreshTokenExpiry: expect.any(Date),
          isEmailVerified: true,
        },
      });

      expect(result).toEqual({
        accessToken: 'accessToken',
        refreshToken: 'refreshToken',
      });
    });
  });

  describe('loginUser', () => {
    const email = 'test@example.com';
    const password = 'password123';

    it('should throw if user not found', async () => {
      prismaMock.user.findUnique.mockResolvedValue(null);

      await expect(service.loginUser(email, password)).rejects.toThrow(
        UnauthorizedException,
      );
    });

    it('should throw if password invalid', async () => {
      prismaMock.user.findUnique.mockResolvedValue({
        id: 1,
        email,
        password: 'hashedPassword',
      });

      (bcrypt.compare as jest.Mock).mockResolvedValue(false);

      await expect(service.loginUser(email, password)).rejects.toThrow(
        UnauthorizedException,
      );
    });

    it('should return tokens on success', async () => {
      const mockUser = { id: 1, email, password: 'hashedPassword' };
      prismaMock.user.findUnique.mockResolvedValue(mockUser);

      (bcrypt.compare as jest.Mock).mockResolvedValue(true);

      const tokenServiceMock = service['tokenService'];
      jest.spyOn(tokenServiceMock, 'generateTokens').mockResolvedValue({
        accessToken: 'access-token',
        refreshToken: 'refresh-token',
      });

      const result = await service.loginUser(email, password);

      expect(result).toEqual({
        message: 'Login successful',
        accessToken: 'access-token',
        refreshToken: 'refresh-token',
      });
    });
  });
});
