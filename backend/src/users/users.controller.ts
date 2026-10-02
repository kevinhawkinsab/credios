import { Body, Controller, Get, Param, Patch } from '@nestjs/common';
import { USER_ROLE } from '../common/constants/user.constants.js';
import { Roles } from '../common/decorators/roles.decorator.js';
import { UpdateUserStatusDto } from './dto/update-user-status.dto.js';
import { UsersService } from './users.service.js';

@Controller('users')
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Get()
  @Roles(USER_ROLE.ADMIN)
  list() {
    return this.usersService.list();
  }

  @Get(':id')
  @Roles(USER_ROLE.ADMIN)
  findById(@Param('id') id: string) {
    return this.usersService.findById(id);
  }

  @Patch(':id/status')
  @Roles(USER_ROLE.ADMIN)
  updateStatus(@Param('id') id: string, @Body() dto: UpdateUserStatusDto) {
    return this.usersService.updateStatus(id, dto.status);
  }
}
