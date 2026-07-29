import {
  INestApplication,
  ValidationPipe,
  VersioningType,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { NestExpressApplication } from '@nestjs/platform-express';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import helmet from 'helmet';
import { AllExceptionsFilter } from './common/filters/all-exceptions.filter';

const isAllowedOrigin = (
  origin: string | undefined,
  configuredOrigins: Set<string>,
  allowVercelPreviews: boolean,
) => {
  if (!origin || configuredOrigins.has(origin)) return true;
  if (!allowVercelPreviews) return false;
  try {
    return new URL(origin).hostname.endsWith('.vercel.app');
  } catch {
    return false;
  }
};

export const configureApplication = (
  app: INestApplication & NestExpressApplication,
  options: { enableSwagger?: boolean } = {},
) => {
  const config = app.get(ConfigService);
  const origins = new Set(
    config
      .get<string>('FRONTEND_ORIGINS', 'http://localhost:3000')
      .split(',')
      .map((origin) => origin.trim())
      .filter(Boolean),
  );
  const allowVercelPreviews =
    config.get<string>('ALLOW_VERCEL_PREVIEWS', 'false') === 'true';

  app.useBodyParser('json', { limit: '6mb' });
  app.useBodyParser('urlencoded', { limit: '6mb', extended: true });
  app.use(helmet());
  app.enableCors({
    origin: (
      origin: string | undefined,
      callback: (error: Error | null, allow?: boolean) => void,
    ) => {
      const allowed = isAllowedOrigin(origin, origins, allowVercelPreviews);
      callback(allowed ? null : new Error('CORS origin is not allowed.'), allowed);
    },
    credentials: false,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['authorization', 'content-type', 'x-request-id'],
    exposedHeaders: ['x-request-id'],
    maxAge: 86_400,
  });
  app.setGlobalPrefix('api');
  app.enableVersioning({
    type: VersioningType.URI,
    defaultVersion: '1',
  });
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
      transformOptions: { enableImplicitConversion: false },
    }),
  );
  app.useGlobalFilters(new AllExceptionsFilter());

  if (options.enableSwagger !== false) {
    const swagger = new DocumentBuilder()
      .setTitle('Accessimate Admin Panel API')
      .setDescription(
        'Independent NestJS, Prisma, and PostgreSQL backend for the Accessimate multi-panel portfolio application.',
      )
      .setVersion('1.0.0')
      .addBearerAuth()
      .build();
    const document = SwaggerModule.createDocument(app, swagger);
    SwaggerModule.setup('api/docs', app, document, {
      jsonDocumentUrl: 'api/docs-json',
      customSiteTitle: 'Accessimate API Documentation',
    });
  }
};
