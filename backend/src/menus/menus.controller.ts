import {
  Body,
  Controller,
  Get,
  Param,
  ParseIntPipe,
  Post,
  Put,
} from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import type { AuthenticatedUser } from '../common/interfaces/authenticated-request';
import { MenuInput, MenusService } from './menus.service';

@ApiTags('Admin menu')
@ApiBearerAuth()
@Controller('admin/tree-entity')
export class MenusController {
  constructor(private readonly menus: MenusService) {}

  @Post('main-menu')
  async mainMenu() {
    return { status: true, data: await this.menus.navigation() };
  }

  @Get('build-menu')
  async buildMenu() {
    return { status: true, data: { data: await this.menus.build(false) } };
  }

  @Post()
  create(
    @Body() body: MenuInput,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return this.menus.create(body, user);
  }

  @Put(':id')
  update(
    @Param('id', ParseIntPipe) id: number,
    @Body() body: MenuInput,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return this.menus.update(id, body, user);
  }

  @Post('update-menu')
  reorder(
    @Body() body: MenuInput[],
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return this.menus.reorder(body, user);
  }

  @Post('delete-menu')
  setStatus(
    @Body() body: { id?: number; status?: number | boolean },
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return this.menus.setStatus(Number(body.id), body.status ?? 0, user);
  }
}
