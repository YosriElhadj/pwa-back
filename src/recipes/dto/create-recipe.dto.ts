import { IsNotEmpty, IsString, IsNumber, IsArray, IsBoolean, IsOptional } from 'class-validator';

export class CreateRecipeDto {
  @IsNotEmpty()
  @IsString()
  title: string;

  @IsNotEmpty()
  @IsString()
  category: string;

  @IsNotEmpty()
  @IsString()
  difficulty: string;

  @IsNotEmpty()
  @IsNumber()
  prepTime: number;

  @IsNotEmpty()
  @IsArray()
  ingredients: { name: string; quantity: string }[];

  @IsNotEmpty()
  @IsArray()
  steps: string[];

  @IsOptional()
  @IsString()
  image?: string;

  @IsOptional()
  @IsBoolean()
  isFavorite?: boolean;
}