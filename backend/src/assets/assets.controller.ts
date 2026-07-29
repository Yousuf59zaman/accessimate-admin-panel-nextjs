import { Controller, Get, Header, Param, Res } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import type { Response } from 'express';
import { Public } from '../common/decorators/public.decorator';
import { AssetsService } from './assets.service';

@ApiTags('Assets')
@Controller('assets')
export class AssetsController {
  constructor(private readonly assets: AssetsService) {}

  @Public()
  @Get(':id')
  @Header('Cache-Control', 'public, max-age=86400, immutable')
  async get(@Param('id') id: string, @Res() response: Response) {
    const asset = await this.assets.find(id);
    response.type(asset.mimeType);
    response.setHeader('Content-Length', asset.size.toString());
    response.send(Buffer.from(asset.bytes));
  }
}
