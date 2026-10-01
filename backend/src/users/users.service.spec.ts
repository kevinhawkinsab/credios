import { Role } from '@prisma/client';
import { describe, expect, it, vi } from 'vitest';
import { UsersService } from './users.service.js';

describe('UsersService', () => {
  it('no expone password_hash al listar usuarios', async () => {
    const users = [{ id: 'user-id', fullName: 'Ana', nationalId: '8-123-456', email: 'ana@example.com', role: Role.APPLICANT, isActive: true, createdAt: new Date() }];
    const prisma = { user: { findMany: vi.fn().mockResolvedValue(users) } };
    const service = new UsersService(prisma as never);

    await expect(service.list()).resolves.toEqual(users);
    expect(prisma.user.findMany).toHaveBeenCalledOnce();
  });
});
