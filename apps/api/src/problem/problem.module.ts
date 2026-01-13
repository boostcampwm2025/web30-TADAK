import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

import { ProblemController } from './problem.controller';
import { Problem } from './problem.entity';
import { ProblemService } from './problem.service';

@Module({
  imports: [TypeOrmModule.forFeature([Problem])],
  controllers: [ProblemController],
  providers: [ProblemService],
  exports: [ProblemService],
})
export class ProblemModule {}
