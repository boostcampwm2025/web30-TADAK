import { Column, CreateDateColumn, Entity, PrimaryColumn } from 'typeorm';

@Entity()
export class Battle {
  @PrimaryColumn()
  id: string;

  @Column()
  problemId: string;

  @Column({ type: 'timestamp' })
  startedAt: Date;

  @Column({ nullable: true })
  winnerId: string;

  @Column({ nullable: true })
  winnerSubmissionId: string;

  @Column({ nullable: true })
  loserSubmissionId: string;

  @Column('simple-array')
  playerIds: string[];

  @CreateDateColumn({ type: 'timestamp' })
  createdAt: Date;
}
