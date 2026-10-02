import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { randomUUID } from 'node:crypto';
import { USER_ROLE } from '../common/constants/user.constants.js';
import { REQUEST_STATUS, RequestStatus } from '../common/constants/request.constants.js';
import type { AuthenticatedUser } from '../auth/interfaces/authenticated-user.interface.js';
import { PrismaService } from '../prisma/prisma.service.js';
import { CreateCreditRequestDto } from './dto/create-credit-request.dto.js';
import { DecisionDto } from './dto/decision.dto.js';
import { UpdateCreditRequestDto } from './dto/update-credit-request.dto.js';

const requestInclude = {
  users_credit_requests_applicant_idTousers: {
    select: { id: true, first_name: true, last_name: true, identification: true, email: true },
  },
  users_credit_requests_created_byTousers: {
    select: { id: true, first_name: true, last_name: true, email: true },
  },
  users_credit_requests_reviewed_byTousers: {
    select: { id: true, first_name: true, last_name: true, email: true },
  },
} as const;

type CreditRequestWithRelations = Prisma.credit_requestsGetPayload<{
  include: typeof requestInclude;
}>;

@Injectable()
export class CreditRequestsService {
  constructor(private readonly prisma: PrismaService) {}

  async create(user: AuthenticatedUser, dto: CreateCreditRequestDto) {
    const applicantId = user.role === USER_ROLE.USER ? user.sub : dto.applicantId;
    if (!applicantId) {
      throw new BadRequestException('El administrador debe indicar el solicitante');
    }

    const request = await this.prisma.credit_requests.create({
      data: {
        id: randomUUID(),
        request_number: this.requestNumber(),
        applicant_id: applicantId,
        created_by: user.sub,
        amount: new Prisma.Decimal(dto.amount),
        term_months: dto.termMonths,
        status: REQUEST_STATUS.PENDING,
      },
      include: requestInclude,
    });

    return this.toResponse(request);
  }

  async list(user: AuthenticatedUser, status?: RequestStatus) {
    const where: Prisma.credit_requestsWhereInput = user.role === USER_ROLE.USER
      ? { applicant_id: user.sub, ...(status ? { status } : {}) }
      : status
        ? { status }
        : {};

    const requests = await this.prisma.credit_requests.findMany({
      where,
      include: requestInclude,
      orderBy: { created_at: 'desc' },
    });

    return requests.map((request) => this.toResponse(request));
  }

  async findById(user: AuthenticatedUser, id: string) {
    const request = await this.getRequest(id);
    this.assertAccess(user, request);
    return this.toResponse(request);
  }

  async update(user: AuthenticatedUser, id: string, dto: UpdateCreditRequestDto) {
    const request = await this.getRequest(id);
    this.assertAccess(user, request);
    this.assertPending(request);

    if (dto.amount === undefined && dto.termMonths === undefined) {
      throw new BadRequestException('Debes indicar al menos un campo para actualizar');
    }

    const updated = await this.prisma.credit_requests.update({
      where: { id },
      data: {
        ...(dto.amount === undefined ? {} : { amount: new Prisma.Decimal(dto.amount) }),
        ...(dto.termMonths === undefined ? {} : { term_months: dto.termMonths }),
        version: { increment: 1 },
      },
      include: requestInclude,
    });

    return this.toResponse(updated);
  }

  async updateStatus(user: AuthenticatedUser, id: string, status: RequestStatus, decisionComment?: string) {
    if (user.role !== USER_ROLE.ADMIN) {
      throw new ForbiddenException('Solo un administrador puede decidir una solicitud');
    }

    if (status === REQUEST_STATUS.PENDING) {
      throw new BadRequestException('Una solicitud no puede volver a estado pendiente');
    }

    if (status === REQUEST_STATUS.REJECTED && !decisionComment?.trim()) {
      throw new BadRequestException('El rechazo requiere un comentario');
    }

    const request = await this.getRequest(id);
    this.assertPending(request);

    const updated = await this.prisma.credit_requests.update({
      where: { id },
      data: {
        status,
        decision_comment: decisionComment?.trim() || null,
        reviewed_by: user.sub,
        reviewed_at: new Date(),
        version: { increment: 1 },
      },
      include: requestInclude,
    });

    return this.toResponse(updated);
  }

  approve(user: AuthenticatedUser, id: string, dto: DecisionDto) {
    return this.updateStatus(user, id, REQUEST_STATUS.APPROVED, dto.comment);
  }

  reject(user: AuthenticatedUser, id: string, dto: DecisionDto) {
    return this.updateStatus(user, id, REQUEST_STATUS.REJECTED, dto.comment);
  }

  private async getRequest(id: string): Promise<CreditRequestWithRelations> {
    const request = await this.prisma.credit_requests.findUnique({
      where: { id },
      include: requestInclude,
    });

    if (!request) throw new NotFoundException('Solicitud de crédito no encontrada');
    return request;
  }

  private assertAccess(user: AuthenticatedUser, request: CreditRequestWithRelations) {
    if (user.role === USER_ROLE.USER && request.applicant_id !== user.sub) {
      throw new NotFoundException('Solicitud de crédito no encontrada');
    }
  }

  private assertPending(request: CreditRequestWithRelations) {
    if (request.status !== REQUEST_STATUS.PENDING) {
      throw new BadRequestException('Solo se pueden modificar solicitudes pendientes');
    }
  }

  private requestNumber() {
    const year = new Date().getUTCFullYear();
    return `CR-${year}-${randomUUID().slice(0, 8).toUpperCase()}`;
  }

  private toResponse(request: CreditRequestWithRelations) {
    const applicant = request.users_credit_requests_applicant_idTousers;
    const createdBy = request.users_credit_requests_created_byTousers;
    const reviewedBy = request.users_credit_requests_reviewed_byTousers;

    return {
      id: request.id,
      requestNumber: request.request_number,
      applicant: {
        id: applicant.id,
        fullName: [applicant.first_name, applicant.last_name].filter(Boolean).join(' '),
        nationalId: applicant.identification,
        email: applicant.email,
      },
      createdBy: {
        id: createdBy.id,
        fullName: [createdBy.first_name, createdBy.last_name].filter(Boolean).join(' '),
        email: createdBy.email,
      },
      amount: Number(request.amount),
      termMonths: request.term_months,
      status: request.status,
      decisionComment: request.decision_comment,
      reviewedBy: reviewedBy
        ? {
            id: reviewedBy.id,
            fullName: [reviewedBy.first_name, reviewedBy.last_name].filter(Boolean).join(' '),
            email: reviewedBy.email,
          }
        : null,
      reviewedAt: request.reviewed_at,
      version: request.version,
      createdAt: request.created_at,
      updatedAt: request.updated_at,
    };
  }
}
