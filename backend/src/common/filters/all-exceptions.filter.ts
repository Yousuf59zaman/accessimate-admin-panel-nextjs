import {
  ArgumentsHost,
  Catch,
  ExceptionFilter,
  HttpException,
  HttpStatus,
} from '@nestjs/common';
import type { Response } from 'express';
import type { AuthenticatedRequest } from '../interfaces/authenticated-request';

type HttpErrorResponse = {
  message?: string | string[];
  error?: string;
  statusCode?: number;
};

@Catch()
export class AllExceptionsFilter implements ExceptionFilter {
  catch(exception: unknown, host: ArgumentsHost) {
    const context = host.switchToHttp();
    const response = context.getResponse<Response>();
    const request = context.getRequest<AuthenticatedRequest>();
    const isHttpException = exception instanceof HttpException;
    const status = isHttpException
      ? exception.getStatus()
      : HttpStatus.INTERNAL_SERVER_ERROR;
    const raw = isHttpException
      ? (exception.getResponse() as string | HttpErrorResponse)
      : undefined;
    const message = this.messageFrom(raw, status);

    response.status(status).json({
      status: false,
      message,
      data: this.validationData(raw),
      request_id: request.requestId,
    });
  }

  private messageFrom(
    raw: string | HttpErrorResponse | undefined,
    status: number,
  ): string {
    if (typeof raw === 'string') return raw;
    if (Array.isArray(raw?.message)) return 'Please correct the highlighted fields.';
    if (typeof raw?.message === 'string') return raw.message;
    if (status >= 500) return 'The server could not complete the request.';
    return 'The request could not be completed.';
  }

  private validationData(
    raw: string | HttpErrorResponse | undefined,
  ): Record<string, string[]> | undefined {
    if (typeof raw === 'string' || !Array.isArray(raw?.message)) return undefined;

    return raw.message.reduce<Record<string, string[]>>((result, entry) => {
      const unknownField = /^property\s+(\S+)\s+should not exist$/i.exec(entry)?.[1];
      const [firstWord = 'form'] = entry.split(' ');
      const field = unknownField ?? firstWord;
      result[field] = [...(result[field] ?? []), entry];
      return result;
    }, {});
  }
}
