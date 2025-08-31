import { Test, TestingModule } from '@nestjs/testing';
import { ChatService } from './chat.service';
import { PrismaService } from 'src/prisma/prisma.service';
import { BadRequestException } from '@nestjs/common';
import { Chat, Prisma } from '@prisma/client';

describe('ChatService', () => {
  let service: ChatService;
  let prisma: PrismaService;

  const mockChat = {
    id: 'chat-id',
    name: 'Test Chat',
    isGroup: false,
    createdById: 'user-id',
    createdAt: new Date(),
    updatedAt: new Date(),
    deletedAt: null,
    participants: [],
    messages: [],
    createdBy: {
      id: 'user-id',
      name: 'John',
      email: 'john@example.com',
      password: 'secret',
      isActive: true,
      isEmailVerified: true,
      isPaid: false,
      isGoogleUser: false,
      role: 'USER',
      createdAt: new Date(),
      updatedAt: new Date(),
      failedLoginAttempts: 0,
      avatarUrl: null,
      refreshToken: null,
      refreshTokenExpiry: null,
      otp: null,
      otpExpiresAt: null,
      lastLoginAt: null,
      lastActivityAt: null,
      deletedAt: null,
    },
  } as unknown as Chat;

  const mockUser = { id: 'user-id' };

  const prismaMock = {
    chat: {
      findFirst: jest.fn(),
      create: jest.fn(),
      findUnique: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
    },
    user: {
      findUnique: jest.fn(),
    },
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ChatService,
        { provide: PrismaService, useValue: prismaMock },
      ],
    }).compile();

    service = module.get<ChatService>(ChatService);
    prisma = module.get<PrismaService>(PrismaService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  // ---------------------------
  // ✅ createChat()
  // ---------------------------
  describe('createChat', () => {
    it('should throw if chat name already exists', async () => {
      (prisma.chat.findFirst as jest.Mock).mockResolvedValue(mockChat);

      await expect(
        service.createChat({ name: 'Test Chat', isGroup: false }, 'user-id'),
      ).rejects.toThrow(BadRequestException);

      expect(prisma.chat.findFirst).toHaveBeenCalledWith({
        where: { name: 'Test Chat' },
      });
    });

    it('should throw if user is invalid', async () => {
      (prisma.chat.findFirst as jest.Mock).mockResolvedValue(null);
      (prisma.user.findUnique as jest.Mock).mockResolvedValue(null);

      await expect(
        service.createChat(
          { name: 'New Chat', isGroup: false },
          'invalid-user',
        ),
      ).rejects.toThrow(BadRequestException);
    });

    it('should create chat if name is unique and user is valid', async () => {
      (prisma.chat.findFirst as jest.Mock).mockResolvedValue(null);
      (prisma.user.findUnique as jest.Mock).mockResolvedValue(mockUser);
      (prisma.chat.create as jest.Mock).mockResolvedValue(mockChat);

      const result = await service.createChat(
        { name: 'Unique Chat', isGroup: false },
        'user-id',
      );

      expect(result).toEqual(mockChat);
      expect(prisma.chat.create).toHaveBeenCalled();
    });
  });

  // ---------------------------
  // ✅ updateChat()
  // ---------------------------
  describe('updateChat', () => {
    it('should throw if chat not found', async () => {
      (prisma.chat.findUnique as jest.Mock).mockResolvedValue(null);

      await expect(
        service.updateChat('invalid-id', 'New Name'),
      ).rejects.toThrow(BadRequestException);
    });

    it('should update chat if exists', async () => {
      (prisma.chat.findUnique as jest.Mock).mockResolvedValue(mockChat);
      (prisma.chat.update as jest.Mock).mockResolvedValue({
        ...mockChat,
        name: 'New Name',
      });

      const result = await service.updateChat('chat-id', 'New Name');

      expect(result.name).toBe('New Name');
      expect(prisma.chat.update).toHaveBeenCalled();
    });
  });

  // ---------------------------
  // ✅ deleteChat()
  // ---------------------------
  describe('deleteChat', () => {
    it('should throw if chat not found', async () => {
      (prisma.chat.findUnique as jest.Mock).mockResolvedValue(null);

      await expect(service.deleteChat('invalid-id')).rejects.toThrow(
        BadRequestException,
      );
    });

    it('should delete chat if it exists', async () => {
      (prisma.chat.findUnique as jest.Mock).mockResolvedValue(mockChat);
      (prisma.chat.delete as jest.Mock).mockResolvedValue(mockChat);

      const result = await service.deleteChat('chat-id');

      expect(result).toBe(true);
      expect(prisma.chat.delete).toHaveBeenCalled();
    });
  });
});
