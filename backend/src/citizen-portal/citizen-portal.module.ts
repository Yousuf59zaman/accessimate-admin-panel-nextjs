import { Module } from "@nestjs/common";
import { AssetsModule } from "../assets/assets.module";
import { AccessibilityScannerService } from "./accessibility-scanner.service";
import { CitizenPortalController } from "./citizen-portal.controller";
import { CitizenPortalService } from "./citizen-portal.service";

@Module({
  imports: [AssetsModule],
  controllers: [CitizenPortalController],
  providers: [AccessibilityScannerService, CitizenPortalService],
})
export class CitizenPortalModule {}
