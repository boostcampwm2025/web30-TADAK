import { spawn } from 'node:child_process';
import { promises as fs } from 'node:fs';
import path from 'node:path';

import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

import { DOCKER_CONTAINER_NAME, DOCKER_SUBMISSIONS_PATH } from './docker.constants';

@Injectable()
export class DockerCleanupService {
  private readonly logger = new Logger(DockerCleanupService.name);

  constructor(private readonly configService: ConfigService) {}

  async cleanupExecution(executionId: string): Promise<void> {
    await Promise.all([this.removeSubmissionFiles(executionId), this.removeContainer(executionId)]);
  }

  private async removeSubmissionFiles(executionId: string): Promise<void> {
    const submissionsPath = this.getString('JUDGE_SUBMISSIONS_PATH', DOCKER_SUBMISSIONS_PATH);
    const targetPath = path.join(submissionsPath, executionId);

    try {
      await fs.rm(targetPath, { recursive: true, force: true });
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      this.logger.warn(`Failed to remove submission files (${targetPath}): ${message}`);
    }
  }

  private removeContainer(executionId: string): Promise<void> {
    const containerName = `${DOCKER_CONTAINER_NAME}-${executionId}`;
    return this.spawnDocker(['rm', '-f', containerName]);
  }

  private spawnDocker(args: string[]): Promise<void> {
    return new Promise((resolve) => {
      const child = spawn('docker', args, { stdio: ['ignore', 'ignore', 'pipe'] });
      let stderr = '';

      child.stderr.on('data', (chunk: Buffer | string) => {
        if (typeof chunk === 'string') {
          stderr += chunk;
        } else {
          stderr += chunk.toString();
        }
      });

      child.on('error', (error) => {
        this.logger.warn(`Docker cleanup command failed to start: ${error.message}`);
        resolve();
      });

      child.on('close', (code) => {
        const message = stderr.trim();
        if (code && message.length > 0 && !this.isNotFoundMessage(message)) {
          this.logger.warn(`Docker cleanup command exited with code ${code}: ${message}`);
        }
        resolve();
      });
    });
  }

  private isNotFoundMessage(message: string): boolean {
    return message.includes('No such container');
  }

  private getString(key: string, fallback: string): string {
    const value = this.configService.get<string>(key);
    return value && value.trim().length > 0 ? value : fallback;
  }
}
