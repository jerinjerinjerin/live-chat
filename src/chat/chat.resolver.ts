import { Resolver, Mutation, Args, Context } from '@nestjs/graphql';
import { UnauthorizedException, UseGuards } from '@nestjs/common';
import { ChatService } from './chat.service';
import { CreateChatInput } from './dto/chat.dto';
import { Chat } from './entities/chat.entity';
import { GqlAuthGuard } from 'src/gqlAuthGuard/GqlAuthGuard';
import { DeleteChatResponse } from './response/chat.response';

@Resolver(() => Chat)
export class ChatResolver {
  constructor(private readonly service: ChatService) {}

  @UseGuards(GqlAuthGuard)
  @Mutation(() => Chat)
  async createChat(
    @Args('input') input: CreateChatInput,
    @Context() context: any,
  ) {
    const userId = context.req.user?.userId;
    const chat = await this.service.createChat(input, userId);

    return chat;
  }

  @UseGuards(GqlAuthGuard)
  @Mutation(() => Chat)
  async updateChat(
    @Args('name') name: string,
    @Args('chatId') chatId: string,
    @Context() context: any,
  ) {
    const authUser = context.req.user?.userId;

    if (!authUser) {
      throw new UnauthorizedException('User not authenticated');
    }

    const chat = await this.service.updateChat(chatId, name);

    return chat;
  }

  @UseGuards(GqlAuthGuard)
  @Mutation(() => DeleteChatResponse)
  async deleteChat(
    @Args('chatId') chatId: string,
    @Context() context: any,
  ): Promise<DeleteChatResponse> {
    const authUser = context.req.user?.userId;

    if (!authUser) {
      throw new UnauthorizedException('User not authenticated');
    }

    await this.service.deleteChat(chatId);

    return { success: true, message: 'Chat deleted successfully' };
  }
}
