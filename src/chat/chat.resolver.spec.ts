import { Test, TestingModule } from '@nestjs/testing';
import { ChatResolver } from './chat.resolver';
import { ChatService } from './chat.service';
import { UnauthorizedException } from '@nestjs/common';
import { Chat } from '@prisma/client';
import { DeleteChatResponse } from './response/chat.response';

describe('ChatResolver', () => {
  let resolver: ChatResolver;
  let service: ChatService;

  const mockChat: Chat = {
    id: 'chat-id',
    name: 'Test Chat',
    isGroup: false,
    createdById: 'user-id',
    createdAt: new Date(),
    updatedAt: new Date(),
    deletedAt: null,
  };

  const mockChatService = {
    createChat: jest.fn(),
    updateChat: jest.fn(),
    deleteChat: jest.fn(),
  };

  const mockContext = {
    req: {
      user: {
        userId: 'user-id',
      },
    },
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ChatResolver,
        { provide: ChatService, useValue: mockChatService },
      ],
    }).compile();

    resolver = module.get<ChatResolver>(ChatResolver);
    service = module.get<ChatService>(ChatService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  // ------------------------
  // ✅ createChat
  // ------------------------
  describe('createChat', () => {
    it('should call service.createChat and return chat', async () => {
      mockChatService.createChat.mockResolvedValue(mockChat);

      const input = { name: 'Test Chat', isGroup: false };
      const result = await resolver.createChat(input, mockContext);

      expect(result).toEqual(mockChat);
      expect(mockChatService.createChat).toHaveBeenCalledWith(input, 'user-id');
    });
  });

  // ------------------------
  // ✅ updateChat
  // ------------------------
  describe('updateChat', () => {
    it('should throw UnauthorizedException if user is not authenticated', async () => {
      const unauthContext = { req: { user: null } };

      await expect(
        resolver.updateChat('New Name', 'chat-id', unauthContext),
      ).rejects.toThrow(UnauthorizedException);
    });

    it('should call service.updateChat and return updated chat', async () => {
      const updatedChat = { ...mockChat, name: 'New Name' };
      mockChatService.updateChat.mockResolvedValue(updatedChat);

      const result = await resolver.updateChat(
        'New Name',
        'chat-id',
        mockContext,
      );

      expect(result).toEqual(updatedChat);
      expect(mockChatService.updateChat).toHaveBeenCalledWith(
        'chat-id',
        'New Name',
      );
    });
  });

  // ------------------------
  // ✅ deleteChat
  // ------------------------
  describe('deleteChat', () => {
    it('should throw UnauthorizedException if user is not authenticated', async () => {
      const unauthContext = { req: { user: null } };

      await expect(
        resolver.deleteChat('chat-id', unauthContext),
      ).rejects.toThrow(UnauthorizedException);
    });

    it('should call service.deleteChat and return success response', async () => {
      mockChatService.deleteChat.mockResolvedValue(true);

      const result = await resolver.deleteChat('chat-id', mockContext);

      expect(result).toEqual({
        success: true,
        message: 'Chat deleted successfully',
      });
      expect(mockChatService.deleteChat).toHaveBeenCalledWith('chat-id');
    });
  });
});
