import { IsEmail, IsString, Length, Matches } from 'class-validator';

export class RegisterDto {
  @IsString()
  @Length(3, 120)
  fullName!: string;

  @IsString()
  @Length(3, 30)
  nationalId!: string;

  @IsEmail()
  @Length(5, 160)
  email!: string;

  @IsString()
  @Length(6, 72)
  @Matches(/^(?=.*[A-Za-z])(?=.*\d).+$/, { message: 'La contraseña debe contener letras y números' })
  password!: string;
}
