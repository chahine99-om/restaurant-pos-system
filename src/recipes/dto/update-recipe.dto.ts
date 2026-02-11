import { Type } from 'class-transformer';
import { IsArray, IsNumber, IsOptional, IsString, IsUUID, Min, ValidateNested } from 'class-validator';

export class RecipeIngredientDto {
  @IsUUID()
  ingredientId: string;

  @IsNumber()
  @Min(0.0001)
  quantityGrams: number;
}

export class UpdateRecipeDto {
  @IsOptional()
  @IsString()
  name?: string;

  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => RecipeIngredientDto)
  ingredients?: RecipeIngredientDto[];
}
