import { BullModule } from '@nestjs/bullmq';
import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';

import { AuthModule } from './auth/auth.module';
import { Battle } from './battle/battle.entity';
import { BattleModule } from './battle/battle.module';
import { MatchingModule } from './matching/matching.module';
import { Problem } from './problem/problem.entity';
import { ProblemModule } from './problem/problem.module';
import { PubsubModule } from './pubsub/pubsub.module';
import { RedisModule } from './redis/redis.module';
import { RoomModule } from './room/room.module';
import { Submission } from './submission/submission.entity';
import { SubmissionModule } from './submission/submission.module';
import { User } from './user/user.entity';
import { UserModule } from './user/user.module';

@Module({
  imports: [
    // 1. 환경변수 설정 (.env 파일 로드)
    ConfigModule.forRoot({
      isGlobal: true, // 전역으로 사용 가능하게 설정
      envFilePath: '.env', // .env 파일 경로
    }),

    // 2. MySQL (TypeORM) 연결 설정 - 환경변수 사용
    TypeOrmModule.forRootAsync({
      imports: [ConfigModule],
      useFactory: (configService: ConfigService) => ({
        type: 'mysql',
        host: configService.get('DB_HOST'),
        port: configService.get('DB_PORT'),
        username: configService.get('DB_USERNAME'),
        password: configService.get('DB_PASSWORD'),
        database: configService.get('DB_DATABASE'),
        entities: [User, Problem, Submission, Battle],
        synchronize: true, // 개발 단계에서는 true (Entity와 DB 스키마 동기화)
        logging: ['error'], // 에러만 로그로 출력
      }),
      inject: [ConfigService],
    }),

    // 3. Redis 연결 설정
    RedisModule,

    // 4. BullMQ 연결 설정
    BullModule.forRootAsync({
      imports: [ConfigModule],
      useFactory: (configService: ConfigService) => ({
        connection: {
          host: configService.get('REDIS_HOST'),
          port: configService.get('REDIS_PORT'),
        },
      }),
      inject: [ConfigService],
    }),

    MatchingModule,
    RoomModule,
    BattleModule,
    UserModule,
    ProblemModule,
    SubmissionModule,
    AuthModule,
    PubsubModule,
  ],
  controllers: [],
  providers: [],
})
export class AppModule {}
