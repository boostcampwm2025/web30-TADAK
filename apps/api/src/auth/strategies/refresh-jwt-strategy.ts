import { Injectable, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';

import { UserService } from '../../user/user.service';

@Injectable()
export class RefreshJwtStrategy extends PassportStrategy(Strategy, 'jwt-refresh') {
  constructor(
    configService: ConfigService,
    private userService: UserService,
  ) {
    super({
      // refresh 토큰을 body로 가져오기
      jwtFromRequest: ExtractJwt.fromBodyField('refreshToken'),
      ignoreExpiration: false,
      // 토큰이 유효한지 체크 (Refresh Token 전용 시크릿)
      secretOrKey: configService.get<string>('JWT_REFRESH_SECRET') ?? '',
    });
  }

  async validate(payload: { sub: string; username: string }) {
    // 토큰의 payload에서 user id(sub)를 추출하여 DB에서 최신 유저 정보 조회
    const user = await this.userService.findOne(payload.sub);

    // 유저가 존재하지 않는 경우 (탈퇴 등) 예외 발생
    if (!user) {
      throw new UnauthorizedException('User not found');
    }

    // 조회된 유저 객체(DB에 저장된 refreshToken 포함) 반환
    // 반환된 값은 request.user에 할당되어 Controller 등으로 전달
    return user;
  }
}
