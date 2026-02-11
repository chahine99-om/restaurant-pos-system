import { IsString, MaxLength, MinLength } from 'class-validator';

export class CreateIngredientDto {
  @IsString()
  @MinLength(1)
  @MaxLength(200)
  name: string;

  @IsString()
  @MinLength(1)
  @MaxLength(20)
  unit: string;
}
