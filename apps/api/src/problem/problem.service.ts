import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { ProblemData } from '@packages/types/problem';
import * as fs from 'fs';
import * as path from 'path';
import { Repository } from 'typeorm';

import { Problem } from './problem.entity';

@Injectable()
export class ProblemService implements OnModuleInit {
  private readonly logger = new Logger(ProblemService.name);

  constructor(
    @InjectRepository(Problem)
    private readonly problemRepository: Repository<Problem>,
  ) {}

  async onModuleInit() {
    // 서버 시작 시 항상 최신 데이터로 업데이트 시도
    await this.importProblemsFromJson();
  }

  async importProblemsFromJson() {
    try {
      const filePath = path.join(__dirname, '../data/problems.json');
      if (!fs.existsSync(filePath)) {
        this.logger.error(`File not found: ${filePath}`);
        return;
      }

      const fileContent = fs.readFileSync(filePath, 'utf8');
      const problemsData = JSON.parse(fileContent) as ProblemData[];

      for (const data of problemsData) {
        const problem = new Problem();
        problem.id = data.id;
        problem.source = data.source;
        problem.difficulty = data.difficulty;

        // tags 파싱: "['math', 'implementation']" -> ["math", "implementation"]
        if (typeof data.tags === 'string') {
          try {
            // 따옴표를 표준 JSON 형식으로 바꿔서 파싱 시도
            const formattedTags = data.tags.replace(/'/g, '"');
            problem.tags = JSON.parse(formattedTags) as string[];
          } catch {
            this.logger.warn(`Failed to parse tags for problem ${data.id}: ${data.tags}`);
            problem.tags = [];
          }
        } else {
          problem.tags = data.tags || [];
        }

        problem.url = data.url;
        problem.title = data.title;
        // JSON 파일은 snake_case 사용
        problem.timeLimit = data.timeLimit ?? data.timeLimit;
        problem.memoryLimit = data.memoryLimit ?? data.memoryLimit;
        problem.statement = data.statement;
        problem.input = data.input;
        problem.output = data.output;
        problem.note = data.note;
        problem.examples = data.examples || [];
        problem.testcases = data.testcases || [];
        problem.battleTimeLimit = data.battleTimeLimit ?? 1800;

        await this.problemRepository.save(problem);
      }

      this.logger.log(`Successfully imported or updated ${problemsData.length} problems.`);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      this.logger.error(`Failed to import problems: ${errorMessage}`);
    }
  }

  async findAll(): Promise<Problem[]> {
    return this.problemRepository.find();
  }

  async findFirst(): Promise<Problem | null> {
    return this.problemRepository.findOne({
      where: { difficulty: 'Bronze' },
      order: { id: 'ASC' },
    });
  }

  async findOne(id: string): Promise<Problem | null> {
    return this.problemRepository.findOne({ where: { id } });
  }
}
