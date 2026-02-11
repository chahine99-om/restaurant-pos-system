import { IsString, MaxLength, MinLength } from 'class-validator';
import { IsOptional } from 'class-validator';

export class UpdateIngredientDto {
  @IsOptional()
  @IsString()
  @MinLength(1)
  @MaxLength(200)
  name?: string;

  @IsOptional()
  @IsString()
  @MinLength(1)
  @MaxLength(20)
  unit?: string;
}
