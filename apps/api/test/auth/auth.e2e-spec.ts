import { INestApplication } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { Test, TestingModule } from '@nestjs/testing';
import cookieParser from 'cookie-parser';
import request from 'supertest';

import { AppModule } from '../../src/app.module';
import { UserService } from '../../src/user/user.service';

const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

describe('인증 토큰 만료 및 갱신 (E2E)', () => {
  let app: INestApplication;
  let jwtService: JwtService;

  beforeEach(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    app.use(cookieParser());
    jwtService = moduleFixture.get<JwtService>(JwtService);
    await app.init();
  });

  afterEach(async () => {
    await app.close();
  });

  it('/auth/profile (GET) - 유효한 토큰으로 접근 시 성공, 만료 후 접근 시 실패', async () => {
    // 1. 2초 뒤에 만료되는 토큰 생성
    const payload = { username: 'testuser', sub: 'test-uuid' };
    const token = jwtService.sign(payload, { expiresIn: '2s' });

    // 2. 즉시 요청 시 성공해야 함 (200 OK)
    // eslint-disable-next-line @typescript-eslint/no-unsafe-argument
    await request(app.getHttpServer())
      .get('/auth/profile')
      .set('Authorization', `Bearer ${token}`)
      .expect(200);

    // 3. 3초 대기 (만료 시간은 2초)
    await sleep(3000);

    // 4. 지연된 요청은 실패해야 함 (401 Unauthorized)
    // eslint-disable-next-line @typescript-eslint/no-unsafe-argument
    await request(app.getHttpServer())
      .get('/auth/profile')
      .set('Authorization', `Bearer ${token}`)
      .expect(401);
  }, 10000);

  it('/auth/refresh (POST) - 유효한 리프레시 토큰으로 접근 시 성공, DB 불일치 시 실패', async () => {
    const userService = app.get<UserService>(UserService);
    const configService = app.get<ConfigService>(ConfigService);

    // 1. 임의의 유저 생성
    const uniqueId = Date.now().toString();
    const user = await userService.create({
      githubId: `test-github-${uniqueId}`,
      username: `testuser-${uniqueId}`,
    });

    // 2. 유효한 Refresh Token 생성 (시크릿 사용)
    const payload = { username: user.username, sub: user.id };
    const validRefreshToken = jwtService.sign(payload, {
      secret: configService.get<string>('JWT_REFRESH_SECRET'),
      expiresIn: '7d',
    });

    // 3. DB에 Refresh Token 저장
    await userService.updateRefreshToken(user.id, validRefreshToken);

    // 4. 유효한 토큰으로 Refresh 요청 -> 성공 (201 Created)
    // eslint-disable-next-line @typescript-eslint/no-unsafe-argument
    const res = await request(app.getHttpServer())
      .post('/auth/refresh')
      .set('Cookie', [`refreshToken=${validRefreshToken}`])
      .expect(201);

    const body = res.body as { accessToken: string };
    expect(body.accessToken).toBeDefined();

    // 5. DB와 일치하지 않는 토큰으로 요청 -> 실패
    // payload는 같지만(유저 식별 가능), 실제 문자열이 다른 토큰 생성
    // (create time이 달라지면 서명이 달라짐)
    await sleep(1000);
    const mismatchToken = jwtService.sign(payload, {
      secret: configService.get<string>('JWT_REFRESH_SECRET'),
      expiresIn: '7d',
    });

    if (mismatchToken === validRefreshToken) {
      throw new Error('Test setup failed: tokens are identical');
    }

    // DB 검증 실패 시 Error throw -> 500 (Exception Filter 미적용 시)
    // eslint-disable-next-line @typescript-eslint/no-unsafe-argument
    await request(app.getHttpServer())
      .post('/auth/refresh')
      .set('Cookie', [`refreshToken=${mismatchToken}`])
      .expect(500);
  });
});
