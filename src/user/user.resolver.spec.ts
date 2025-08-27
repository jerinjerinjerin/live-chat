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

  describe('UserResolver', () => {
    let resolver: UserResolver;
    let mockUserService: { loginUser: jest.Mock };

    const mockContext = {
      res: {
        cookie: jest.fn(),
      },
    };

    beforeEach(async () => {
      mockUserService = {
        loginUser: jest.fn(),
      };

      const module: TestingModule = await Test.createTestingModule({
        providers: [
          UserResolver,
          { provide: UserService, useValue: mockUserService },
        ],
      }).compile();

      resolver = module.get<UserResolver>(UserResolver);
    });

    beforeEach(() => {
      jest.clearAllMocks();
    });

    it('should call userService.loginUser, set cookies, and return tokens', async () => {
      const email = 'test@example.com';
      const password = 'password123';
      const mockResponse = {
        accessToken: 'access-token',
        refreshToken: 'refresh-token',
        message: 'Login successful',
      };

      mockUserService.loginUser.mockResolvedValue(mockResponse);

      const result = await resolver.loginUser(email, password, mockContext);

      expect(mockUserService.loginUser).toHaveBeenCalledWith(email, password);

      expect(mockContext.res.cookie).toHaveBeenCalledTimes(2);

      const [firstCookieCall, secondCookieCall] =
        mockContext.res.cookie.mock.calls;

      expect(firstCookieCall[0]).toBe('accessToken');
      expect(firstCookieCall[1]).toBe('access-token');
      expect(firstCookieCall[2]).toMatchObject({
        httpOnly: true,
        secure: true,
        sameSite: 'strict',
        maxAge: 15 * 60 * 1000,
      });

      expect(secondCookieCall[0]).toBe('refreshToken');
      expect(secondCookieCall[1]).toBe('refresh-token');
      expect(secondCookieCall[2]).toMatchObject({
        httpOnly: true,
        secure: true,
        sameSite: 'strict',
        maxAge: 7 * 24 * 60 * 60 * 1000,
      });

      expect(result).toEqual(mockResponse);
    });

    it('should throw if userService.loginUser fails', async () => {
      const email = 'fail@example.com';
      const password = 'wrong-password';
      mockUserService.loginUser.mockRejectedValue(
        new Error('Invalid credentials'),
      );

      await expect(
        resolver.loginUser(email, password, mockContext),
      ).rejects.toThrow('Invalid credentials');

      expect(mockContext.res.cookie).not.toHaveBeenCalled();
    });

    it('should throw if context.res.cookie is not available', async () => {
      const email = 'test@example.com';
      const password = 'password123';
      const mockResponse = {
        accessToken: 'access-token',
        refreshToken: 'refresh-token',
        message: 'Login successful',
      };

      mockUserService.loginUser.mockResolvedValue(mockResponse);

      const invalidContext = { res: {} };

      await expect(
        resolver.loginUser(email, password, invalidContext),
      ).rejects.toThrow('context.res.cookie is not a function');
    });
  });
});
