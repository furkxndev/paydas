import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';

import { PlatformRole } from '../common/enums';
import { UpdateProfileDto } from './dto/update-profile.dto';
import { User } from './entities/user.entity';

@Injectable()
export class UsersService {
  constructor(
    @InjectRepository(User)
    private readonly users: Repository<User>,
  ) {}

  findById(id: string): Promise<User | null> {
    return this.users.findOne({ where: { id } });
  }

  /** Giriş sırasında şifre karşılaştırması için kullanılır */
  findByEmail(email: string): Promise<User | null> {
    return this.users.findOne({ where: { email: email.trim().toLowerCase() } });
  }

  async getById(id: string): Promise<User> {
    const user = await this.findById(id);
    if (!user) throw new NotFoundException('Kullanıcı bulunamadı.');
    return user;
  }

  emailExists(email: string): Promise<boolean> {
    return this.users.existsBy({ email: email.trim().toLowerCase() });
  }

  /** Sistemdeki ilk kullanıcı yönetici yapılır (bkz. AuthService.register) */
  count(): Promise<number> {
    return this.users.count();
  }

  countAdmins(): Promise<number> {
    return this.users.countBy({ platformRole: PlatformRole.ADMIN });
  }

  create(data: Partial<User>): Promise<User> {
    return this.users.save(this.users.create(data));
  }

  async updateProfile(userId: string, dto: UpdateProfileDto): Promise<User> {
    const user = await this.getById(userId);
    Object.assign(user, {
      fullName: dto.fullName?.trim() ?? user.fullName,
      phone: dto.phone ?? user.phone,
      avatarUrl: dto.avatarUrl ?? user.avatarUrl,
    });
    return this.users.save(user);
  }

  async touchLastLogin(userId: string): Promise<void> {
    await this.users.update({ id: userId }, { lastLoginAt: new Date() });
  }

  save(user: User): Promise<User> {
    return this.users.save(user);
  }

  /**
   * Kullanıcının kendi hesabını silmesi (KVKK / App Store zorunluluğu).
   * Kurduğu evler ve onlara bağlı tüm veriler CASCADE ile birlikte silinir.
   */
  async deleteAccount(userId: string): Promise<void> {
    await this.users.delete({ id: userId });
  }

  findManyByIds(ids: string[]): Promise<User[]> {
    if (ids.length === 0) return Promise.resolve([]);
    return this.users.find({ where: ids.map((id) => ({ id })) });
  }
}
