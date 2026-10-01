import { Injectable, NotFoundException } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service.js';

const publicUserSelect = {
  id: true,
  fullName: true,
  nationalId: true,
  email: true,
  role: true,
  isActive: true,
  createdAt: true,
} as const;

@Injectable()
export class UsersService {
  constructor(private readonly prisma: PrismaService) {}

  list() {
    return this.prisma.user.findMany({ select: publicUserSelect, orderBy: { createdAt: 'desc' } });
  }

  async findById(id: string) {
    const user = await this.prisma.user.findUnique({ where: { id }, select: publicUserSelect });
    if (!user) throw new NotFoundException('Usuario no encontrado');
    return user;
  }

  async updateStatus(id: string, isActive: boolean) {
    try {
      return await this.prisma.user.update({ where: { id }, data: { isActive }, select: publicUserSelect });
    } catch (error) {
      if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2025') {
        throw new NotFoundException('Usuario no encontrado');
      }
      throw error;
    }
  }
}
