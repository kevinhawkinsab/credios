import { IsIn, IsOptional } from 'class-validator';
import { REQUEST_STATUS } from '../../common/constants/request.constants.js';
import type { RequestStatus } from '../../common/constants/request.constants.js';

export class ListCreditRequestsQueryDto {
  @IsOptional()
  @IsIn(Object.values(REQUEST_STATUS))
  status?: RequestStatus;
}
