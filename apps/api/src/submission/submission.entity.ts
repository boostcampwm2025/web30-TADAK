import { Column, CreateDateColumn, Entity, Index, PrimaryGeneratedColumn } from 'typeorm';

@Entity()
@Index(['battleId', 'userId'])
@Index(['userId', 'createdAt'])
export class Submission {
  @PrimaryGeneratedColumn()
  id: string;

  @Column()
  problemId: string;

  @Column()
  userId: string;

  @Column({ nullable: true })
  battleId: string;

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

  @CreateDateColumn({ type: 'timestamp' })
  createdAt: Date;
}
