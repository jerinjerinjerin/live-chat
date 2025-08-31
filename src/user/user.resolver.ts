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
      secure: process.env.NODE_ENV === 'production',
      sameSite: process.env.NODE_ENV === 'production' ? 'None' : 'Lax',
      maxAge: 15 * 60 * 1000,
    });

    context.res.cookie('refreshToken', refreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: process.env.NODE_ENV === 'production' ? 'None' : 'Lax',
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

  @Mutation(() => LoginResponse)
  async refreshAccessToken(@Context() context: any): Promise<LoginResponse> {
    console.log('Refreshing access token', context.req.cookies); // Log the cookies for debugging

    const refreshToken = context.req.cookies.refreshToken; // Get the refresh token from cookies

    if (!refreshToken) {
      throw new Error('No refresh token provided'); // Throw error if no refresh token is found
    }

    // Call the user service to refresh tokens
    const {
      accessToken,
      message,
      refreshToken: newRefreshToken,
    } = await this.userService.refreshTokens(refreshToken);

    // Set the new access token in the cookies
    context.res.cookie('accessToken', accessToken, {
      httpOnly: true, // Makes cookie accessible only by the server
      secure: process.env.NODE_ENV === 'production', // Use HTTPS only in production
      sameSite: 'lax', // Helps with CSRF attacks
      maxAge: 15 * 60 * 1000, // Set expiration for the access token (15 minutes)
    });

    // Set the new refresh token in the cookies
    context.res.cookie('refreshToken', newRefreshToken, {
      httpOnly: true, // Makes cookie accessible only by the server
      secure: process.env.NODE_ENV === 'production', // Use HTTPS only in production
      sameSite: 'lax', // Helps with CSRF attacks
      maxAge: 7 * 24 * 60 * 60 * 1000, // Set expiration for the refresh token (7 days)
    });

    return {
      message,
      accessToken,
      refreshToken: newRefreshToken,
    };
  }
}
