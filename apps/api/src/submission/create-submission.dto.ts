import { IsNotEmpty, IsOptional, IsString } from 'class-validator';

export class CreateSubmissionDto {
  @IsNotEmpty()
  @IsString()
  problemId: string;

  @IsNotEmpty()
  @IsString()
  code: string;

  @IsNotEmpty()
  @IsString()
  language: string;

  @IsOptional()
  @IsString()
  battleId?: string;
}
