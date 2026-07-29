import { ApiProperty } from '@nestjs/swagger';
import { IsString, Length, MinLength } from 'class-validator';

export class LoginDto {
  @ApiProperty({ example: 'owner' })
  @IsString()
  @Length(2, 120)
  login_id: string;

  @ApiProperty({ example: 'a-secure-password' })
  @IsString()
  @MinLength(8)
  password: string;
}
