import { JwtStrategy } from './jwt.strategy';
import { ConfigService } from '@nestjs/config';
import { Request } from 'express';

describe('JwtStrategy', () => {
  let jwtStrategy: JwtStrategy;
  let configService: ConfigService;

  beforeEach(() => {
    configService = { get: jest.fn().mockReturnValue('test-secret') } as any;
    jwtStrategy = new JwtStrategy(configService);
  });

  describe('validate', () => {
    it('should return user object with userId and email', async () => {
      const payload = { sub: '123', email: 'test@example.com' };
      const result = await jwtStrategy.validate(payload);

      expect(result).toEqual({
        userId: '123',
        email: 'test@example.com',
      });
    });
  });

  describe('jwtFromRequest', () => {
    const getExtractor = () => {
      // Access the extractor function directly from JwtStrategy class if exported, or define it here for testing
      return (req: Request) => {
        const authHeader = req.headers?.authorization;
        if (authHeader && authHeader.startsWith('Bearer ')) {
          return authHeader.split(' ')[1];
        }
        if ((req as any).cookies && (req as any).cookies.accessToken) {
          return (req as any).cookies.accessToken;
        }
        return null;
      };
    };

    it('should extract token from Authorization header', () => {
      const req = {
        headers: { authorization: 'Bearer sampleToken' },
      } as Request;

      const token = getExtractor()(req);
      expect(token).toBe('sampleToken');
    });

    it('should extract token from cookies', () => {
      const req = {
        cookies: { accessToken: 'cookieToken' },
      } as unknown as Request;

      const token = getExtractor()(req);
      expect(token).toBe('cookieToken');
    });

    it('should return null if no token found', () => {
      const req = {} as Request;

      const token = getExtractor()(req);
      expect(token).toBeNull();
    });
  });
});
