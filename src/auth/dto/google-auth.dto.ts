import { IsEmail, IsString, IsOptional } from 'class-validator';

export class GoogleAuthDto {
  @IsEmail()
  email: string;

  @IsString()
  name: string;

  @IsString()
  googleId: string;

  @IsOptional()
  @IsString()
  avatar?: string;
}