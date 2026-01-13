import { Column, Entity, PrimaryColumn } from 'typeorm';

@Entity()
export class Problem {
  @PrimaryColumn()
  id: string;

  @Column()
  source: string;

  @Column()
  difficulty: string;

  @Column({ type: 'json' })
  tags: string[];

  @Column()
  url: string;

  @Column()
  title: string;

  @Column({ name: 'time_limit' })
  timeLimit: number;

  @Column({ name: 'memory_limit' })
  memoryLimit: number;

  @Column({ type: 'text' })
  statement: string;

  @Column({ type: 'text', nullable: true })
  input: string;

  @Column({ type: 'text', nullable: true })
  output: string;

  @Column({ type: 'text', nullable: true })
  note: string;

  @Column({ type: 'json' })
  examples: { input: string; output: string }[];

  @Column({ type: 'json' })
  testcases: { input: string; output: string }[];
}
