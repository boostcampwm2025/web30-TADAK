import { Body, Controller, Post } from '@nestjs/common';
import type { MatchingUser } from '@packages/types/matching';

import { MatchingService } from './matching.service';

@Controller('matching')
export class MatchingController {
  constructor(private readonly matchingService: MatchingService) {}

  @Post('start')
  async startMatching(@Body() user: MatchingUser) {
    // FE에서 전달받은 정보로 매칭 프로세스 시작
    // 추후 JWT 유저 정보를 통해 보안 강화 가능
    await this.matchingService.startMatching(user);
    return { success: true };
  }

  @Post('cancel')
  async cancelMatching(@Body() data: { userId: string }) {
    await this.matchingService.cancelMatching(data.userId);
    return { success: true };
  }
}
