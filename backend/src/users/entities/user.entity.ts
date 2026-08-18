import { Exclude } from 'class-transformer';
import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  OneToMany,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';

import { PlatformRole, UserStatus } from '../../common/enums';
import { HouseholdMember } from '../../households/entities/household-member.entity';

@Entity('users')
export class User {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'full_name', length: 120 })
  fullName: string;

  @Index({ unique: true })
  @Column({ length: 180 })
  email: string;

  /** Yanıtlarda asla dönmemeli */
  @Exclude()
  @Column({ name: 'password_hash' })
  passwordHash: string;

  @Column({ length: 30, nullable: true })
  phone?: string;

  @Column({ name: 'avatar_url', nullable: true })
  avatarUrl?: string;

  /**
   * Sistemdeki ilk kullanıcı otomatik olarak 'admin' olur (bkz. AuthService.register).
   * Ev içi rollerden bağımsızdır.
   */
  @Column({
    name: 'platform_role',
    type: 'enum',
    enum: PlatformRole,
    default: PlatformRole.USER,
  })
  platformRole: PlatformRole;

  @Column({ type: 'enum', enum: UserStatus, default: UserStatus.ACTIVE })
  status: UserStatus;

  @Column({ name: 'email_verified_at', type: 'timestamptz', nullable: true })
  emailVerifiedAt?: Date | null;

  @Column({ name: 'last_login_at', type: 'timestamptz', nullable: true })
  lastLoginAt?: Date;

  @CreateDateColumn({ name: 'created_at', type: 'timestamptz' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at', type: 'timestamptz' })
  updatedAt: Date;

  @OneToMany(() => HouseholdMember, (member) => member.user)
  memberships: HouseholdMember[];
}
