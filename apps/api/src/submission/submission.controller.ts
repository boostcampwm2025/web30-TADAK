import {
  Body,
  Controller,
  Get,
  Headers,
  NotFoundException,
  Param,
  Post,
  Req,
  UseGuards,
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';

import { User } from '../user/user.entity';
import { CreateSubmissionDto } from './create-submission.dto';
import { SubmissionService } from './submission.service';

@Controller('submissions')
export class SubmissionController {
  constructor(private readonly submissionService: SubmissionService) {}

  @Post()
  @UseGuards(AuthGuard('jwt'))
  async submit(
    @Req() req: { user: User },
    @Body() dto: CreateSubmissionDto,
    @Headers('x-socket-id') socketId: string,
  ) {
    const userId = req.user.id;
    return this.submissionService.submit(dto, userId, socketId);
  }

  @Post('dry-run')
  @UseGuards(AuthGuard('jwt'))
  async dryRun(
    @Req() req: { user: User },
    @Body() dto: CreateSubmissionDto,
    @Headers('x-socket-id') socketId: string,
  ) {
    const userId = req.user.id;
    return this.submissionService.executeTest(dto, userId, socketId);
  }

  @Get(':submissionId')
  @UseGuards(AuthGuard('jwt'))
  async getSubmissionDetail(
    @Req() req: { user: User },
    @Param('submissionId') submissionId: string,
  ) {
    const detail = await this.submissionService.getSubmissionDetail(submissionId, req.user.id);
    if (!detail) {
      throw new NotFoundException('존재하지 않는 데이터이거나 내 기록이 아닙니다.');
    }
    return detail;
  }
}
