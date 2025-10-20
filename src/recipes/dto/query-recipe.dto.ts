import { IsOptional, IsString, IsEnum, IsNumber, Min } from 'class-validator';
import { Type } from 'class-transformer'; // ADD THIS LINE

export enum RecipeSortBy {
  NEWEST = 'newest',
  POPULAR = 'popular',
  TRENDING = 'trending',
}

export class QueryRecipeDto {
  @IsOptional()
  @IsEnum(RecipeSortBy)
  sortBy?: RecipeSortBy = RecipeSortBy.NEWEST;

  @IsOptional()
  @IsString()
  category?: string;

  @IsOptional()
  @IsString()
  difficulty?: string;

  @IsOptional()
  @IsString()
  search?: string;

  @IsOptional()
  @IsString()
  tag?: string;

  @IsOptional()
  @Type(() => Number)  // ADD THIS LINE
  @IsNumber()
  @Min(1)
  page?: number = 1;

  @IsOptional()
  @Type(() => Number)  // ADD THIS LINE
  @IsNumber()
  @Min(1)
  limit?: number = 20;
}