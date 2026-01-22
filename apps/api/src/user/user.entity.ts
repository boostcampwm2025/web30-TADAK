import { Column, Entity, PrimaryGeneratedColumn } from 'typeorm';

@Entity()
export class User {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  username: string;

  @Column({ unique: true })
  githubId: string;

  @Column({ nullable: true })
  avatarUrl: string;

  @Column({ type: 'text', nullable: true })
  refreshToken: string | null;

  @Column({ type: 'int', default: 1500 })
  rating: number = 1500;

  @Column({ type: 'float', default: 350 })
  rd: number = 350;

  @Column({ type: 'float', default: 0.06 })
  volatility: number = 0.06;

  @Column({ type: 'json' })
  tier: { tier: string; division: number } = { tier: 'SILVER', division: 2 };

  @Column({ type: 'int', default: 0 })
  wins: number;

  @Column({ type: 'int', default: 0 })
  losses: number;

  @Column({ type: 'int', default: 0 })
  draws: number;

  @Column({ type: 'timestamp', default: () => 'CURRENT_TIMESTAMP' })
  createdAt: Date;
}
