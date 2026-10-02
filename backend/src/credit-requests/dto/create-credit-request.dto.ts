import { Type } from 'class-transformer';
import {
  IsInt,
  IsNumber,
  IsOptional,
  IsUUID,
  Max,
  Min,
} from 'class-validator';

export class CreateCreditRequestDto {
  @Type(() => Number)
  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(500)
  @Max(50000)
  amount!: number;

  @Type(() => Number)
  @IsInt()
  @Min(6)
  @Max(60)
  termMonths!: number;

  @IsOptional()
  @IsUUID()
  applicantId?: string;
}
