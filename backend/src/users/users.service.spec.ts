import { USER_ROLE, USER_STATUS } from '../common/constants/user.constants.js';
import { describe, expect, it, vi } from 'vitest';
import { UsersService } from './users.service.js';

describe('UsersService', () => {
  it('no expone password_hash al listar usuarios', async () => {
    const users = [{ id: 'user-id', first_name: 'Ana', last_name: null, identification: '8-123-456', email: 'ana@example.com', role: USER_ROLE.USER, status: USER_STATUS.ACTIVE, createdAt: new Date() }];
    const prisma = { user: { findMany: vi.fn().mockResolvedValue(users) } };
    const service = new UsersService(prisma as never);

    await expect(service.list()).resolves.toEqual([{
      id: users[0].id,
      fullName: 'Ana',
      nationalId: users[0].identification,
      email: users[0].email,
      role: users[0].role,
      status: users[0].status,
      createdAt: users[0].createdAt,
    }]);
    expect(prisma.user.findMany).toHaveBeenCalledOnce();
  });
});
