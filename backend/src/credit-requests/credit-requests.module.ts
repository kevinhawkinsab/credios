import { Module } from '@nestjs/common';
import { CreditRequestsController } from './credit-requests.controller.js';
import { CreditRequestsService } from './credit-requests.service.js';

@Module({
  controllers: [CreditRequestsController],
  providers: [CreditRequestsService],
})
export class CreditRequestsModule {}
