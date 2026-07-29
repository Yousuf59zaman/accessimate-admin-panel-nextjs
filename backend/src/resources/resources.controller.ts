import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  ParseIntPipe,
  Post,
  Put,
  Query,
  Req,
  UploadedFiles,
  UseInterceptors,
} from '@nestjs/common';
import { AnyFilesInterceptor } from '@nestjs/platform-express';
import { ApiBearerAuth, ApiConsumes, ApiTags } from '@nestjs/swagger';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import type {
  AuthenticatedRequest,
  AuthenticatedUser,
} from '../common/interfaces/authenticated-request';
import { ListResourcesDto } from './dto/list-resources.dto';
import { ResourcesService } from './resources.service';

const uploadOptions = {
  limits: { fileSize: 1_048_576, files: 4, fields: 80 },
};

@ApiTags('Admin resources')
@ApiBearerAuth()
@Controller('admin/:resource')
export class ResourcesController {
  constructor(private readonly resources: ResourcesService) {}

  @Post('all')
  listPost(
    @Param('resource') resource: string,
    @Body() query: ListResourcesDto,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return this.resources.list(resource, query, user);
  }

  @Get()
  listGet(
    @Param('resource') resource: string,
    @Query() query: ListResourcesDto,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return this.resources.list(resource, query, user);
  }

  @Post()
  @ApiConsumes('application/json', 'multipart/form-data')
  @UseInterceptors(AnyFilesInterceptor(uploadOptions))
  create(
    @Param('resource') resource: string,
    @Body() body: Record<string, unknown>,
    @UploadedFiles() files: Express.Multer.File[] = [],
    @CurrentUser() user: AuthenticatedUser,
    @Req() request: AuthenticatedRequest,
  ) {
    return this.resources.create(
      resource,
      body,
      files,
      user,
      request.requestId,
    );
  }

  @Put(':id')
  @ApiConsumes('application/json', 'multipart/form-data')
  @UseInterceptors(AnyFilesInterceptor(uploadOptions))
  update(
    @Param('resource') resource: string,
    @Param('id', ParseIntPipe) id: number,
    @Body() body: Record<string, unknown>,
    @UploadedFiles() files: Express.Multer.File[] = [],
    @CurrentUser() user: AuthenticatedUser,
    @Req() request: AuthenticatedRequest,
  ) {
    return this.resources.update(
      resource,
      id,
      body,
      files,
      user,
      request.requestId,
    );
  }

  @Delete(':id')
  remove(
    @Param('resource') resource: string,
    @Param('id', ParseIntPipe) id: number,
    @CurrentUser() user: AuthenticatedUser,
    @Req() request: AuthenticatedRequest,
  ) {
    return this.resources.remove(resource, id, user, request.requestId);
  }

  @Post('restore/:id')
  restore(
    @Param('resource') resource: string,
    @Param('id', ParseIntPipe) id: number,
    @CurrentUser() user: AuthenticatedUser,
    @Req() request: AuthenticatedRequest,
  ) {
    return this.resources.restore(resource, id, user, request.requestId);
  }
}
