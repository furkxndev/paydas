import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  JoinColumn,
  JoinTable,
  ManyToMany,
  ManyToOne,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';

import { BillRecurrence, BillStatus, BillType } from '../../common/enums';
import { decimalTransformer } from '../../common/transformers/decimal.transformer';
import { Household } from '../../households/entities/household.entity';
import { User } from '../../users/entities/user.entity';

@Entity('bills')
@Index(['householdId', 'dueDate'])
export class Bill {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'household_id' })
  householdId: string;

  @Column({ length: 150 })
  name: string;

  @Column({ type: 'enum', enum: BillType, default: BillType.DIGER })
  type: BillType;

  @Column({
    type: 'numeric',
    precision: 12,
    scale: 2,
    transformer: decimalTransformer,
  })
  amount: number;

  @Column({ name: 'due_date', type: 'timestamptz' })
  dueDate: Date;

  @Column({ type: 'enum', enum: BillStatus, default: BillStatus.PENDING })
  status: BillStatus;

  @Column({ type: 'enum', enum: BillRecurrence, default: BillRecurrence.NONE })
  recurrence: BillRecurrence;

  /** Son ödeme tarihinden kaç gün önce hatırlatma gönderileceği */
  @Column({ name: 'reminder_days_before', type: 'int', default: 3 })
  reminderDaysBefore: number;

  /** Ödendiğinde tutarın ortak gidere yansıtılıp yansıtılmayacağı */
  @Column({ name: 'auto_create_expense', default: true })
  autoCreateExpense: boolean;

  @Column({ name: 'paid_at', type: 'timestamptz', nullable: true })
  paidAt?: Date;

  @Column({ name: 'paid_by', nullable: true })
  paidBy?: string;

  /** Yaklaşan/geciken hatırlatmanın tekrar gönderilmesini engeller */
  @Column({ name: 'due_reminder_sent_at', type: 'timestamptz', nullable: true })
  dueReminderSentAt?: Date;

  @Column({
    name: 'overdue_reminder_sent_at',
    type: 'timestamptz',
    nullable: true,
  })
  overdueReminderSentAt?: Date;

  @Column({ type: 'text', nullable: true })
  notes?: string;

  @Column({ name: 'created_by' })
  createdBy: string;

  @CreateDateColumn({ name: 'created_at', type: 'timestamptz' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at', type: 'timestamptz' })
  updatedAt: Date;

  @ManyToOne(() => Household, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'household_id' })
  household: Household;

  /** Faturayı paylaşan üyeler */
  @ManyToMany(() => User, { eager: true })
  @JoinTable({
    name: 'bill_participants',
    joinColumn: { name: 'bill_id', referencedColumnName: 'id' },
    inverseJoinColumn: { name: 'user_id', referencedColumnName: 'id' },
  })
  participants: User[];
}
