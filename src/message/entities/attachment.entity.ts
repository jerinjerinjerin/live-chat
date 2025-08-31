import { ObjectType, Field, ID } from '@nestjs/graphql';
import { Message } from './message.entity';

@ObjectType()
export class Attachment {
  @Field(() => ID)
  id: string;

  @Field(() => Message)
  message: Message;

  @Field()
  url: string;

  @Field()
  fileType: string;

  @Field()
  createdAt: Date;
}
