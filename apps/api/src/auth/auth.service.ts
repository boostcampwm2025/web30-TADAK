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
}
