import { Column, CreateDateColumn, Entity, PrimaryColumn } from 'typeorm';

@Entity()
export class Battle {
  @PrimaryColumn()
  id: string;

  @Column()
  problemId: string;

  @Column({ type: 'timestamp' })
  startedAt: Date;

  @Column({ type: 'varchar', length: 255, nullable: true })
  winnerId: string | null;

  @Column({ type: 'varchar', length: 255, nullable: true })
  winnerSubmissionId: string | null;

  @Column({ type: 'varchar', length: 255, nullable: true })
  loserSubmissionId: string | null;

  @Column('simple-array')
  playerIds: string[];

  @CreateDateColumn({ type: 'timestamp' })
  createdAt: Date;
}
