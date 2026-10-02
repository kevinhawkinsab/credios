import { Injectable, NotFoundException } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import type { UserStatus } from '../common/constants/user.constants.js';
import { PrismaService } from '../prisma/prisma.service.js';

const publicUserSelect = {
  id: true,
  first_name: true,
  last_name: true,
  identification: true,
  email: true,
  role: true,
  status: true,
  createdAt: true,
} as const;

@Injectable()
export class UsersService {
  constructor(private readonly prisma: PrismaService) {}

  async list() {
    const users = await this.prisma.user.findMany({ select: publicUserSelect, orderBy: { createdAt: 'desc' } });
    return users.map((user) => this.toPublicUser(user));
  }

  async findById(id: string) {
    const user = await this.prisma.user.findUnique({ where: { id }, select: publicUserSelect });
    if (!user) throw new NotFoundException('Usuario no encontrado');
    return this.toPublicUser(user);
  }

  async updateStatus(id: string, status: UserStatus) {
    try {
      const user = await this.prisma.user.update({ where: { id }, data: { status }, select: publicUserSelect });
      return this.toPublicUser(user);
    } catch (error) {
      if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2025') {
        throw new NotFoundException('Usuario no encontrado');
      }
      throw error;
    }
  }

  private toPublicUser(user: Prisma.UserGetPayload<{ select: typeof publicUserSelect }>) {
    return {
      id: user.id,
      fullName: [user.first_name, user.last_name].filter(Boolean).join(' '),
      nationalId: user.identification,
      email: user.email,
      role: user.role,
      status: user.status,
      createdAt: user.createdAt,
    };
  }
}
