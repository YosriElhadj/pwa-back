import { IsArray, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';
import { CreatePantryDto } from './create-pantry.dto';

export class AddIngredientsDto {
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CreatePantryDto)
  ingredients: CreatePantryDto[];
}