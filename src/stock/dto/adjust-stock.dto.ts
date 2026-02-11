import { IsNumber, IsOptional, IsString, IsUUID, MaxLength } from 'class-validator';
import { Trim } from '../../common/transformers/trim.transformer';

export class AdjustStockDto {
  @IsUUID()
  ingredientId: string;

  /** Positive = add, negative = deduct (e.g. waste/loss). */
  @IsNumber()
  quantityGrams: number;

  @IsOptional()
  @Trim()
  @IsString()
  @MaxLength(500)
  note?: string;
}
