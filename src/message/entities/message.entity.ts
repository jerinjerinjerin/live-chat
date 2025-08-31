import { ObjectType, Field, ID } from '@nestjs/graphql';
import { MessageType } from './messageType.entity';
import { User } from 'src/user/entities/user.entity';
import { Attachment } from './attachment.entity';
import { Chat } from 'src/chat/entities/chat.entity';

@ObjectType()
export class Message {
  @Field(() => ID)
  id: string;

  @Field(() => Chat)
  chat: Chat;

  @Field(() => User)
  sender: User;

  @Field({ nullable: true })
  content?: string;

  @Field(() => MessageType)
  messageType: MessageType;

  @Field(() => [Attachment])
  attachments: Attachment[];

  @Field()
  createdAt: Date;

  @Field()
  updatedAt: Date;

  @Field({ nullable: true })
  deletedAt?: Date;
}
