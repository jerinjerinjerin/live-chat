import { BadRequestException, Injectable } from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';
import { CreateChatInput } from './dto/chat.dto';
import { Chat } from '@prisma/client';

@Injectable()
export class ChatService {
  constructor(private readonly prisma: PrismaService) {}

  async createChat(input: CreateChatInput, createdById: string): Promise<Chat> {
    const { name } = input;

    const alreadyIsName = await this.prisma.chat.findFirst({
      where: { name: name || undefined },
    });

    if (alreadyIsName) {
      throw new BadRequestException('Chat name already exists');
    }

    const validUser = await this.prisma.user.findUnique({
      where: { id: createdById },
    });

    if (!validUser) {
      throw new BadRequestException('Invalid user');
    }

    const chat = await this.prisma.chat.create({
      data: {
        name: name || undefined,
        createdById: createdById,
      },
      include: {
        participants: true,
        messages: true,
        createdBy: true,
      },
    });

    return chat;
  }

  async updateChat(chatId: string, name: string): Promise<Chat> {
    const validateChat = await this.prisma.chat.findUnique({
      where: { id: chatId },
    });

    if (!validateChat) {
      throw new BadRequestException('Chat not found');
    }

    const updatedChat = await this.prisma.chat.update({
      where: { id: chatId },
      data: { name },
      include: {
        participants: true,
        messages: true,
        createdBy: true,
      },
    });

    return updatedChat;
  }

  async deleteChat(id: string): Promise<boolean> {
    const validateChat = await this.prisma.chat.findUnique({
      where: { id },
    });

    if (!validateChat) {
      throw new BadRequestException('Chat not found');
    }

    await this.prisma.chat.delete({
      where: { id },
      include: {
        participants: true,
        messages: true,
        createdBy: true,
      },
    });

    return true;
  }
}
