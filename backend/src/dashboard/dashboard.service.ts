import { Injectable } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { USER_ROLE } from '../common/constants/user.constants.js';
import { REQUEST_STATUS } from '../common/constants/request.constants.js';
import { PrismaService } from '../prisma/prisma.service.js';
import type { AuthenticatedUser } from '../auth/interfaces/authenticated-user.interface.js';

@Injectable()
export class DashboardService {
  constructor(private readonly prisma: PrismaService) {}

  async getSummary(user: AuthenticatedUser) {
    const accessFilter: Prisma.credit_requestsWhereInput = user.role === USER_ROLE.USER
      ? { applicant_id: user.sub }
      : {};

    const [received, pending, approved, rejected, approvedAmount, recentRequests] = await this.prisma.$transaction([
      this.prisma.credit_requests.count({ where: accessFilter }),
      this.prisma.credit_requests.count({ where: { ...accessFilter, status: REQUEST_STATUS.PENDING } }),
      this.prisma.credit_requests.count({ where: { ...accessFilter, status: REQUEST_STATUS.APPROVED } }),
      this.prisma.credit_requests.count({ where: { ...accessFilter, status: REQUEST_STATUS.REJECTED } }),
      this.prisma.credit_requests.aggregate({ where: { ...accessFilter, status: REQUEST_STATUS.APPROVED }, _sum: { amount: true } }),
      this.prisma.credit_requests.findMany({
        where: accessFilter,
        include: { users_credit_requests_applicant_idTousers: { select: { first_name: true, last_name: true, identification: true } } },
        orderBy: { created_at: 'desc' },
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
        requestNumber: request.request_number,
        applicant: {
          fullName: [request.users_credit_requests_applicant_idTousers.first_name, request.users_credit_requests_applicant_idTousers.last_name].filter(Boolean).join(' '),
          nationalId: request.users_credit_requests_applicant_idTousers.identification,
        },
        amount: Number(request.amount),
        termMonths: request.term_months,
        status: request.status,
        createdAt: request.created_at,
      })),
    };
  }
}
