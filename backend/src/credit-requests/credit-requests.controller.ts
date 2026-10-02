import { Body, Controller, Get, Param, Patch, Post } from '@nestjs/common';
import { CurrentUser } from '../common/decorators/current-user.decorator.js';
import { Roles } from '../common/decorators/roles.decorator.js';
import { USER_ROLE } from '../common/constants/user.constants.js';
import type { AuthenticatedUser } from '../auth/interfaces/authenticated-user.interface.js';
import { CreditRequestsService } from './credit-requests.service.js';
import { CreateCreditRequestDto } from './dto/create-credit-request.dto.js';
import { DecisionDto } from './dto/decision.dto.js';
import { UpdateCreditRequestDto } from './dto/update-credit-request.dto.js';
import { UpdateCreditRequestStatusDto } from './dto/update-credit-request-status.dto.js';

@Controller('credit-requests')
export class CreditRequestsController {
  constructor(private readonly creditRequestsService: CreditRequestsService) {}

  @Post()
  create(@CurrentUser() user: AuthenticatedUser, @Body() dto: CreateCreditRequestDto) {
    return this.creditRequestsService.create(user, dto);
  }

  @Get()
  list(@CurrentUser() user: AuthenticatedUser) {
    return this.creditRequestsService.list(user);
  }

  @Get(':id')
  findById(@CurrentUser() user: AuthenticatedUser, @Param('id') id: string) {
    return this.creditRequestsService.findById(user, id);
  }

  @Patch(':id')
  update(@CurrentUser() user: AuthenticatedUser, @Param('id') id: string, @Body() dto: UpdateCreditRequestDto) {
    return this.creditRequestsService.update(user, id, dto);
  }

  @Patch(':id/status')
  @Roles(USER_ROLE.ADMIN)
  updateStatus(@CurrentUser() user: AuthenticatedUser, @Param('id') id: string, @Body() dto: UpdateCreditRequestStatusDto) {
    return this.creditRequestsService.updateStatus(user, id, dto.status, dto.decisionComment);
  }

  @Post(':id/approve')
  @Roles(USER_ROLE.ADMIN)
  approve(@CurrentUser() user: AuthenticatedUser, @Param('id') id: string, @Body() dto: DecisionDto) {
    return this.creditRequestsService.approve(user, id, dto);
  }

  @Post(':id/reject')
  @Roles(USER_ROLE.ADMIN)
  reject(@CurrentUser() user: AuthenticatedUser, @Param('id') id: string, @Body() dto: DecisionDto) {
    return this.creditRequestsService.reject(user, id, dto);
  }
}
