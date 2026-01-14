import { Body, Controller, Post, Req, UseGuards } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';

import { User } from '../user/user.entity';
import { CreateSubmissionDto } from './create-submission.dto';
import { SubmissionService } from './submission.service';

@Controller('submissions')
export class SubmissionController {
  constructor(private readonly submissionService: SubmissionService) {}

  @Post()
  @UseGuards(AuthGuard('jwt'))
  async submit(@Req() req: { user: User }, @Body() dto: CreateSubmissionDto) {
    const userId = req.user.id;
    return this.submissionService.createSubmission(dto, userId);
  }
}
