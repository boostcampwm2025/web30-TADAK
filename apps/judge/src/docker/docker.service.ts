import { spawn } from 'node:child_process';
import path from 'node:path';

import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

import {
  DOCKER_CONTAINER_NAME,
  DOCKER_CPU_LIMIT,
  DOCKER_DEFAULT_MEMORY_LIMIT_MB,
  DOCKER_PROBLEMS_PATH,
  DOCKER_RUNNER_IMAGE,
  DOCKER_SUBMISSIONS_PATH,
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
    const hostBasePath = this.getString('JUDGE_HOST_PATH', '');
    const problemsPath = hostBasePath
      ? path.resolve(hostBasePath)
      : path.resolve(this.getString('JUDGE_PROBLEMS_PATH', DOCKER_PROBLEMS_PATH));
    const submissionsPath = hostBasePath
      ? path.resolve(hostBasePath, 'submissions')
      : path.resolve(this.getString('JUDGE_SUBMISSIONS_PATH', DOCKER_SUBMISSIONS_PATH));
    const submissionOutputPath = path.join(submissionsPath, options.submissionId);
    const memoryLimitMb =
      options.memoryLimitMb ??
      this.getNumber('JUDGE_DEFAULT_MEMORY_LIMIT_MB', DOCKER_DEFAULT_MEMORY_LIMIT_MB);
    const containerName = `${DOCKER_CONTAINER_NAME}-${options.submissionId}`;
    return [
      'run',
      '--rm',
      '--name',
      containerName,
      '-v',
      `${problemsPath}:/app/data:ro`,
      '-v',
      `${submissionOutputPath}:/app/output:rw`,
      '-e',
      'IS_DOCKER=true',
      '--network',
      'none',
      '--memory',
      `${memoryLimitMb}m`,
      '--cpus',
      `${DOCKER_CPU_LIMIT}`,
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
