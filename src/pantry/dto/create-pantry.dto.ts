import { IsString, IsOptional, IsDate } from 'class-validator';
import { Type } from 'class-transformer';

export class CreatePantryDto {
  @IsString()
  name: string;

  @IsOptional()
  @IsString()
  quantity?: string;

  @IsOptional()
  @IsString()
  unit?: string;

  @IsOptional()
  @IsString()
  category?: string;

  @IsOptional()
  @Type(() => Date)
  @IsDate()
  expiryDate?: Date;

  @IsOptional()
  @IsString()
  imageUrl?: string;
}