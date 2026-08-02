import {
  Body,
  Controller,
  Delete,
  Post,
  Res,
  VERSION_NEUTRAL,
  Version,
} from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import type { Response } from 'express';
import { Public } from '../common/decorators/public.decorator';
import {
  StoreWidgetCacheDto,
  UpdateWidgetAdjustmentsDto,
  ValidateWidgetDto,
  WidgetOriginDto,
} from './dto/widget.dto';
import { WidgetCacheService } from './widget-cache.service';
import { WidgetValidationService } from './widget-validation.service';

@ApiTags('Original Accessimate widget')
@Public()
@Controller('cache')
export class WidgetCacheController {
  constructor(private readonly cache: WidgetCacheService) {}

  @Post('store')
  @Version(VERSION_NEUTRAL)
  store(
    @Body() body: StoreWidgetCacheDto,
    @Res({ passthrough: true }) response: Response,
  ) {
    if (!body.origin || !body.apiKey) {
      response.status(400);
      return {
        success: false,
        message: 'Origin and API key are required',
      };
    }
    return this.cache.store(
      body.origin,
      body.apiKey,
      body.validationStatus,
      body.adjustments,
    );
  }

  @Post('retrieve')
  @Version(VERSION_NEUTRAL)
  retrieve(
    @Body() body: WidgetOriginDto,
    @Res({ passthrough: true }) response: Response,
  ) {
    if (!body.origin) return this.missingOrigin(response);
    return this.cache.retrieve(body.origin);
  }

  @Post('update-adjustments')
  @Version(VERSION_NEUTRAL)
  updateAdjustments(
    @Body() body: UpdateWidgetAdjustmentsDto,
    @Res({ passthrough: true }) response: Response,
  ) {
    if (!body.origin) return this.missingOrigin(response);
    return this.cache.updateAdjustments(body.origin, body.adjustments);
  }

  @Delete('clear')
  @Version(VERSION_NEUTRAL)
  clear(
    @Body() body: WidgetOriginDto,
    @Res({ passthrough: true }) response: Response,
  ) {
    if (!body.origin) return this.missingOrigin(response);
    return this.cache.clear(body.origin);
  }

  private missingOrigin(response: Response) {
    response.status(400);
    return { success: false, message: 'Origin is required' };
  }
}

@ApiTags('Original Accessimate widget')
@Public()
@Controller('customer')
export class WidgetCustomerController {
  constructor(private readonly validation: WidgetValidationService) {}

  @Post('validete')
  @Version(VERSION_NEUTRAL)
  validate(
    @Body() body: ValidateWidgetDto,
    @Res({ passthrough: true }) response: Response,
  ) {
    if (!body.api_key || !body.origin) {
      response.status(400);
      return {
        status: false,
        message: 'API key and origin are required',
      };
    }
    return this.validation.validate(body.api_key, body.origin);
  }
}
