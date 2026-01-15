import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';

import { RedisModule } from './redis/redis.module';
import { SubmissionModule } from './submission/submission.module';
import { PubSubModule } from './pubsub/pubsub.module';

@Module({
  imports: [
    // 환경변수 설정
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: '.env',
    }),

    // MySQL (TypeORM) 연결 설정
    TypeOrmModule.forRootAsync({
      imports: [ConfigModule],
      useFactory: (configService: ConfigService) => ({
        type: 'mysql',
        host: configService.get('DB_HOST'),
        port: configService.get('DB_PORT'),
        username: configService.get('DB_USERNAME'),
        password: configService.get('DB_PASSWORD'),
        database: configService.get('DB_DATABASE'),
        entities: [],
        synchronize: true,
        logging: ['error'],
      }),
      inject: [ConfigService],
    }),
    

    // Redis 연결 설정
    RedisModule,
    SubmissionModule,
    PubSubModule,
  ],
  controllers: [],
  providers: [],
})
export class AppModule {}
