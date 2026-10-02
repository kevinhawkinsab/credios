import { Type } from 'class-transformer';
import {
  IsInt,
  IsNumber,
  IsOptional,
  Max,
  Min,
} from 'class-validator';

export class UpdateCreditRequestDto {
  @IsOptional()
  @Type(() => Number)
  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(500)
  @Max(50000)
  amount?: number;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(6)
  @Max(60)
  termMonths?: number;
}
