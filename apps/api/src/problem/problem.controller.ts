import { Controller, Get } from '@nestjs/common';

import { Problem } from './problem.entity';
import { ProblemService } from './problem.service';

@Controller('problems')
export class ProblemController {
  constructor(private readonly problemService: ProblemService) {}

  @Get()
  async findAll(): Promise<Problem[]> {
    return this.problemService.findAll();
  }
}
