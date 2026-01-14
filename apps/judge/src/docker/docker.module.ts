import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';

import { DockerCleanupService } from './docker.cleanup.service';
import { DockerRunnerService } from './docker.service';

@Module({
  imports: [ConfigModule],
  providers: [DockerRunnerService, DockerCleanupService],
  exports: [DockerRunnerService, DockerCleanupService],
})
export class DockerModule {}
