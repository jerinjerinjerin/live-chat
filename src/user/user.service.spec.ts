import { PrismaService } from 'src/prisma/prisma.service';
import { UserService } from './user.service';
import * as bcrypt from 'bcryptjs';

jest.mock('bcryptjs', () => ({
  ...jest.requireActual('bcryptjs'),
  hash: jest.fn(),
}));

import { Test, TestingModule } from '@nestjs/testing';
import { BadRequestException } from '@nestjs/common';
import { UserRole } from '@prisma/client';

describe('userService', () => {
  let service: UserService;
  const prismaMock = {
    user: {
      findUnique: jest.fn(),
    },
  };

  const redisMock = {
    set: jest.fn(),
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

    it('should return user if email already exists', async () => {
      prismaMock.user.findUnique.mockResolvedValue(mockInput);

      await expect(service.registerUser(mockInput)).rejects.toThrow(
        BadRequestException,
      );
      (bcrypt.hash as jest.Mock).mockResolvedValue('hashedPassword');
      prismaMock.user.findUnique.mockResolvedValue(null);

      jest
        .spyOn(bcrypt, 'hash')
        .mockImplementation(async () => 'hashedPassword');

      const result = await service.registerUser(mockInput);

      expect(bcrypt.hash).toHaveBeenCalledWith(mockInput.password, 10);
      expect(redisMock.set).toHaveBeenCalledTimes(1);

      const [key, value, ex, ttl] = redisMock.set.mock.calls[0];
      expect(key).toBe(`pending_user: ${mockInput.email}`);
      expect(JSON.parse(value as string)).toMatchObject({
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
});
