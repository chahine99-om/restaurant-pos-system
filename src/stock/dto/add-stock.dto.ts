import { IsNumber, IsOptional, IsString, IsUUID, Min } from 'class-validator';

export class AddStockDto {
  @IsUUID()
  ingredientId: string;

  @IsNumber()
  @Min(0.0001)
  quantityGrams: number;

  @IsOptional()
  @IsString()
  note?: string;
}
