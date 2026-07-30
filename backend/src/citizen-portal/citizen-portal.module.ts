import { Module } from "@nestjs/common";
import { AssetsModule } from "../assets/assets.module";
import { AccessibilityScannerService } from "./accessibility-scanner.service";
import { CitizenPortalController } from "./citizen-portal.controller";
import { CitizenPortalService } from "./citizen-portal.service";
import { PublicWidgetController } from "./public-widget.controller";

@Module({
  imports: [AssetsModule],
  controllers: [CitizenPortalController, PublicWidgetController],
  providers: [AccessibilityScannerService, CitizenPortalService],
})
export class CitizenPortalModule {}
