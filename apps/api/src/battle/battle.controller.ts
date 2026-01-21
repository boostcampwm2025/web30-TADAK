import { Controller, Get } from '@nestjs/common';

import { BattleService } from '@/battle/battle.service';

@Controller('battles')
export class BattleController {
  constructor(private readonly battleService: BattleService) {}

  @Get(':battleId/result')
  async getBattleResult() {}
}
