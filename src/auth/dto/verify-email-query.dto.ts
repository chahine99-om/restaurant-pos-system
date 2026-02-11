import { IsHexadecimal, IsString, Length } from 'class-validator';

/** Query param for GET /auth/verify-email. Token is 32-byte hex = 64 chars. */
export class VerifyEmailQueryDto {
  @IsString()
  @IsHexadecimal()
  @Length(64, 64, { message: 'Invalid token format' })
  token: string;
}
