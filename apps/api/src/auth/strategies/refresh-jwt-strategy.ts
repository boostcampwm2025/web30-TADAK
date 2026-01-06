import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';

@Injectable()
export class RefreshJwtStrategy extends PassportStrategy(Strategy, 'jwt-refresh') {
  constructor(configService: ConfigService) {
    super({
      // refresh 토큰을 body로 가져오기
      jwtFromRequest: ExtractJwt.fromBodyField('refreshToken'),
      ignoreExpiration: false,
      // 토큰이 유효한지 체크 (Refresh Token 전용 시크릿)
      secretOrKey: configService.get<string>('JWT_REFRESH_SECRET') ?? '',
    });
  }

  // 유저 정보가 유효한지 체크
  validate(payload: { sub: string; username: string }) {
    return { id: payload.sub, username: payload.username };
  }
}
