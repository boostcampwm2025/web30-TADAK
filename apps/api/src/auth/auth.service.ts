import { Injectable } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';

import { User } from '../user/user.entity';
import { UserService } from '../user/user.service';

@Injectable()
export class AuthService {
  constructor(
    private userService: UserService,
    private jwtService: JwtService,
  ) {}

  async validateUser(details: Partial<User>): Promise<User> {
    if (!details.githubId) {
      throw new Error('Github ID not found');
    }
    const user = await this.userService.findByGithubId(details.githubId);

    if (user) {
      // avatarUrl 등이 변경되었을 수 있으므로 업데이트
      if (details.avatarUrl !== user.avatarUrl || details.username !== user.username) {
        Object.assign(user, details);
        return this.userService.create(user);
      }
      return user;
    }

    return this.userService.create(details);
  }

  // 로그인 성공 시 토큰 생성 (Secret + Payload)
  async login(user: User) {
    const payload = { username: user.username, sub: user.id };
    const refreshToken = this.jwtService.sign(payload, {
      secret: process.env.JWT_REFRESH_SECRET,
      expiresIn: '7d',
    });

    await this.userService.updateRefreshToken(user.id, refreshToken);

    return {
      accessToken: this.jwtService.sign(payload),
      refreshToken,
    };
  }

  refreshToken(user: User, incomingRefreshToken: string) {
    if (!user.refreshToken || user.refreshToken !== incomingRefreshToken) {
      throw new Error('Refresh token mismatched');
    }

    const payload = { username: user.username, sub: user.id };
    return {
      accessToken: this.jwtService.sign(payload),
    };
  }

  async logout(userId: string) {
    await this.userService.removeRefreshToken(userId);
  }

  /**
   * k6 부하 테스트용 토큰 생성 (개발 환경 전용)
   * 실제 DB에 테스트 사용자를 생성하고 유효한 토큰 발급
   */
  async createTestToken() {
    if (process.env.NODE_ENV === 'production') {
      throw new Error('Test token is not available in production');
    }

    // 테스트 사용자 생성 또는 조회
    const testGithubId = 'k6-load-test-github-id';
    let user = await this.userService.findByGithubId(testGithubId);

    if (!user) {
      user = await this.userService.create({
        githubId: testGithubId,
        username: 'k6-load-test-user',
        avatarUrl: 'https://github.com/ghost.png',
      });
    }

    const payload = { username: user.username, sub: user.id };
    const accessToken = this.jwtService.sign(payload, { expiresIn: '24h' });

    return { accessToken, userId: user.id };
  }
}
