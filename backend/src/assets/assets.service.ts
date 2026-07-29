import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '../prisma/prisma.service';

const MAX_FILE_SIZE = 1_048_576;
const ALLOWED_MIME_TYPES = new Set([
  'image/jpeg',
  'image/png',
  'image/webp',
  'image/gif',
  'application/pdf',
]);

const extensions: Record<string, string> = {
  'image/jpeg': 'jpg',
  'image/png': 'png',
  'image/webp': 'webp',
  'image/gif': 'gif',
  'application/pdf': 'pdf',
};

const hasExpectedSignature = (mimeType: string, bytes: Uint8Array) => {
  const prefix = Buffer.from(bytes.subarray(0, 12));
  if (mimeType === 'image/jpeg') {
    return prefix[0] === 0xff && prefix[1] === 0xd8 && prefix[2] === 0xff;
  }
  if (mimeType === 'image/png') {
    return prefix.subarray(0, 8).equals(
      Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]),
    );
  }
  if (mimeType === 'image/gif') {
    return prefix.subarray(0, 4).toString('ascii') === 'GIF8';
  }
  if (mimeType === 'image/webp') {
    return (
      prefix.subarray(0, 4).toString('ascii') === 'RIFF' &&
      prefix.subarray(8, 12).toString('ascii') === 'WEBP'
    );
  }
  if (mimeType === 'application/pdf') {
    return prefix.subarray(0, 4).toString('ascii') === '%PDF';
  }
  return false;
};

@Injectable()
export class AssetsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly config: ConfigService,
  ) {}

  async store(files: Express.Multer.File[] = []) {
    const result: Record<string, string | string[]> = {};
    for (const file of files) {
      const publicUrl = await this.persist(
        file.fieldname,
        file.originalname,
        file.mimetype,
        Uint8Array.from(file.buffer),
      );
      const existing = result[file.fieldname];
      if (!existing) result[file.fieldname] = publicUrl;
      else if (Array.isArray(existing)) existing.push(publicUrl);
      else result[file.fieldname] = [existing, publicUrl];
    }
    return result;
  }

  async storeDataUrls(input: Record<string, unknown>) {
    const result: Record<string, string> = {};
    for (const [fieldName, value] of Object.entries(input)) {
      if (typeof value !== 'string' || !value.startsWith('data:')) continue;
      const match = /^data:([^;,]+);base64,([a-zA-Z0-9+/=\r\n]+)$/.exec(value);
      if (!match) {
        throw new BadRequestException(`${fieldName} has an invalid data URL.`);
      }
      const [, mimeType, encoded] = match;
      const normalized = encoded.replace(/\s/g, '');
      const bytes = Uint8Array.from(Buffer.from(normalized, 'base64'));
      const roundTrip = Buffer.from(bytes).toString('base64').replace(/=+$/, '');
      if (roundTrip !== normalized.replace(/=+$/, '')) {
        throw new BadRequestException(`${fieldName} has invalid Base64 data.`);
      }
      result[fieldName] = await this.persist(
        fieldName,
        `${fieldName}.${extensions[mimeType] ?? 'bin'}`,
        mimeType,
        bytes,
      );
    }
    return result;
  }

  async find(id: string) {
    const asset = await this.prisma.asset.findUnique({ where: { id } });
    if (!asset) throw new NotFoundException('Asset not found.');
    return asset;
  }

  private async persist(
    fieldName: string,
    originalName: string,
    mimeType: string,
    bytes: Uint8Array,
  ) {
    if (!ALLOWED_MIME_TYPES.has(mimeType)) {
      throw new BadRequestException(
        `${originalName} has an unsupported file type.`,
      );
    }
    if (!bytes.length) {
      throw new BadRequestException(`${originalName} is empty.`);
    }
    if (bytes.length > MAX_FILE_SIZE) {
      throw new BadRequestException(
        `${originalName} exceeds the 1 MB upload limit.`,
      );
    }
    if (!hasExpectedSignature(mimeType, bytes)) {
      throw new BadRequestException(
        `${originalName} does not match its declared file type.`,
      );
    }

    const asset = await this.prisma.asset.create({
      data: {
        fieldName,
        originalName,
        mimeType,
        size: bytes.length,
        bytes: Uint8Array.from(bytes),
      },
    });
    return `${this.config
      .get<string>('PUBLIC_API_URL', 'http://localhost:4000')
      .replace(/\/+$/, '')}/api/v1/assets/${asset.id}`;
  }
}
