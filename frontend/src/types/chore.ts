import { ISODateString } from './common';

export type ChoreStatus = 'pending' | 'done';
export type ChorePriority = 'low' | 'medium' | 'high';
export type ChoreRecurrence = 'none' | 'daily' | 'weekly' | 'biweekly' | 'monthly';

export interface Chore {
  id: string;
  householdId: string;
  title: string;
  description?: string;
  /** Atanan üyenin userId'si; null ise havuzda bekliyor */
  assignedTo: string | null;
  dueDate?: ISODateString;
  status: ChoreStatus;
  priority: ChorePriority;
  recurrence: ChoreRecurrence;
  /** Tamamlandığında kazanılan katkı puanı */
  points: number;
  completedAt?: ISODateString;
  completedBy?: string;
  createdBy: string;
  createdAt: ISODateString;
}

export interface CreateChorePayload {
  title: string;
  description?: string;
  assignedTo?: string | null;
  dueDate?: ISODateString;
  priority?: ChorePriority;
  recurrence?: ChoreRecurrence;
  points?: number;
}

export type UpdateChorePayload = Partial<CreateChorePayload> & { status?: ChoreStatus };

export interface ChoreLeaderboardRow {
  userId: string;
  completedCount: number;
  points: number;
}
