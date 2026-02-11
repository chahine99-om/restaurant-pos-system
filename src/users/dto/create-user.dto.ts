import { IsEmail, IsEnum, IsString, MinLength } from 'class-validator';
import { RoleName } from '@prisma/client';

export class CreateUserDto {
  @IsEmail()
  email: string;

  @IsString()
  @MinLength(8, { message: 'Password must be at least 8 characters' })
  password: string;

  @IsString()
  fullName: string;

  @IsEnum(RoleName)
  role: RoleName;
}
