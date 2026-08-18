import {
  Column,
  Entity,
  Index,
  JoinColumn,
  OneToOne,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';

import { User } from '../../users/entities/user.entity';

/** Kullanıcının hangi bildirimleri almak istediği */
@Entity('notification_preferences')
export class NotificationPreference {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Index({ unique: true })
  @Column({ name: 'user_id' })
  userId: string;

  @Column({ default: true })
  enabled: boolean;

  @Column({ name: 'bill_reminders', default: true })
  billReminders: boolean;

  @Column({ name: 'expense_alerts', default: true })
  expenseAlerts: boolean;

  @Column({ name: 'chore_reminders', default: true })
  choreReminders: boolean;

  @Column({ name: 'settlement_alerts', default: true })
  settlementAlerts: boolean;

  /** Fatura hatırlatmalarının gönderileceği saat (0-23) */
  @Column({ name: 'reminder_hour', type: 'int', default: 10 })
  reminderHour: number;

  @UpdateDateColumn({ name: 'updated_at', type: 'timestamptz' })
  updatedAt: Date;

  @OneToOne(() => User, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'user_id' })
  user: User;
}
