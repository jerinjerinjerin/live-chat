import { Resolver, Mutation, Args } from '@nestjs/graphql';
import { UserService } from './user.service';
import { User } from './entities/user.entity';
import { CreateUserInput } from './dto/create-user.input';
import { RegisterResponse } from './response/register.response';
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
}
