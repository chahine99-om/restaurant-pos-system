import { IsNumber, IsOptional, IsString, IsUUID } from 'class-validator';

export class AdjustStockDto {
  @IsUUID()
  ingredientId: string;

  /** Positive = add, negative = deduct (e.g. waste/loss). */
  @IsNumber()
  quantityGrams: number;

  @IsOptional()
  @IsString()
  note?: string;
}
