import { spawn } from 'node:child_process';
import os from 'node:os';
import path from 'node:path';

import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

import {
  DOCKER_CONTAINER_NAME,
  DOCKER_CPU_LIMIT,
  DOCKER_DEFAULT_MEMORY_LIMIT_MB,
  DOCKER_RUNNER_IMAGE,
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
    this.logger.debug(`ARGS: ${args.join(' ')}`);
    return this.spawnDocker(args);
  }

  // private buildRunArgs(options: DockerRunOptions): string[] {
  //   const image = this.getString('JUDGE_RUNNER_IMAGE', DOCKER_RUNNER_IMAGE);
  //   const hostBasePath = this.getString('JUDGE_HOST_PATH', '');
  //   const problemsPath = hostBasePath
  //     ? path.resolve(hostBasePath)
  //     : path.resolve(this.getString('JUDGE_PROBLEMS_PATH', DOCKER_PROBLEMS_PATH));
  //   const submissionsPath = hostBasePath
  //     ? path.resolve(hostBasePath, 'submissions')
  //     : path.resolve(this.getString('JUDGE_SUBMISSIONS_PATH', DOCKER_SUBMISSIONS_PATH));
  //   const submissionOutputPath = path.join(submissionsPath, options.submissionId);
  //   const memoryLimitMb =
  //     options.memoryLimitMb ??
  //     this.getNumber('JUDGE_DEFAULT_MEMORY_LIMIT_MB', DOCKER_DEFAULT_MEMORY_LIMIT_MB);
  //   const containerName = `${DOCKER_CONTAINER_NAME}-${options.submissionId}`;
  //   return [
  //     'run',
  //     // '--rm',
  //     '--name',
  //     containerName,
  //     '-v',
  //     `${problemsPath}:/app/data:ro`,
  //     '-v',
  //     `${submissionOutputPath}:/app/output:rw`,
  //     '-e',
  //     'IS_DOCKER=true',
  //     '--network',
  //     'none',
  //     '--memory',
  //     `${memoryLimitMb}m`,
  //     '--cpus',
  //     `${DOCKER_CPU_LIMIT}`,
  //     '--tmpfs',
  //     `/tmp:size=${DOCKER_TMPFS_SIZE_MB}m`,
  //     image,
  //     'node',
  //     '/runner/run.js',
  //     options.submissionId,
  //   ];
  // }

  toDockerPath(hostPath: string): string {
    // 1. Windows 계열 플랫폼이 아니면 그대로 반환
    if (os.platform() !== 'win32' && os.platform() !== 'cygwin') {
      return hostPath;
    }

    // 2. 백슬래시를 슬래시로 통일하고 중복 슬래시 제거
    const normalized = hostPath.replace(/\\/g, '/');

    // 3. 드라이브 문자 변환 (C:/path -> /c/path)
    // [A-Za-z]: 부분만 캡처하여 소문자로 바꾸고 나머지를 붙입니다.
    const driveLetterRegex = /^([a-zA-Z]):/;
    const match = normalized.match(driveLetterRegex);

    if (match) {
      const drive = match[1].toLowerCase();
      const rest = normalized.substring(2); // 'C:' 이후의 문자열

      // '/'로 시작하지 않는 경우(예: C:abc)를 대비해 경로 구분자 보정
      const separator = rest.startsWith('/') ? '' : '/';
      return `/${drive}${separator}${rest}`;
    }

    return normalized;
  }

  private buildRunArgs(options: DockerRunOptions): string[] {
    const image = this.getString('JUDGE_RUNNER_IMAGE', DOCKER_RUNNER_IMAGE);

    // 1. 호스트 경로 가져오기
    let hostBasePath = process.env.JUDGE_HOST_PATH || 'judge-data';

    if (!path.isAbsolute(hostBasePath)) {
      hostBasePath = path.resolve(hostBasePath);
    }

    // 2. Windows/WSL 호환 경로로 변환
    const dockerHostBasePath = this.toDockerPath(hostBasePath);

    this.logger.log(`Docker Host Base Path: ${dockerHostBasePath}`);

    // 3. submissions 경로
    const submissionsPath = path.join(dockerHostBasePath, 'submissions');
    const submissionOutputPath = path.join(submissionsPath, options.submissionId);

    const memoryLimitMb =
      options.memoryLimitMb ??
      this.getNumber('JUDGE_DEFAULT_MEMORY_LIMIT_MB', DOCKER_DEFAULT_MEMORY_LIMIT_MB);

    const containerName = `${DOCKER_CONTAINER_NAME}-${options.submissionId}`;

    return [
      'run',
      // '--rm',
      '--name',
      containerName,
      '-v',
      `${dockerHostBasePath}:/app/data:ro`,
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
