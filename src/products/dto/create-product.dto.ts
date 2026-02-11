import { IsNumber, IsString, IsUUID, MaxLength, Min, MinLength } from 'class-validator';

export class CreateProductDto {
  @IsString()
  @MinLength(1)
  @MaxLength(200)
  name: string;

  @IsUUID()
  recipeId: string;

  @IsNumber()
  @Min(0)
  price: number;
}
