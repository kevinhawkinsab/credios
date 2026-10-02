import { IsIn, IsString } from 'class-validator';
import { USER_STATUS } from '../../common/constants/user.constants.js';
import type { UserStatus } from '../../common/constants/user.constants.js';

export class UpdateUserStatusDto {
  @IsString()
  @IsIn(Object.values(USER_STATUS))
  status!: UserStatus;
}
