import { Module } from '@nestjs/common';
import { UserService } from './user.service';
import { UserResolver } from './user.resolver';
import { RedisModule } from 'src/redis/redis.module';
import { ConfigModule } from '@nestjs/config';
import { JwtModule } from '@nestjs/jwt';

@Module({
  imports: [ConfigModule, JwtModule],
  providers: [UserResolver, UserService, RedisModule],
})
export class UserModule {}
