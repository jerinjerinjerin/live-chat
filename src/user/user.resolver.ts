import { Resolver, Mutation, Args, Context, Query } from '@nestjs/graphql';
import { UserService } from './user.service';
import { User } from './entities/user.entity';
import { CreateUserInput } from './dto/create-user.input';
import {
  LoginResponse,
  RegisterResponse,
  VerifyOtpResponse,
} from './response/register.response';
import { GqlAuthGuard } from 'src/gqlAuthGuard/GqlAuthGuard';
import { CurrentUser } from 'src/gqlAuthGuard/CurrentUser';
import { UseGuards } from '@nestjs/common';
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
      secure: true,
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

  @Mutation(() => LoginResponse)
  async loginUser(
    @Args('email') email: string,
    @Args('password') password: string,
    @Context() context: any,
  ): Promise<LoginResponse> {
    const { accessToken, refreshToken, message } =
      await this.userService.loginUser(email, password);

    context.res.cookie('accessToken', accessToken, {
      httpOnly: true,
      secure: true,
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
      message,
      accessToken,
      refreshToken,
    };
  }

  @Query(() => User)
  @UseGuards(GqlAuthGuard)
  async me(
    @CurrentUser() user: { userId: string; email: string },
  ): Promise<User> {
    return this.userService.findById(user.userId);
  }
}
