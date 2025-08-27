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

@ObjectType()
export class VerifyOtpResponse {
  @Field()
  message: string;

  @Field()
  accessToken: string;

  @Field()
  refreshToken: string;
}

@ObjectType()
export class LoginResponse {
  @Field()
  message: string;

  @Field()
  accessToken: string;

  @Field()
  refreshToken: string;
}
