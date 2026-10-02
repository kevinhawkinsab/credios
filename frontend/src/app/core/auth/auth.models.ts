export type UserRole = 'USER' | 'ADMIN';
export type UserStatus = 'ACTIVE' | 'INACTIVE' | 'BLOCKED';

export interface AuthUser {
  readonly id: string;
  readonly fullName: string;
  readonly nationalId: string | null;
  readonly email: string;
  readonly role: UserRole;
  readonly status: UserStatus;
}

export interface AuthResponse {
  readonly accessToken: string;
  readonly refreshToken: string;
  readonly expiresAt: string;
  readonly user: AuthUser;
}

export interface LoginPayload {
  readonly email: string;
  readonly password: string;
}

export interface RegisterPayload {
  readonly fullName: string;
  readonly nationalId: string;
  readonly email: string;
  readonly password: string;
}
