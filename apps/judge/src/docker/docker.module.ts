import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';

import { DockerRunnerService } from './docker.service';

@Module({
  imports: [ConfigModule],
  providers: [DockerRunnerService],
  exports: [DockerRunnerService],
})
export class DockerModule {}
