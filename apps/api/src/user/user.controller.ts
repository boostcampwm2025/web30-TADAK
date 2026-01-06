import { Controller, Get, Req, UseGuards } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';

import { User } from './user.entity';

@Controller('users')
export class UserController {
  @Get('me')
  @UseGuards(AuthGuard('jwt'))
  getProfile(@Req() req: { user: User }) {
    return req.user;
  }
}
