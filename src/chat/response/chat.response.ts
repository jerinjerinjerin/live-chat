import { Field, ObjectType } from '@nestjs/graphql';

@ObjectType()
export class DeleteChatResponse {
  @Field()
  message: string;

  @Field()
  success: boolean;
}
