import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';

import { MemberRole, NotificationType } from '../common/enums';
import { createInviteCode } from '../common/utils/money.util';
import { NotificationsService } from '../notifications/notifications.service';
import { User } from '../users/entities/user.entity';
import {
  CreateHouseholdDto,
  JoinHouseholdDto,
  UpdateHouseholdDto,
} from './dto';
import { HouseholdMember } from './entities/household-member.entity';
import { Household } from './entities/household.entity';

@Injectable()
export class HouseholdsService {
  constructor(
    @InjectRepository(Household)
    private readonly households: Repository<Household>,
    @InjectRepository(HouseholdMember)
    private readonly members: Repository<HouseholdMember>,
    private readonly notifications: NotificationsService,
  ) {}

  // --- Yetki kontrolleri ---

  /** Kullanıcının evdeki üyeliğini döner; üye değilse 403 */
  async requireMembership(
    householdId: string,
    userId: string,
  ): Promise<HouseholdMember> {
    const membership = await this.members.findOne({
      where: { householdId, userId },
    });
    if (!membership)
      throw new ForbiddenException('Bu eve erişim yetkiniz yok.');
    return membership;
  }

  async requireAdmin(
    householdId: string,
    userId: string,
  ): Promise<HouseholdMember> {
    const membership = await this.requireMembership(householdId, userId);
    if (membership.role === MemberRole.MEMBER) {
      throw new ForbiddenException('Bu işlem için yönetici olmalısınız.');
    }
    return membership;
  }

  /**
   * Evin tüm üyelerinin kullanıcı id'leri (bildirim hedefleri, pay dağıtımı).
   *
   * Sıralama katılım tarihine göre sabitlenir: PostgreSQL ORDER BY olmadan
   * satır sırası garanti etmez ve bu, eşit bölüşümde kuruş artığının her seferinde
   * başka kişiye gitmesine yol açardı.
   */
  async memberIds(householdId: string): Promise<string[]> {
    const rows = await this.members.find({
      where: { householdId },
      select: { userId: true, joinedAt: true },
      order: { joinedAt: 'ASC', userId: 'ASC' },
    });
    return rows.map((row) => row.userId);
  }

  // --- Okuma ---

  async findOne(householdId: string, userId: string): Promise<Household> {
    await this.requireMembership(householdId, userId);
    const household = await this.households.findOne({
      where: { id: householdId },
      relations: { members: true },
    });
    if (!household) throw new NotFoundException('Ev bulunamadı.');
    household.members.sort(
      (a, b) => a.joinedAt.getTime() - b.joinedAt.getTime(),
    );
    return household;
  }

  async listForUser(userId: string): Promise<Household[]> {
    const memberships = await this.members.find({ where: { userId } });
    if (memberships.length === 0) return [];

    const households = await this.households.find({
      where: memberships.map((m) => ({ id: m.householdId })),
      relations: { members: true },
    });
    households.forEach((household) =>
      household.members.sort(
        (a, b) => a.joinedAt.getTime() - b.joinedAt.getTime(),
      ),
    );
    return households;
  }

  /** Diğer servislerin para birimi gibi bilgilere ulaşması için */
  async getRaw(householdId: string): Promise<Household> {
    const household = await this.households.findOne({
      where: { id: householdId },
    });
    if (!household) throw new NotFoundException('Ev bulunamadı.');
    return household;
  }

  // --- Yazma ---

  /** Davet kodu benzersiz olana kadar yeniden üretilir */
  private async generateUniqueInviteCode(): Promise<string> {
    for (let attempt = 0; attempt < 10; attempt += 1) {
      const code = createInviteCode();
      if (!(await this.households.existsBy({ inviteCode: code }))) return code;
    }
    throw new BadRequestException(
      'Davet kodu üretilemedi, lütfen tekrar deneyin.',
    );
  }

  async create(user: User, dto: CreateHouseholdDto): Promise<Household> {
    const household = await this.households.save(
      this.households.create({
        name: dto.name.trim(),
        address: dto.address?.trim(),
        currency: dto.currency ?? 'TRY',
        inviteCode: await this.generateUniqueInviteCode(),
        createdBy: user.id,
      }),
    );

    await this.members.save(
      this.members.create({
        householdId: household.id,
        userId: user.id,
        role: MemberRole.OWNER,
      }),
    );

    return this.findOne(household.id, user.id);
  }

  async join(user: User, dto: JoinHouseholdDto): Promise<Household> {
    const household = await this.households.findOne({
      where: { inviteCode: dto.inviteCode.trim().toUpperCase() },
    });
    if (!household) {
      throw new NotFoundException(
        'Davet kodu geçersiz. Kodu kontrol edip tekrar deneyin.',
      );
    }

    const existing = await this.members.findOne({
      where: { householdId: household.id, userId: user.id },
    });

    if (!existing) {
      await this.members.save(
        this.members.create({
          householdId: household.id,
          userId: user.id,
          role: MemberRole.MEMBER,
        }),
      );

      await this.notifications.dispatch({
        householdId: household.id,
        type: NotificationType.MEMBER_JOINED,
        title: 'Eve yeni bir katılım var',
        body: `${user.fullName} ${household.name} evine katıldı.`,
        userIds: await this.memberIds(household.id),
        excludeUserId: user.id,
      });
    }

    return this.findOne(household.id, user.id);
  }

  async update(
    householdId: string,
    userId: string,
    dto: UpdateHouseholdDto,
  ): Promise<Household> {
    await this.requireAdmin(householdId, userId);
    const household = await this.getRaw(householdId);

    Object.assign(household, {
      name: dto.name?.trim() ?? household.name,
      address: dto.address ?? household.address,
      currency: dto.currency ?? household.currency,
    });
    await this.households.save(household);
    return this.findOne(householdId, userId);
  }

  async regenerateInviteCode(
    householdId: string,
    userId: string,
  ): Promise<Household> {
    await this.requireAdmin(householdId, userId);
    const household = await this.getRaw(householdId);
    household.inviteCode = await this.generateUniqueInviteCode();
    await this.households.save(household);
    return this.findOne(householdId, userId);
  }

  async removeMember(
    householdId: string,
    userId: string,
    targetUserId: string,
  ): Promise<Household> {
    await this.requireAdmin(householdId, userId);

    const target = await this.members.findOne({
      where: { householdId, userId: targetUserId },
    });
    if (!target) throw new NotFoundException('Üye bulunamadı.');
    if (target.role === MemberRole.OWNER) {
      throw new BadRequestException('Ev sahibi evden çıkarılamaz.');
    }

    await this.members.delete({ id: target.id });
    return this.findOne(householdId, userId);
  }

  async leave(householdId: string, userId: string): Promise<void> {
    const membership = await this.requireMembership(householdId, userId);
    if (membership.role === MemberRole.OWNER) {
      throw new BadRequestException(
        'Ev sahibi evden ayrılamaz. Önce sahipliği devredin.',
      );
    }
    await this.members.delete({ id: membership.id });
  }
}
