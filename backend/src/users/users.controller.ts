import { Body, Controller, Get, Param, Patch } from '@nestjs/common';
import { Role } from '@prisma/client';
import { Roles } from '../common/decorators/roles.decorator.js';
import { UpdateUserStatusDto } from './dto/update-user-status.dto.js';
import { UsersService } from './users.service.js';

@Controller('users')
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Get()
  @Roles(Role.ADMIN, Role.ANALYST)
  list() {
    return this.usersService.list();
  }

  @Get(':id')
  @Roles(Role.ADMIN, Role.ANALYST)
  findById(@Param('id') id: string) {
    return this.usersService.findById(id);
  }

  @Patch(':id/status')
  @Roles(Role.ADMIN)
  updateStatus(@Param('id') id: string, @Body() dto: UpdateUserStatusDto) {
    return this.usersService.updateStatus(id, dto.isActive);
  }
}
