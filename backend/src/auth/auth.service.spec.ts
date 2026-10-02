import { UnauthorizedException } from '@nestjs/common';
import { USER_ROLE, USER_STATUS } from '../common/constants/user.constants.js';
import { describe, expect, it, vi } from 'vitest';
import { AuthService } from './auth.service.js';

describe('AuthService', () => {
  it('rechaza credenciales de un usuario inexistente', async () => {
    const prisma = { user: { findFirst: vi.fn().mockResolvedValue(null) } };
    const service = new AuthService(prisma as never, {} as never, {} as never);

    await expect(service.login({ email: 'missing@example.com', password: 'Password1' })).rejects.toBeInstanceOf(UnauthorizedException);
  });

  it('devuelve el perfil sin password_hash', async () => {
    const user = {
      id: 'user-id',
      first_name: 'Ana',
      last_name: 'González',
      identification: '8-123-456',
      fullName: 'Ana González',
      nationalId: '8-123-456',
      email: 'ana@example.com',
      passwordHash: 'hash',
      role: USER_ROLE.USER,
      status: USER_STATUS.ACTIVE,
    };
    const prisma = { user: { findUnique: vi.fn().mockResolvedValue(user) } };
    const service = new AuthService(prisma as never, {} as never, {} as never);

    await expect(service.getProfile('user-id')).resolves.toEqual({
      id: user.id,
      fullName: 'Ana González',
      nationalId: user.identification,
      email: user.email,
      role: user.role,
      status: user.status,
    });
  });
});
