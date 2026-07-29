import { ApiProperty } from '@nestjs/swagger';
import { IsString, MinLength } from 'class-validator';

export class SsoLoginDto {
  @ApiProperty({ description: 'Firebase provider ID token' })
  @IsString()
  @MinLength(20)
  idToken: string;
}
