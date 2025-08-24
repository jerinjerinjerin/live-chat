import { ObjectType, Field } from '@nestjs/graphql';

@ObjectType()
export class RegisterResponse {
  @Field()
  message: string;

  @Field()
  email: string;

  @Field()
  otpSent: boolean;
}
