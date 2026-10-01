import { Injectable } from '@nestjs/common';
import { Prisma, RequestStatus, Role } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service.js';
import type { AuthenticatedUser } from '../auth/interfaces/authenticated-user.interface.js';

@Injectable()
export class DashboardService {
  constructor(private readonly prisma: PrismaService) {}

  async getSummary(user: AuthenticatedUser) {
    const accessFilter: Prisma.CreditRequestWhereInput = user.role === Role.APPLICANT
      ? { applicantId: user.sub }
      : {};

    const [received, pending, approved, rejected, approvedAmount, recentRequests] = await this.prisma.$transaction([
      this.prisma.creditRequest.count({ where: accessFilter }),
      this.prisma.creditRequest.count({ where: { ...accessFilter, status: RequestStatus.PENDING } }),
      this.prisma.creditRequest.count({ where: { ...accessFilter, status: RequestStatus.APPROVED } }),
      this.prisma.creditRequest.count({ where: { ...accessFilter, status: RequestStatus.REJECTED } }),
      this.prisma.creditRequest.aggregate({ where: { ...accessFilter, status: RequestStatus.APPROVED }, _sum: { amount: true } }),
      this.prisma.creditRequest.findMany({
        where: accessFilter,
        include: { applicant: { select: { fullName: true, nationalId: true } } },
        orderBy: { createdAt: 'desc' },
        take: 5,
      }),
    ]);

    const resolved = approved + rejected;
    const approvalRate = resolved === 0 ? 0 : Number(((approved / resolved) * 100).toFixed(1));

    return {
      metrics: {
        received,
        pending,
        approved,
        rejected,
        approvalRate,
        approvedAmount: Number(approvedAmount._sum.amount ?? 0),
      },
      recentRequests: recentRequests.map((request) => ({
        id: request.id,
        requestNumber: request.requestNumber,
        applicant: request.applicant,
        amount: Number(request.amount),
        termMonths: request.termMonths,
        status: request.status,
        createdAt: request.createdAt,
      })),
    };
  }
}
