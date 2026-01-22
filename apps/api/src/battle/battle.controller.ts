import { Controller, Get, Param } from '@nestjs/common';
import { BattleResultResponse } from '@packages/types/battle';

import { BattleService } from '@/battle/battle.service';

@Controller('battles')
export class BattleController {
  constructor(private readonly battleService: BattleService) {}

  @Get(':battleId/result')
  async getBattleResult(@Param('battleId') battleId: string): Promise<BattleResultResponse> {
    return this.battleService.getBattleResult(battleId);
  }
}
