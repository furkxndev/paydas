import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  JoinColumn,
  ManyToOne,
  OneToMany,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';

import { ExpenseCategory, SplitType } from '../../common/enums';
import { decimalTransformer } from '../../common/transformers/decimal.transformer';
import { Household } from '../../households/entities/household.entity';
import { User } from '../../users/entities/user.entity';
import { ExpenseShare } from './expense-share.entity';

@Entity('expenses')
@Index(['householdId', 'date'])
export class Expense {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'household_id' })
  householdId: string;

  @Column({ length: 150 })
  title: string;

  @Column({ type: 'text', nullable: true })
  description?: string;

  @Column({
    type: 'numeric',
    precision: 12,
    scale: 2,
    transformer: decimalTransformer,
  })
  amount: number;

  @Column({
    type: 'enum',
    enum: ExpenseCategory,
    default: ExpenseCategory.DIGER,
  })
  category: ExpenseCategory;

  /** Ödemeyi fiilen yapan üye */
  @Column({ name: 'paid_by' })
  paidBy: string;

  @Column({ type: 'timestamptz' })
  date: Date;

  @Column({
    name: 'split_type',
    type: 'enum',
    enum: SplitType,
    default: SplitType.EQUAL,
  })
  splitType: SplitType;

  /** Fatura ödemesinden otomatik oluştuysa kaynak fatura */
  @Column({ name: 'bill_id', nullable: true })
  billId?: string;

  @Column({ name: 'created_by' })
  createdBy: string;

  @CreateDateColumn({ name: 'created_at', type: 'timestamptz' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at', type: 'timestamptz' })
  updatedAt: Date;

  @ManyToOne(() => Household, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'household_id' })
  household: Household;

  @ManyToOne(() => User, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'paid_by' })
  payer: User;

  @OneToMany(() => ExpenseShare, (share) => share.expense, {
    cascade: true,
    eager: true,
  })
  shares: ExpenseShare[];
}
