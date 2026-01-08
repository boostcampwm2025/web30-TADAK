import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PassportStrategy } from '@nestjs/passport';
import { Strategy } from 'passport-github2';

import { User } from '../../user/user.entity';
import { AuthService } from '../auth.service';

@Injectable()
export class GitHubStrategy extends PassportStrategy(Strategy, 'github') {
  constructor(
    private configService: ConfigService,
    private authService: AuthService,
  ) {
    super({
      clientID: configService.get<string>('GITHUB_CLIENT_ID') ?? '',
      clientSecret: configService.get<string>('GITHUB_CLIENT_SECRET') ?? '',
      callbackURL: configService.get<string>('GITHUB_CALLBACK_URL') ?? '',
      scope: ['user:email', 'user:profile'],
    });
  }

  async validate(
    accessToken: string,
    refreshToken: string,
    profile: { id: string; username: string; photos: { value: string }[] },
    done: (err: unknown, user: User | false, info?: unknown) => void,
  ) {
    const { id, username, photos } = profile;
    const user = await this.authService.validateUser({
      githubId: id,
      username,
      avatarUrl: photos?.[0]?.value,
    });
    done(null, user);
  }
}
