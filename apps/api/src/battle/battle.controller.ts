import { Controller, Get } from '@nestjs/common';
import { Battle } from '@packages/types/battle';

import { BattleService } from './battle.service';

@Controller('battles')
export class BattleController {
  constructor(private readonly battleService: BattleService) {}

  @Get()
  async getActiveBattles(): Promise<Battle[]> {
    const battles = await this.battleService.getActiveBattles();

    return battles;
  }
}
