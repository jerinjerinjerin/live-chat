import { ObjectType, Field, ID, registerEnumType } from '@nestjs/graphql';
import { Chat } from 'src/chat/entities/chat.entity';
import { User } from 'src/user/entities/user.entity';

export enum ChatRole {
  MEMBER = 'MEMBER',
  ADMIN = 'ADMIN',
}

registerEnumType(ChatRole, {
  name: 'ChatRole',
});

@ObjectType()
export class ChatMember {
  @Field(() => ID)
  id: string;

  @Field(() => Chat)
  chat: Chat;

  @Field(() => User)
  user: User;

  @Field()
  joinedAt: Date;

  @Field({ nullable: true })
  lastReadAt?: Date;

  @Field(() => ChatRole)
  role: ChatRole;
}
