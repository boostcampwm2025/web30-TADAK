import { Controller, Get, Req, UseGuards } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';

import { User } from './user.entity';
import { UserService } from './user.service';

@Controller('users')
export class UserController {
  constructor(private readonly userService: UserService) {}

  @Get('me')
  @UseGuards(AuthGuard('jwt'))
  async getProfile(@Req() req: { user: User }) {
    const currentRoomId = await this.userService.getUserCurrentRoomId(req.user.id);
    return {
      ...req.user,
      currentRoomId,
    };
  }

  @Get('me/battles')
  @UseGuards(AuthGuard('jwt'))
  async getMyBattles(@Req() req: { user: User }) {
    return this.userService.getBattleHistory(req.user.id);
  }

  @Get('me/submissions')
  @UseGuards(AuthGuard('jwt'))
  async getMySubmissions(@Req() req: { user: User }) {
    return this.userService.getSubmissionHistory(req.user.id);
  }
}
