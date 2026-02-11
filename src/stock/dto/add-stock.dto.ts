import { IsNumber, IsOptional, IsString, IsUUID, MaxLength, Min } from 'class-validator';
import { Trim } from '../../common/transformers/trim.transformer';

export class AddStockDto {
  @IsUUID()
  ingredientId: string;

  @IsNumber()
  @Min(0.0001)
  quantityGrams: number;

  @IsOptional()
  @Trim()
  @IsString()
  @MaxLength(500)
  note?: string;
}
