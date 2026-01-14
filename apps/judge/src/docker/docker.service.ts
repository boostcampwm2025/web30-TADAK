import { spawn } from 'node:child_process';

import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

import {
  DOCKER_CPU_LIMIT,
  DOCKER_DEFAULT_MEMORY_LIMIT_MB,
  DOCKER_PIDS_LIMIT,
  DOCKER_PROBLEMS_VOLUME,
  DOCKER_RUNNER_IMAGE,
  DOCKER_SUBMISSIONS_VOLUME,
  DOCKER_TMPFS_SIZE_MB,
} from './docker.constants';

export interface DockerRunOptions {
  submissionId: string;
  memoryLimitMb?: number;
}

export interface DockerRunResult {
  exitCode: number | null;
  signal: NodeJS.Signals | null;
  stdout: string;
  stderr: string;
}

@Injectable()
export class DockerRunnerService {
  private readonly logger = new Logger(DockerRunnerService.name);

  constructor(private readonly configService: ConfigService) {}

  async runSubmission(options: DockerRunOptions): Promise<DockerRunResult> {
    const args = this.buildRunArgs(options);
    return this.spawnDocker(args);
  }

  private buildRunArgs(options: DockerRunOptions): string[] {
    const image = this.getString('JUDGE_RUNNER_IMAGE', DOCKER_RUNNER_IMAGE);
    const problemsVolume = this.getString('JUDGE_PROBLEMS_VOLUME', DOCKER_PROBLEMS_VOLUME);
    const submissionsVolume = this.getString('JUDGE_SUBMISSIONS_VOLUME', DOCKER_SUBMISSIONS_VOLUME);
    const memoryLimitMb =
      options.memoryLimitMb ??
      this.getNumber('JUDGE_DEFAULT_MEMORY_LIMIT_MB', DOCKER_DEFAULT_MEMORY_LIMIT_MB);

    return [
      'run',
      '--rm',
      '-v',
      `${problemsVolume}:/app/data:ro`,
      '-v',
      `${submissionsVolume}:/app/output:rw`,
      '--network',
      'none',
      '--memory',
      `${memoryLimitMb}m`,
      '--cpus',
      `${DOCKER_CPU_LIMIT}`,
      '--pids-limit',
      `${DOCKER_PIDS_LIMIT}`,
      '--tmpfs',
      `/tmp:size=${DOCKER_TMPFS_SIZE_MB}m`,
      image,
      'node',
      '/runner/run.js',
      options.submissionId,
    ];
  }

  // 외부 명령어를 새 프로세스로 실행하는 함수
  private spawnDocker(args: string[]): Promise<DockerRunResult> {
    return new Promise((resolve, reject) => {
      const child = spawn('docker', args, { stdio: ['ignore', 'pipe', 'pipe'] });
      let stdout = '';
      let stderr = '';

      child.stdout.on('data', (chunk: Buffer | string) => {
        if (typeof chunk === 'string') {
          stdout += chunk;
        } else {
          stdout += chunk.toString();
        }
      });

      child.stderr.on('data', (chunk: Buffer | string) => {
        if (typeof chunk === 'string') {
          stderr += chunk;
        } else {
          stderr += chunk.toString();
        }
      });

      child.on('error', (error) => {
        this.logger.error(`Docker execution failed to start: ${error.message}`);
        reject(error);
      });

      child.on('close', (code, signal) => {
        resolve({
          exitCode: code,
          signal,
          stdout,
          stderr,
        });
      });
    });
  }

  private getString(key: string, fallback: string): string {
    const value = this.configService.get<string>(key);
    return value && value.trim().length > 0 ? value : fallback;
  }

  private getNumber(key: string, fallback: number): number {
    const value = this.configService.get<string>(key);
    const parsed = Number(value);
    return Number.isFinite(parsed) && parsed > 0 ? parsed : fallback;
  }
}
