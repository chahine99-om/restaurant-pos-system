import { IsEnum } from 'class-validator';
import { PaymentMethod } from '@prisma/client';

export class ConfirmOrderDto {
  @IsEnum(PaymentMethod)
  paymentMethod: PaymentMethod;
}
