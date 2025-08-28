import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';

interface JwtPayload {
  sub: string; // userId
  email: string;
}

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(private readonly configService: ConfigService) {
    super({
      jwtFromRequest: ExtractJwt.fromExtractors([
        (req) => {
          if (req?.cookies?.accessToken) {
            return req.cookies.accessToken;
          }
          if (req?.headers?.authorization) {
            return req.headers.authorization.replace('Bearer ', '');
          }
          return null;
        },
      ]),
      ignoreExpiration: false, // ✅ Reject expired tokens
      secretOrKey:
        configService.get<string>('JWT_ACCESS_TOKEN_SECRET') ||
        'default-secret',
    });
  }

  async validate(payload: JwtPayload) {
    // ✅ This will attach to `req.user`
    return { userId: payload.sub, email: payload.email };
  }
}
