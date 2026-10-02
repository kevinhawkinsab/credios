import {
  IsIn,
  IsOptional,
  IsString,
  MaxLength,
} from 'class-validator';
import { REQUEST_STATUS } from '../../common/constants/request.constants.js';
import type { RequestStatus } from '../../common/constants/request.constants.js';

export class UpdateCreditRequestStatusDto {
  @IsString()
  @IsIn(Object.values(REQUEST_STATUS))
  status!: RequestStatus;

  @IsOptional()
  @IsString()
  @MaxLength(1000)
  decisionComment?: string;
}
