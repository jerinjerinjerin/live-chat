import { ConfigService } from '@nestjs/config';
import { PrismaService } from 'src/prisma/prisma.service';
import { GoogleStrategy } from './googleStrategy';

describe('GoogleStrategy', () => {
  let googleStrategy: GoogleStrategy;
  let prismaService: PrismaService;
  let configService: ConfigService;

  const mockPrisma = {
    user: {
      findUnique: jest.fn(),
      create: jest.fn(),
    },
  };

  const mockConfig = {
    get: jest.fn((key: string) => {
      if (key === 'GOOGLE_CLIENT_ID') return 'test-client-id';
      if (key === 'GOOGLE_CLIENT_SECRET') return 'test-client-secret';
      if (key === 'GOOGLE_CALLBACK_URL')
        return 'http://localhost:8000/auth/google/callback';
    }),
  };

  beforeEach(() => {
    prismaService = mockPrisma as unknown as PrismaService;
    configService = mockConfig as unknown as ConfigService;

    googleStrategy = new GoogleStrategy(configService, prismaService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should return existing user from DB', async () => {
    const mockUser = { id: 1, email: 'test@example.com' };
    mockPrisma.user.findUnique.mockResolvedValue(mockUser);

    const profile = {
      name: { givenName: 'John', familyName: 'Doe' },
      emails: [{ value: 'test@example.com' }],
      photos: [{ value: 'http://example.com/photo.jpg' }],
    };

    const done = jest.fn();

    await googleStrategy.validate(
      'access-token',
      'refresh-token',
      profile,
      done,
    );

    expect(mockPrisma.user.findUnique).toHaveBeenCalledWith({
      where: { email: 'test@example.com' },
    });
    expect(mockPrisma.user.create).not.toHaveBeenCalled();
    expect(done).toHaveBeenCalledWith(null, mockUser);
  });

  it('should create new user if not found', async () => {
    mockPrisma.user.findUnique.mockResolvedValue(null);
    const mockNewUser = { id: 2, email: 'new@example.com' };
    mockPrisma.user.create.mockResolvedValue(mockNewUser);

    const profile = {
      name: { givenName: 'Jane', familyName: 'Doe' },
      emails: [{ value: 'new@example.com' }],
      photos: [{ value: 'http://example.com/photo.jpg' }],
    };

    const done = jest.fn();

    await googleStrategy.validate(
      'access-token',
      'refresh-token',
      profile,
      done,
    );

    expect(mockPrisma.user.findUnique).toHaveBeenCalledWith({
      where: { email: 'new@example.com' },
    });
    expect(mockPrisma.user.create).toHaveBeenCalledWith({
      data: {
        email: 'new@example.com',
        name: 'Jane Doe',
        avatarUrl: 'http://example.com/photo.jpg',
        password: '',
        role: 'USER',
        isGoogleUser: true,
      },
    });
    expect(done).toHaveBeenCalledWith(null, mockNewUser);
  });
});
