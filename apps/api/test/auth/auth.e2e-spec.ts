import { INestApplication } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { Test, TestingModule } from '@nestjs/testing';
import request from 'supertest';

import { AppModule } from '../../src/app.module';

const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

describe('인증 토큰 만료 (E2E)', () => {
  let app: INestApplication;
  let jwtService: JwtService;

  beforeEach(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    jwtService = moduleFixture.get<JwtService>(JwtService);
    await app.init();
  });

  afterEach(async () => {
    await app.close();
  });

  it('/auth/profile (GET) - 유효한 토큰으로 접근 시 성공, 만료 후 접근 시 실패', async () => {
    // 1. 5분 뒤에 만료되는 토큰 생성 (모듈 설정과 동일)
    const payload = { username: 'testuser', sub: 'test-uuid' };
    const token = jwtService.sign(payload);

    // 2. 즉시 요청 시 성공해야 함 (200 OK)
    await request(app.getHttpServer())
      .get('/auth/profile')
      .set('Authorization', `Bearer ${token}`)
      .expect(200);

    // 3. 6분 대기 (만료 시간은 5분)
    await sleep(60000);

    // 4. 지연된 요청은 실패해야 함 (401 Unauthorized)
    await request(app.getHttpServer())
      .get('/auth/profile')
      .set('Authorization', `Bearer ${token}`)
      .expect(401);
  }, 10000); // 이 테스트를 위해 타임아웃을 늘림
});
