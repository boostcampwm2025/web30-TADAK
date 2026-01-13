import { BullModule } from '@nestjs/bullmq';
import { Global, Module } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import Redis from 'ioredis';

export const REDIS_CLIENT = Symbol('REDIS_CLIENT');
const DEFAULT_REDIS_PORT = 6379;

@Global()
@Module({
  imports: [
    BullModule.forRootAsync({
      useFactory: (configService: ConfigService) => ({
        connection: createRedisOptions(configService),
      }),
      inject: [ConfigService],
    }),
  ],
  providers: [
    {
      provide: REDIS_CLIENT,
      useFactory: (configService: ConfigService) => {
        const redis = new Redis(createRedisOptions(configService));

        redis.on('connect', () => {
          console.warn('Redis connected successfully');
        });

        redis.on('error', (error) => {
          console.error('Redis connection error:', error);
        });

        return redis;
      },
      inject: [ConfigService],
    },
  ],
  exports: [REDIS_CLIENT],
})
export class RedisModule {}

function createRedisOptions(configService: ConfigService): { host?: string; port: number } {
  const host = configService.get<string>('REDIS_HOST');
  const portValue = configService.get<string>('REDIS_PORT');
  const port = typeof portValue === 'number' ? portValue : Number(portValue ?? DEFAULT_REDIS_PORT);

  return {
    host,
    port: Number.isFinite(port) ? port : DEFAULT_REDIS_PORT,
  };
}
