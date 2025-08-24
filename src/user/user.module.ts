import { Module } from '@nestjs/common';
import { UserService } from './user.service';
import { UserResolver } from './user.resolver';
import { RedisModule } from 'src/redis/redis.module';

@Module({
  providers: [UserResolver, UserService, RedisModule],
})
export class UserModule {}
