import { Resolver, Mutation, Args, Context } from '@nestjs/graphql';
import { UserService } from './user.service';
import { User } from './entities/user.entity';
import { CreateUserInput } from './dto/create-user.input';
import {
  RegisterResponse,
  VerifyOtpResponse,
} from './response/register.response';
@Resolver(() => User)
export class UserResolver {
  constructor(private readonly userService: UserService) {}

  @Mutation(() => RegisterResponse)
  async registerUser(
    @Args('data') data: CreateUserInput,
  ): Promise<RegisterResponse> {
    await this.userService.registerUser(data);
    return {
      message: 'OTP sent successfully. Please verify your email.',
      email: data.email,
      otpSent: true,
    };
  }

  @Mutation(() => VerifyOtpResponse)
  async verifyUser(
    @Args('email') email: string,
    @Args('otp') otp: string,
    @Context() context: any,
  ): Promise<VerifyOtpResponse> {
    // ✅ Set cookies in GraphQL context

    const { accessToken, refreshToken } = await this.userService.verifyUser(
      otp,
      email,
    );

    context.res.cookie('accessToken', accessToken, {
        httpOnly: true,
      secure: true, // true in production with HTTPS
      sameSite: 'strict',
      maxAge: 15 * 60 * 1000,
    });

    context.res.cookie('refreshToken', refreshToken, {
      httpOnly: true,
      secure: true,
      sameSite: 'strict',
      maxAge: 7 * 24 * 60 * 60 * 1000,
    });

    return {
      message: 'User verified successfully',
      accessToken,
      refreshToken,
    };
  }
}
