import { Column, Entity, PrimaryGeneratedColumn } from 'typeorm';

@Entity()
export class Submission {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  problemId: string;

  @Column()
  userId: string;

  @Column({ type: 'text' })
  code: string;

  @Column()
  language: string;

  @Column({ default: 'PENDING' })
  status: string;

  @Column({ type: 'int', nullable: true })
  passedTestCases: number;

  @Column({ type: 'int', nullable: true })
  totalTestCases: number;

  @Column({ type: 'int', nullable: true })
  executionTime: number;

  @Column({ type: 'int', nullable: true })
  memoryUsed: number;

  @Column({ type: 'text', nullable: true })
  output: string;
}
