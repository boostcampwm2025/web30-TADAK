import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';

import { AppController } from './app.controller';
import { BattleModule } from './battle/battle.module';
import { RedisModule } from './redis/redis.module';
import { RoomModule } from './room/room.module';

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
        entities: [
          // 여기에 Entity 클래스들을 나열해야 합니다.
          // 예: User
        ],
        synchronize: true, // 개발 단계에서는 true (Entity와 DB 스키마 동기화)
        logging: ['error'], // 에러만 로그로 출력
      }),
      inject: [ConfigService],
    }),

    // 3. Redis 연결 설정
    RedisModule,

    RoomModule,
    BattleModule,
  ],
  controllers: [AppController],
  providers: [],
})
export class AppModule {}
