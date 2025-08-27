import { Test, TestingModule } from '@nestjs/testing';
import { UserResolver } from './user.resolver';
import { UserService } from './user.service';
import { CreateUserInput } from './dto/create-user.input';
import {
  RegisterResponse,
  VerifyOtpResponse,
} from './response/register.response';

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
            verifyUser: jest.fn(),
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

  describe('verifyUser', () => {
    it('should call userService.verifyUser and return expected response', async () => {
      const email = 'test@example.com';
      const otp = '123456';

      const mockAccessToken = 'mock-access-token';
      const mockRefreshToken = 'mock-refresh-token';

      (userService.verifyUser as jest.Mock).mockResolvedValueOnce({
        accessToken: mockAccessToken,
        refreshToken: mockRefreshToken,
      });

      const mockCookie = jest.fn();

      const context = {
        res: {
          cookie: mockCookie,
        },
      };

      const result: VerifyOtpResponse = await resolver.verifyUser(
        email,
        otp,
        context,
      );

      expect(userService.verifyUser).toHaveBeenCalledWith(otp, email);
      expect(mockCookie).toHaveBeenCalledTimes(2);

      expect(mockCookie).toHaveBeenCalledWith(
        'accessToken',
        mockAccessToken,
        expect.objectContaining({
          httpOnly: true,
          secure: true,
          sameSite: 'strict',
        }),
      );
      expect(mockCookie).toHaveBeenCalledWith(
        'refreshToken',
        mockRefreshToken,
        expect.objectContaining({
          httpOnly: true,
          secure: true,
          sameSite: 'strict',
        }),
      );

      expect(result).toEqual({
        message: 'User verified successfully',
        accessToken: mockAccessToken,
        refreshToken: mockRefreshToken,
      });
    });
  });
});
