import { Injectable } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { Strategy, VerifyCallback } from 'passport-google-oauth20';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from 'src/prisma/prisma.service'; // ✅ Import your Prisma service

@Injectable()
export class GoogleStrategy extends PassportStrategy(Strategy, 'google') {
  constructor(
    private readonly configService: ConfigService,
    private readonly prisma: PrismaService, // ✅ Inject Prisma
  ) {
    super({
      clientID: configService.get('GOOGLE_CLIENT_ID'),
      clientSecret: configService.get('GOOGLE_CLIENT_SECRET'),
      callbackURL: configService.get('GOOGLE_CALLBACK_URL'),
      scope: ['email', 'profile'],
      prompt: 'consent select_account',
      accessType: 'offline',
    });
  }

  async validate(
    accessToken: string,
    refreshToken: string,
    profile: any,
    done: VerifyCallback,
  ): Promise<any> {
    const { name, emails, photos } = profile;

    // ✅ Find or create user in DB
    let user = await this.prisma.user.findUnique({
      where: { email: emails[0].value },
    });

    if (!user) {
      user = await this.prisma.user.create({
        data: {
          email: emails[0].value,
          name: `${name.givenName} ${name.familyName}`,
          avatarUrl: photos[0].value,
          password: '', // empty because Google user
          role: 'USER',
          isGoogleUser: true,
        },
      });
    }

    done(null, user);
  }
}
