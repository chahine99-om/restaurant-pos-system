import { Type } from 'class-transformer';
import { IsArray, IsNumber, IsString, IsUUID, Min, ValidateNested } from 'class-validator';

export class RecipeIngredientDto {
  @IsUUID()
  ingredientId: string;

  @IsNumber()
  @Min(0.0001)
  quantityGrams: number;
}

export class CreateRecipeDto {
  @IsString()
  name: string;

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => RecipeIngredientDto)
  ingredients: RecipeIngredientDto[];
}
