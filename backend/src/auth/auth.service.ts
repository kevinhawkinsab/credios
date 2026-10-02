import { ConflictException, Injectable, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { User } from '@prisma/client';
import * as bcrypt from 'bcrypt';
import { randomBytes } from 'node:crypto';
import { USER_ROLE, USER_STATUS } from '../common/constants/user.constants.js';
import { PrismaService } from '../prisma/prisma.service.js';
import { LoginDto } from './dto/login.dto.js';
import { RefreshTokenDto } from './dto/refresh-token.dto.js';
import { RegisterDto } from './dto/register.dto.js';
import type { AuthenticatedUser } from './interfaces/authenticated-user.interface.js';

@Injectable()
export class AuthService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly jwt: JwtService,
    private readonly config: ConfigService,
  ) {}

  async register(dto: RegisterDto) {
    const email = dto.email.trim().toLowerCase();
    const nationalId = dto.nationalId.trim();
    const existing = await this.prisma.user.findFirst({ where: { OR: [{ email }, { identification: nationalId }] }, select: { id: true } });
    if (existing) throw new ConflictException('El correo o la cédula ya están registrados');

    const user = await this.prisma.user.create({
      data: {
        first_name: dto.fullName.trim().split(/\s+/)[0],
        last_name: dto.fullName.trim().split(/\s+/).slice(1).join(' ') || null,
        identification: nationalId,
        email,
        passwordHash: await bcrypt.hash(dto.password, 12),
        role: USER_ROLE.USER,
        status: USER_STATUS.ACTIVE,
      },
    });

    return this.issueTokens(user);
  }

  async login(dto: LoginDto) {
    const user = await this.prisma.user.findFirst({ where: { email: dto.email.trim().toLowerCase() } });
    if (!user || user.status !== USER_STATUS.ACTIVE || !(await bcrypt.compare(dto.password, user.passwordHash))) {
      throw new UnauthorizedException('Correo o contraseña incorrectos');
    }

    return this.issueTokens(user);
  }

  async refresh(dto: RefreshTokenDto) {
    const parsed = this.parseRefreshToken(dto.refreshToken);
    if (!parsed) throw new UnauthorizedException('El refresh token no es válido');
    const stored = await this.prisma.refreshToken.findUnique({ where: { id: parsed.id }, include: { user: true } });
    if (!stored || stored.revokedAt || stored.expiresAt <= new Date() || stored.user.status !== USER_STATUS.ACTIVE) {
      throw new UnauthorizedException('El refresh token no es válido o ha expirado');
    }
    if (!(await bcrypt.compare(parsed.secret, stored.tokenHash))) {
      throw new UnauthorizedException('El refresh token no es válido');
    }

    await this.prisma.refreshToken.update({ where: { id: stored.id }, data: { revokedAt: new Date() } });
    return this.issueTokens(stored.user);
  }

  async logout(dto: RefreshTokenDto): Promise<{ message: string }> {
    const parsed = this.parseRefreshToken(dto.refreshToken, false);
    if (parsed) {
      const stored = await this.prisma.refreshToken.findUnique({ where: { id: parsed.id } });
      if (stored && !stored.revokedAt && await bcrypt.compare(parsed.secret, stored.tokenHash)) {
        await this.prisma.refreshToken.update({ where: { id: stored.id }, data: { revokedAt: new Date() } });
      }
    }
    return { message: 'Sesión cerrada correctamente' };
  }

  async getProfile(userId: string) {
    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    if (!user || user.status !== USER_STATUS.ACTIVE) throw new UnauthorizedException('El usuario ya no está disponible');
    return this.toPublicUser(user);
  }

  private async issueTokens(user: User) {
    const payload: AuthenticatedUser = { sub: user.id, email: user.email, role: user.role as AuthenticatedUser['role'] };
    const accessToken = await this.jwt.signAsync(payload, {
      secret: this.config.getOrThrow<string>('JWT_ACCESS_SECRET'),
      expiresIn: this.config.get<string>('JWT_ACCESS_EXPIRES_IN', '15m') as never,
    });
    const secret = randomBytes(48).toString('hex');
    const expiresAt = this.expiryDate(this.config.get<string>('JWT_REFRESH_EXPIRES_IN', '7d'));
    const stored = await this.prisma.refreshToken.create({
      data: { userId: user.id, tokenHash: await bcrypt.hash(secret, 12), expiresAt },
    });

    return { accessToken, refreshToken: `${stored.id}.${secret}`, expiresAt, user: this.toPublicUser(user) };
  }

  private parseRefreshToken(value: string, throwOnInvalid = true): { id: string; secret: string } | null {
    const separator = value.indexOf('.');
    if (separator <= 0 || separator === value.length - 1) {
      if (throwOnInvalid) throw new UnauthorizedException('El refresh token no es válido');
      return null;
    }
    return { id: value.slice(0, separator), secret: value.slice(separator + 1) };
  }

  private expiryDate(value: string): Date {
    const match = value.match(/^(\d+)([smhd])$/);
    if (!match) return new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
    const multipliers = { s: 1000, m: 60000, h: 3600000, d: 86400000 };
    return new Date(Date.now() + Number(match[1]) * multipliers[match[2] as keyof typeof multipliers]);
  }

  private toPublicUser(user: User) {
    return {
      id: user.id,
      fullName: [user.first_name, user.last_name].filter(Boolean).join(' '),
      nationalId: user.identification,
      email: user.email,
      role: user.role,
      status: user.status,
    };
  }
}
