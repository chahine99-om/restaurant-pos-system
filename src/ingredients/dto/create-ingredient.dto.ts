import { IsString, MaxLength, MinLength } from 'class-validator';
import { Trim } from '../../common/transformers/trim.transformer';

export class CreateIngredientDto {
  @Trim()
  @IsString()
  @MinLength(1)
  @MaxLength(200)
  name: string;

  @Trim()
  @IsString()
  @MinLength(1)
  @MaxLength(20)
  unit: string;
}
