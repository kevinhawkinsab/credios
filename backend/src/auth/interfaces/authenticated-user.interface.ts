import type { UserRole } from '../../common/constants/user.constants.js';

export interface AuthenticatedUser {
  sub: string;
  email: string;
  role: UserRole;
}
