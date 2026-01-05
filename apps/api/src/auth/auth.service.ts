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
    if (user) return user;
    return this.userService.create(details);
  }

  // 로그인 성공 시 토큰 생성 (Secret + Payload)
  login(user: User) {
    const payload = { username: user.username, sub: user.id };
    return {
      accessToken: this.jwtService.sign(payload),
    };
  }
}
