import { IsEmail, IsString, MinLength, MaxLength } from 'class-validator';
import { Trim } from '../../common/transformers/trim.transformer';

export class LoginDto {
  @Trim()
  @IsEmail()
  @MaxLength(255)
  email: string;

  @IsString()
  @MinLength(8, { message: 'Password must be at least 8 characters' })
  @MaxLength(100)
  password: string;
}
