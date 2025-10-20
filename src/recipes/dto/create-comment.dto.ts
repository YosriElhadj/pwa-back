import { IsNotEmpty, IsString, MinLength, MaxLength } from 'class-validator';

export class CreateCommentDto {
  @IsNotEmpty()
  @IsString()
  @MinLength(1)
  @MaxLength(500)
  text: string;
}