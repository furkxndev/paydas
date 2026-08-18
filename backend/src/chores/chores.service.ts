import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';

import {
  ChoreRecurrence,
  ChoreStatus,
  NotificationType,
} from '../common/enums';
import { addDays, choreRecurrenceToDays } from '../common/utils/date.util';
import { HouseholdsService } from '../households/households.service';
import { NotificationsService } from '../notifications/notifications.service';
import { User } from '../users/entities/user.entity';
import { CreateChoreDto, UpdateChoreDto } from './dto';
import { Chore } from './entities/chore.entity';

@Injectable()
export class ChoresService {
  constructor(
    @InjectRepository(Chore)
    private readonly chores: Repository<Chore>,
    private readonly households: HouseholdsService,
    private readonly notifications: NotificationsService,
  ) {}

  async list(householdId: string, userId: string): Promise<Chore[]> {
    await this.households.requireMembership(householdId, userId);
    const chores = await this.chores.find({ where: { householdId } });

    // Bekleyenler önce, sonra son tarihe göre
    return chores.sort((a, b) => {
      if (a.status !== b.status)
        return a.status === ChoreStatus.PENDING ? -1 : 1;
      const aDue = a.dueDate?.getTime() ?? Number.MAX_SAFE_INTEGER;
      const bDue = b.dueDate?.getTime() ?? Number.MAX_SAFE_INTEGER;
      return aDue - bDue;
    });
  }

  async findOne(choreId: string, userId: string): Promise<Chore> {
    const chore = await this.chores.findOne({ where: { id: choreId } });
    if (!chore) throw new NotFoundException('Görev bulunamadı.');
    await this.households.requireMembership(chore.householdId, userId);
    return chore;
  }

  private async notifyAssignment(chore: Chore, actor: User): Promise<void> {
    if (!chore.assignedTo || chore.assignedTo === actor.id) return;
    await this.notifications.dispatch({
      householdId: chore.householdId,
      type: NotificationType.CHORE_ASSIGNED,
      title: 'Sana yeni bir görev atandı',
      body: chore.dueDate
        ? `${chore.title} • Son tarih: ${chore.dueDate.toLocaleDateString('tr-TR')}`
        : chore.title,
      data: { choreId: chore.id, type: 'chore_assigned' },
      userIds: [chore.assignedTo],
      channelId: 'chores',
    });
  }

  async create(
    householdId: string,
    user: User,
    dto: CreateChoreDto,
  ): Promise<Chore> {
    await this.households.requireMembership(householdId, user.id);

    const chore = await this.chores.save(
      this.chores.create({
        householdId,
        title: dto.title.trim(),
        description: dto.description?.trim(),
        assignedTo: dto.assignedTo ?? null,
        dueDate: dto.dueDate ? new Date(dto.dueDate) : undefined,
        priority: dto.priority,
        recurrence: dto.recurrence,
        points: dto.points,
        createdBy: user.id,
      }),
    );

    await this.notifyAssignment(chore, user);
    return chore;
  }

  async update(
    choreId: string,
    user: User,
    dto: UpdateChoreDto,
  ): Promise<Chore> {
    const chore = await this.findOne(choreId, user.id);
    const previousAssignee = chore.assignedTo;

    Object.assign(chore, {
      title: dto.title?.trim() ?? chore.title,
      description: dto.description ?? chore.description,
      assignedTo:
        dto.assignedTo !== undefined ? dto.assignedTo : chore.assignedTo,
      dueDate: dto.dueDate ? new Date(dto.dueDate) : chore.dueDate,
      priority: dto.priority ?? chore.priority,
      recurrence: dto.recurrence ?? chore.recurrence,
      points: dto.points ?? chore.points,
      status: dto.status ?? chore.status,
    });

    const saved = await this.chores.save(chore);
    if (saved.assignedTo && saved.assignedTo !== previousAssignee) {
      await this.notifyAssignment(saved, user);
    }
    return saved;
  }

  /** Tamamlanan tekrarlayan görevler bir sonraki dönem için yeniden oluşturulur */
  async setCompleted(
    choreId: string,
    user: User,
    completed: boolean,
  ): Promise<Chore> {
    const chore = await this.findOne(choreId, user.id);

    if (!completed) {
      chore.status = ChoreStatus.PENDING;
      chore.completedAt = undefined;
      chore.completedBy = undefined;
      return this.chores.save(chore);
    }

    chore.status = ChoreStatus.DONE;
    chore.completedAt = new Date();
    chore.completedBy = user.id;
    await this.chores.save(chore);

    const recurrenceDays = choreRecurrenceToDays(
      chore.recurrence ?? ChoreRecurrence.NONE,
    );
    if (recurrenceDays > 0) {
      await this.chores.save(
        this.chores.create({
          householdId: chore.householdId,
          title: chore.title,
          description: chore.description,
          assignedTo: chore.assignedTo,
          dueDate: addDays(chore.dueDate ?? new Date(), recurrenceDays),
          priority: chore.priority,
          recurrence: chore.recurrence,
          points: chore.points,
          createdBy: chore.createdBy,
        }),
      );
    }

    await this.notifications.dispatch({
      householdId: chore.householdId,
      type: NotificationType.CHORE_COMPLETED,
      title: 'Bir ev işi tamamlandı',
      body: `${user.fullName.split(' ')[0]} "${chore.title}" görevini tamamladı.`,
      data: { choreId: chore.id, type: 'chore_completed' },
      userIds: await this.households.memberIds(chore.householdId),
      excludeUserId: user.id,
      channelId: 'chores',
    });

    return chore;
  }

  async remove(choreId: string, userId: string): Promise<void> {
    const chore = await this.findOne(choreId, userId);
    await this.chores.delete({ id: chore.id });
  }

  /** Hatırlatma görevinin kullandığı sorgu */
  findPendingWithDueDate(): Promise<Chore[]> {
    return this.chores.find({ where: { status: ChoreStatus.PENDING } });
  }

  markReminderSent(chore: Chore): Promise<Chore> {
    chore.reminderSentAt = new Date();
    return this.chores.save(chore);
  }
}
