import { Test, TestingModule } from '@nestjs/testing';
import { UserResolver } from './user.resolver';
import { UserService } from './user.service';
import { CreateUserInput } from './dto/create-user.input';
import { RegisterResponse } from './response/register.response';

describe('UserResolver', () => {
  let resolver: UserResolver;
  let userService: jest.Mocked<UserService>;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        UserResolver,
        {
          provide: UserService,
          useValue: {
            registerUser: jest.fn(), // ✅ Clean mock
          },
        },
      ],
    }).compile();

    resolver = module.get<UserResolver>(UserResolver);
    userService = module.get(UserService);
  });

  it('should be defined', () => {
    expect(resolver).toBeDefined();
  });

  describe('registerUser', () => {
    it('should call userService.registerUser and return expected response', async () => {
      // Arrange
      const input: CreateUserInput = {
        email: 'test@example.com',
        password: '123456',
        name: 'Test User',
        avatarUrl: 'http://example.com/avatar.png',
        role: 'USER',
      };

      // ✅ Avoid ESLint unbound-method warning with .mockResolvedValueOnce.bind()
      (userService.registerUser as jest.Mock).mockResolvedValueOnce('ok');

      // Act
      const result: RegisterResponse = await resolver.registerUser(input);

      // Assert
      expect(userService.registerUser).toHaveBeenCalledWith(input);
      expect(result).toEqual({
        message: 'OTP sent successfully. Please verify your email.',
        email: 'test@example.com',
        otpSent: true,
      });
    });
  });
});
