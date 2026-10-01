import { IsString, Length } from 'class-validator';

export class RefreshTokenDto {
  @IsString()
  @Length(20)
  refreshToken!: string;
}
