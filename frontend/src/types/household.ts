import { ISODateString } from './common';
import { User } from './user';

export type MemberRole = 'owner' | 'admin' | 'member';

export interface HouseholdMember {
  id: string;
  householdId: string;
  userId: string;
  role: MemberRole;
  joinedAt: ISODateString;
  user: User;
}

export interface Household {
  id: string;
  name: string;
  address?: string;
  currency: string;
  inviteCode: string;
  createdBy: string;
  createdAt: ISODateString;
  members: HouseholdMember[];
}

export interface CreateHouseholdPayload {
  name: string;
  address?: string;
  currency?: string;
}

export interface JoinHouseholdPayload {
  inviteCode: string;
}

export interface UpdateHouseholdPayload {
  name?: string;
  address?: string;
  currency?: string;
}
