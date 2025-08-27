import { Module } from '@nestjs/common';
import { UserService } from './user.service';
import { UserResolver } from './user.resolver';
import { RedisModule } from 'src/redis/redis.module';
import { ConfigModule } from '@nestjs/config';
import { JwtModule } from '@nestjs/jwt';
import { GoogleStrategy } from './strategy/googleStrategy';
import { PassportModule } from '@nestjs/passport';
import { TokenService } from 'src/utils/token.service';
import { AuthController } from './user.controller';

@Module({
  imports: [
    ConfigModule,
    JwtModule,
    PassportModule.register({ session: false }),
  ],
  providers: [
    UserResolver,
    UserService,
    RedisModule,
    GoogleStrategy,
    TokenService,
  ],
  exports: [TokenService],
  controllers: [AuthController],
})
export class UserModule {}
