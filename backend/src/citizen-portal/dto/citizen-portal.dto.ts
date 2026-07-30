import { Type } from "class-transformer";
import {
  IsArray,
  IsBoolean,
  IsEmail,
  IsIn,
  IsInt,
  IsOptional,
  IsString,
  IsUrl,
  Matches,
  Max,
  MaxLength,
  Min,
  MinLength,
  ValidateNested,
} from "class-validator";

export class CreateWebsiteDto {
  @IsString()
  @MinLength(2)
  @MaxLength(100)
  name: string;

  @IsUrl({ protocols: ["http", "https"], require_protocol: true })
  @MaxLength(500)
  url: string;
}

export class UpdateWebsiteDto extends CreateWebsiteDto {}

export class ScanOptionsDto {
  @IsOptional()
  @IsBoolean()
  follow_redirects?: boolean;

  @IsOptional()
  @IsBoolean()
  check_subdomains?: boolean;

  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(5)
  concurrent_requests?: number;

  @IsOptional()
  @IsInt()
  @Min(0)
  @Max(2_000)
  request_delay?: number;

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  @MaxLength(300, { each: true })
  include_paths?: string[];

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  @MaxLength(300, { each: true })
  exclude_paths?: string[];
}

export class CreateScanDto {
  @Type(() => Number)
  @IsInt()
  @Min(1)
  website_id: number;

  @IsOptional()
  @IsUrl({ protocols: ["http", "https"], require_protocol: true })
  @MaxLength(500)
  url?: string;

  @IsOptional()
  @IsBoolean()
  scan_entire_site?: boolean;

  @IsOptional()
  @IsIn(["2.0", "2.1", "2.2", "3.0"])
  wcag_version?: string;

  @IsOptional()
  @IsIn(["A", "AA", "AAA"])
  compliance_level?: string;

  @IsOptional()
  @IsArray()
  @IsIn(["wcag", "ada"], { each: true })
  standards?: string[];

  @IsOptional()
  @ValidateNested()
  @Type(() => ScanOptionsDto)
  options?: ScanOptionsDto;
}

export class SitemapDto {
  @IsUrl({ protocols: ["http", "https"], require_protocol: true })
  @MaxLength(500)
  sitemap_url: string;
}

export class AccessibilityQueryDto {
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  website_id?: number;
}

export class UpdateAccountDto {
  @IsString()
  @MinLength(1)
  @MaxLength(80)
  first_name: string;

  @IsOptional()
  @IsString()
  @MaxLength(80)
  middle_name?: string;

  @IsString()
  @MinLength(1)
  @MaxLength(80)
  last_name: string;

  @IsEmail()
  email: string;

  @IsString()
  @Matches(/^\d{1,4}$/)
  ccode: string;

  @IsOptional()
  @IsString()
  @MaxLength(30)
  mobile?: string;

  @IsOptional()
  @IsString()
  @MaxLength(1_500_000)
  photo?: string;
}

export class UpdatePasswordDto {
  @IsString()
  @MinLength(8)
  @MaxLength(128)
  old_password: string;

  @IsString()
  @MinLength(10)
  @MaxLength(128)
  password: string;

  @IsString()
  @MinLength(10)
  @MaxLength(128)
  password_confirmation: string;
}

export class CreateSupportRequestDto {
  @IsIn(["support", "onboarding", "pdf-remediation"])
  kind: string;

  @IsString()
  @MinLength(3)
  @MaxLength(120)
  subject: string;

  @IsString()
  @MinLength(10)
  @MaxLength(2_000)
  message: string;

  @IsOptional()
  @IsString()
  @MaxLength(40)
  preferred_at?: string;
}
