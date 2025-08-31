import { ObjectType, Field, ID } from '@nestjs/graphql';
import { User } from 'src/user/entities/user.entity';
import { ChatMember } from 'src/chat-member/entities/chat.member.entity';
import { Message } from 'src/message/entities/message.entity';

@ObjectType()
export class Chat {
  @Field(() => ID)
  id: string;

  @Field({ nullable: true })
  name?: string;

  @Field()
  isGroup: boolean;

  @Field(() => User)
  createdBy: User;

  @Field(() => [ChatMember])
  participants: ChatMember[];

  @Field(() => [Message])
  messages: Message[];

  @Field()
  createdAt: Date;

  @Field()
  updatedAt: Date;

  @Field({ nullable: true })
  deletedAt?: Date;
}
