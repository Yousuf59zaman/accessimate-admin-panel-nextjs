import { Module } from '@nestjs/common';
import { WidgetCacheService } from './widget-cache.service';
import {
  WidgetCacheController,
  WidgetCustomerController,
} from './widget.controller';
import { WidgetValidationService } from './widget-validation.service';

@Module({
  controllers: [WidgetCacheController, WidgetCustomerController],
  providers: [WidgetCacheService, WidgetValidationService],
})
export class WidgetModule {}
