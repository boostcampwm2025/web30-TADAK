import { Body, Controller, HttpException, HttpStatus, Post, Req, UseGuards } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import type { MatchingStartRequest, MatchingUser } from '@packages/types/matching';

import { User } from '../user/user.entity';
import { UserService } from '../user/user.service';
import { MatchingService } from './matching.service';

@Controller('matching')
export class MatchingController {
  constructor(
    private readonly matchingService: MatchingService,
    private readonly userService: UserService,
  ) {}

  @Post('start')
  @UseGuards(AuthGuard('jwt'))
  async startMatching(@Req() req: { user: User }, @Body() data: MatchingStartRequest) {
    const { userId, socketId } = data;

    // JWT의 유저 ID와 요청 바디의 유저 ID가 일치하는지 확인 (보안 강화)
    if (req.user.id !== userId) {
      throw new HttpException('Unauthorized user ID', HttpStatus.UNAUTHORIZED);
    }

    // DB에서 최신 유저 정보 조회 (보안을 위해 클라이언트 데이터를 신뢰하지 않음)
    const user = await this.userService.findOne(userId);
    if (!user) {
      throw new HttpException('User not found', HttpStatus.NOT_FOUND);
    }

    const matchingUser: MatchingUser = {
      userId: user.id,
      username: user.username,
      rating: user.rating,
      tier: user.tier as MatchingUser['tier'],
      socketId: socketId,
      status: 'WAITING',
      waitingSince: new Date(),
    };

    await this.matchingService.startMatching(matchingUser);
    return { success: true };
  }

  @Post('cancel')
  @UseGuards(AuthGuard('jwt'))
  async cancelMatching(@Req() req: { user: User }, @Body() data: { userId: string }) {
    const { userId } = data;

    // JWT의 유저 ID와 요청 바디의 유저 ID가 일치하는지 확인 (보안 강화)
    if (req.user.id !== userId) {
      throw new HttpException('Unauthorized user ID', HttpStatus.UNAUTHORIZED);
    }

    await this.matchingService.cancelMatching(userId);
    return { success: true };
  }
}
