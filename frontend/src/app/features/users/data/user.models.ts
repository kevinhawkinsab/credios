import { UserRole, UserStatus } from '../../../core/auth/auth.models';

export interface UserRecord {
  readonly id: string;
  readonly fullName: string;
  readonly nationalId: string | null;
  readonly email: string;
  readonly role: UserRole;
  readonly status: UserStatus;
  readonly createdAt: string;
}

export interface UpdateUserStatusPayload {
  readonly status: UserStatus;
}
