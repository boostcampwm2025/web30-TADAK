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
}
