import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';

import {
  ChorePriority,
  ChoreRecurrence,
  ChoreStatus,
} from '../../common/enums';
import { Household } from '../../households/entities/household.entity';
import { User } from '../../users/entities/user.entity';

@Entity('chores')
@Index(['householdId', 'status'])
export class Chore {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'household_id' })
  householdId: string;

  @Column({ length: 150 })
  title: string;

  @Column({ type: 'text', nullable: true })
  description?: string;

  /** null ise görev havuzda bekliyor */
  @Column({ name: 'assigned_to', nullable: true })
  assignedTo?: string | null;

  @Column({ name: 'due_date', type: 'timestamptz', nullable: true })
  dueDate?: Date;

  @Column({ type: 'enum', enum: ChoreStatus, default: ChoreStatus.PENDING })
  status: ChoreStatus;

  @Column({ type: 'enum', enum: ChorePriority, default: ChorePriority.MEDIUM })
  priority: ChorePriority;

  @Column({
    type: 'enum',
    enum: ChoreRecurrence,
    default: ChoreRecurrence.NONE,
  })
  recurrence: ChoreRecurrence;

  /** Tamamlandığında kazanılan katkı puanı */
  @Column({ type: 'int', default: 10 })
  points: number;

  @Column({ name: 'completed_at', type: 'timestamptz', nullable: true })
  completedAt?: Date;

  @Column({ name: 'completed_by', nullable: true })
  completedBy?: string;

  @Column({ name: 'reminder_sent_at', type: 'timestamptz', nullable: true })
  reminderSentAt?: Date;

  @Column({ name: 'created_by' })
  createdBy: string;

  @CreateDateColumn({ name: 'created_at', type: 'timestamptz' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at', type: 'timestamptz' })
  updatedAt: Date;

  @ManyToOne(() => Household, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'household_id' })
  household: Household;

  @ManyToOne(() => User, { onDelete: 'SET NULL', nullable: true })
  @JoinColumn({ name: 'assigned_to' })
  assignee?: User;
}
