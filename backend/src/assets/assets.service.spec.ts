import { BadRequestException } from '@nestjs/common';
import type { ConfigService } from '@nestjs/config';
import type { PrismaService } from '../prisma/prisma.service';
import { AssetsService } from './assets.service';

const onePixelPng =
  'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNk+A8AAQUBAScY42YAAAAASUVORK5CYII=';

describe('AssetsService', () => {
  const prisma = {
    asset: {
      create: jest.fn(),
      findUnique: jest.fn(),
    },
  };
  const config = { get: jest.fn() };
  const service = new AssetsService(
    prisma as unknown as PrismaService,
    config as unknown as ConfigService,
  );

  beforeEach(() => {
    jest.resetAllMocks();
    prisma.asset.create.mockResolvedValue({ id: 'asset-1' });
    config.get.mockReturnValue('https://api.example.test');
  });

  it('converts valid legacy Base64 image previews into stored asset URLs', async () => {
    await expect(
      service.storeDataUrls({ photo: `data:image/png;base64,${onePixelPng}` }),
    ).resolves.toEqual({
      photo: 'https://api.example.test/api/v1/assets/asset-1',
    });
    expect(prisma.asset.create).toHaveBeenCalledWith({
      data: expect.objectContaining({
        fieldName: 'photo',
        mimeType: 'image/png',
        size: expect.any(Number),
      }),
    });
  });

  it('rejects spoofed MIME types and unsafe SVG data URLs', async () => {
    await expect(
      service.storeDataUrls({
        photo: `data:image/jpeg;base64,${onePixelPng}`,
      }),
    ).rejects.toBeInstanceOf(BadRequestException);
    await expect(
      service.storeDataUrls({
        photo: `data:image/svg+xml;base64,${Buffer.from('<svg/>').toString('base64')}`,
      }),
    ).rejects.toBeInstanceOf(BadRequestException);
  });
});
