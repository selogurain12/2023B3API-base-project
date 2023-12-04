import { IsString, IsEmail, IsOptional, IsEnum, MinLength, IsNumber } from 'class-validator';

export class CreateUserDto {
  @IsNumber()
  id: string;

  @IsString()
  @MinLength(3)
  username: string;

  @IsString()
  @MinLength(8)
  password: string;

  @IsString()
  @IsEmail()
  email: string;

  @IsOptional()
  @IsEnum(['Employee', 'Admin', 'ProjectManager'])
  role: 'Employee' | 'Admin' | 'ProjectManager';
}
