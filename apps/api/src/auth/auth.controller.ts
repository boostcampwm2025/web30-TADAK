import { Controller, Get, Post, Req, Res, UseGuards } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import type { Request, Response } from 'express';

import { User } from '../user/user.entity';
import { AuthService } from './auth.service';

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Get('github')
  @UseGuards(AuthGuard('github'))
  async githubLogin() {}

  @Get('github/return')
  @UseGuards(AuthGuard('github'))
  async githubLoginCallback(@Req() req: { user: User }, @Res() res: Response) {
    const { accessToken, refreshToken } = await this.authService.login(req.user);

    // Refresh Token을 HttpOnly Cookie에 설정
    res.cookie('refreshToken', refreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production', // 배포 식별
      path: '/',
      maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
    });

    res.redirect(`http://localhost:5173/login?token=${accessToken}`);
  }

  @Get('profile')
  @UseGuards(AuthGuard('jwt'))
  getProfile(@Req() req: { user: User }) {
    return req.user;
  }

  @Post('refresh')
  @UseGuards(AuthGuard('jwt-refresh'))
  refreshToken(@Req() req: Request & { user: User }) {
    return this.authService.refreshToken(req.user, req.cookies['refreshToken'] as string);
  }
}
