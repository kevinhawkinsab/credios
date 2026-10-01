import { Role } from '@prisma/client';
import { describe, expect, it, vi } from 'vitest';
import { DashboardService } from './dashboard.service.js';

describe('DashboardService', () => {
  it('calcula la tasa de aprobación sobre solicitudes resueltas', async () => {
    const prisma = {
      creditRequest: {
        count: vi.fn(),
        aggregate: vi.fn(),
        findMany: vi.fn(),
      },
      $transaction: vi.fn().mockResolvedValue([10, 3, 5, 2, { _sum: { amount: 12500 } }, []]),
    };
    const service = new DashboardService(prisma as never);

    const summary = await service.getSummary({ sub: 'admin-id', email: 'admin@example.com', role: Role.ADMIN });

    expect(summary.metrics).toEqual({ received: 10, pending: 3, approved: 5, rejected: 2, approvalRate: 71.4, approvedAmount: 12500 });
    expect(prisma.$transaction).toHaveBeenCalledOnce();
  });
});
