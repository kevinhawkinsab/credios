import { UnauthorizedException } from '@nestjs/common';
import { Role } from '@prisma/client';
import { describe, expect, it, vi } from 'vitest';
import { AuthService } from './auth.service.js';

describe('AuthService', () => {
  it('rechaza credenciales de un usuario inexistente', async () => {
    const prisma = { user: { findUnique: vi.fn().mockResolvedValue(null) } };
    const service = new AuthService(prisma as never, {} as never, {} as never);

    await expect(service.login({ email: 'missing@example.com', password: 'Password1' })).rejects.toBeInstanceOf(UnauthorizedException);
  });

  it('devuelve el perfil sin password_hash', async () => {
    const user = {
      id: 'user-id',
      fullName: 'Ana González',
      nationalId: '8-123-456',
      email: 'ana@example.com',
      passwordHash: 'hash',
      role: Role.APPLICANT,
      isActive: true,
    };
    const prisma = { user: { findUnique: vi.fn().mockResolvedValue(user) } };
    const service = new AuthService(prisma as never, {} as never, {} as never);

    await expect(service.getProfile('user-id')).resolves.toEqual({
      id: user.id,
      fullName: user.fullName,
      nationalId: user.nationalId,
      email: user.email,
      role: user.role,
    });
  });
});
