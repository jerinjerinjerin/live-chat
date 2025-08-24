import { Module, Global } from '@nestjs/common';
import { RedisModule as NestRedisModule } from '@nestjs-modules/ioredis';
import { ConfigModule, ConfigService } from '@nestjs/config';

@Global()
@Module({
  imports: [
    NestRedisModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (config: ConfigService) => ({
        type: 'single',
        url: config.get<string>('REDIS_URL'),
      }),
    }),
  ],
  exports: [NestRedisModule],
})
export class RedisModule {}
