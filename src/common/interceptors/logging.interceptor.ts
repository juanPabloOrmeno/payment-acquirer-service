import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
} from '@nestjs/common';
import { Observable } from 'rxjs';
import { tap } from 'rxjs/operators';
import { Request, Response } from 'express';
import { AppLoggerService } from '../logger/logger.service';

/**
 * Interceptor para logging automático de requests HTTP entrantes y responses
 * Similar a un filter de servlet en Java
 */
@Injectable()
export class LoggingInterceptor implements NestInterceptor {
  constructor(private readonly logger: AppLoggerService) {}

  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    const httpContext = context.switchToHttp();
    const request = httpContext.getRequest<Request>();
    const response = httpContext.getResponse<Response>();

    const { method, url, body, params, query } = request;
    const correlationId = (request as any).correlationId;
    const startTime = Date.now();

    // Log del request entrante
    this.logger.log(
      `Incoming ${method} ${url}`,
      'HTTP',
      {
        method,
        url,
        correlationId,
        body: this.sanitizeBody(body),
        params,
        query,
        userAgent: request.get('user-agent'),
        ip: request.ip,
      },
    );

    return next.handle().pipe(
      tap({
        next: (data) => {
          const duration = Date.now() - startTime;
          const statusCode = response.statusCode;

          // Log del response exitoso
          this.logger.log(
            `Completed ${method} ${url} - ${statusCode} in ${duration}ms`,
            'HTTP',
            {
              method,
              url,
              statusCode,
              duration,
              correlationId,
              responseSize: data ? JSON.stringify(data).length : 0,
            },
          );
        },
        error: (error) => {
          const duration = Date.now() - startTime;
          const statusCode = error.status || 500;

          // Log del error
          this.logger.error(
            `Failed ${method} ${url} - ${statusCode} in ${duration}ms: ${error.message}`,
            error.stack,
            'HTTP',
            {
              method,
              url,
              statusCode,
              duration,
              correlationId,
              errorName: error.name,
            },
          );
        },
      }),
    );
  }

  /**
   * Sanitiza el body para evitar loggear información sensible
   */
  private sanitizeBody(body: any): any {
    if (!body) return body;

    const sanitized = { ...body };
    const sensitiveFields = ['cardToken', 'password', 'token', 'secret'];

    for (const field of sensitiveFields) {
      if (sanitized[field]) {
        sanitized[field] = '***REDACTED***';
      }
    }

    return sanitized;
  }
}
