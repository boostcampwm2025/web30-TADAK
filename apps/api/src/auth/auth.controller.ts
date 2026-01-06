import { Body, Controller, Get, Post, Req, Res, UseGuards } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import express from 'express';

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
  async githubLoginCallback(@Req() req: { user: User }, @Res() res: express.Response) {
    const { accessToken } = await this.authService.login(req.user);
    res.redirect(`http://localhost:5173/login?token=${accessToken}`);
  }

  @Get('profile')
  @UseGuards(AuthGuard('jwt'))
  getProfile(@Req() req: { user: User }) {
    return req.user;
  }

  @Post('refresh')
  @UseGuards(AuthGuard('jwt-refresh'))
  refreshToken(@Req() req: { user: User }, @Body('refreshToken') refreshToken: string) {
    return this.authService.refreshToken(req.user, refreshToken);
  }
}
