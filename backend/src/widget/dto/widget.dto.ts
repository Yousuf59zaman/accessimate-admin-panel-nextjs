import { IsObject, IsOptional, IsString, MaxLength } from 'class-validator';

export class StoreWidgetCacheDto {
  @IsOptional()
  @IsString()
  @MaxLength(2048)
  origin?: string;

  @IsOptional()
  @IsString()
  @MaxLength(256)
  apiKey?: string;

  @IsOptional()
  @IsString()
  @MaxLength(64)
  validationStatus?: string;

  @IsOptional()
  @IsObject()
  adjustments?: Record<string, unknown>;
}

export class WidgetOriginDto {
  @IsOptional()
  @IsString()
  @MaxLength(2048)
  origin?: string;
}

export class UpdateWidgetAdjustmentsDto extends WidgetOriginDto {
  @IsOptional()
  @IsObject()
  adjustments?: Record<string, unknown>;
}

export class ValidateWidgetDto {
  @IsOptional()
  @IsString()
  @MaxLength(256)
  api_key?: string;

  @IsOptional()
  @IsString()
  @MaxLength(2048)
  origin?: string;
}
