import { Module } from '@nestjs/common';
import { UserService } from './user.service';
import { UserResolver } from './user.resolver';
import { RedisModule } from 'src/redis/redis.module';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { JwtModule } from '@nestjs/jwt';
import { GoogleStrategy } from './strategy/googleStrategy';
import { PassportModule } from '@nestjs/passport';
import { TokenService } from 'src/utils/token.service';
import { AuthController } from './user.controller';
import { JwtStrategy } from './strategy/jwt.strategy';

@Module({
  imports: [
    ConfigModule,
    JwtModule.registerAsync({
      imports: [ConfigModule], // Import ConfigModule to use ConfigService
      useFactory: async (configService: ConfigService) => ({
        secret: configService.get<string>('JWT_ACCESS_TOKEN_SECRET'), // Access token secret from ConfigService
        signOptions: {
          expiresIn: configService.get<string>(
            'JWT_ACCESS_TOKEN_SECRET_EXPIRES_IN',
          ), // Expiration time for access token
        },
      }),
      inject: [ConfigService], // Inject ConfigService to fetch env variables
    }),
    PassportModule.register({ session: false }),
  ],
  providers: [
    UserResolver,
    UserService,
    RedisModule,
    GoogleStrategy,
    TokenService,
    JwtStrategy,
  ],
  exports: [TokenService],
  controllers: [AuthController],
})
export class UserModule {}
