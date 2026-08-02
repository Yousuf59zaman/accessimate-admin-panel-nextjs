import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

export const normalizeWidgetOrigin = (origin: string) => {
  try {
    return new URL(origin).origin;
  } catch {
    return origin.replace(/\/$/, '');
  }
};

@Injectable()
export class WidgetValidationService {
  constructor(private readonly prisma: PrismaService) {}

  async validate(apiKey: string, origin: string) {
    const account = await this.prisma.account.findUnique({
      where: { apiKey },
      include: {
        widgetOrigins: true,
        websites: { select: { url: true } },
      },
    });
    const normalizedOrigin = normalizeWidgetOrigin(origin);
    const configuredOrigins = [
      ...(account?.widgetOrigins.map(({ origin: allowedOrigin }) => allowedOrigin) ?? []),
      ...(account?.websites.map(({ url }) => url) ?? []),
    ];
    const isAllowed = configuredOrigins.some(
      (allowedOrigin) =>
        allowedOrigin === '*' ||
        normalizeWidgetOrigin(allowedOrigin) === normalizedOrigin,
    );

    if (!account || !account.isActive || !account.apiKey || !isAllowed) {
      return {
        status: false,
        message: 'Token invalid / Origin not allowed',
      };
    }

    return {
      status: true,
      data: {
        account_id: account.id,
        account_name: `${account.firstName} ${account.lastName}`.trim(),
        origin: normalizedOrigin,
      },
    };
  }
}
