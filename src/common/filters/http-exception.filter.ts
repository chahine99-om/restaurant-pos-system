import {
  ExceptionFilter,
  Catch,
  ArgumentsHost,
  HttpException,
  HttpStatus,
  Logger,
} from '@nestjs/common';
import { Request, Response } from 'express';

/**
 * Centralized error handling - never expose stack traces or sensitive data in API output.
 */
@Catch()
export class AllExceptionsFilter implements ExceptionFilter {
  private readonly logger = new Logger(AllExceptionsFilter.name);

  catch(exception: unknown, host: ArgumentsHost): void {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest<Request>();

    const status =
      exception instanceof HttpException
        ? exception.getStatus()
        : HttpStatus.INTERNAL_SERVER_ERROR;

    const message =
      exception instanceof HttpException
        ? exception.getResponse()
        : 'Internal server error';

    const body =
      typeof message === 'object' && message !== null && 'message' in message
        ? (message as { message?: string | string[] })
        : { message };

    // Log server-side only: method, path, status, error message. Never log body, headers, or tokens.
    const path = request.url?.split('?')[0] ?? request.url;
    this.logger.warn(
      `${request.method} ${path} ${status} - ${JSON.stringify(body)}`,
    );

    response.status(status).json({
      statusCode: status,
      ...body,
      // No stack trace, no internal details
    });
  }
}
