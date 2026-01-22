import { Column, CreateDateColumn, Entity, PrimaryColumn } from 'typeorm';

@Entity()
export class Battle {
  @PrimaryColumn()
  id: string;

  @Column()
  problemId: string;

  @Column()
  startedAt: Date;

  @Column({ nullable: true })
  winnerId: string | null;

  @Column({ nullable: true })
  winnerSubmissionId: string | null;

  @Column({ nullable: true })
  loserSubmissionId: string | null;

  @Column('simple-array')
  playerIds: string[];

  @CreateDateColumn()
  createdAt: Date;
}
