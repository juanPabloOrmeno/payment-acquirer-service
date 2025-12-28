import { Injectable, Inject, LoggerService as NestLoggerService } from '@nestjs/common';
import { Logger } from 'winston';
import { WINSTON_MODULE_PROVIDER } from 'nest-winston';

/**
 * Servicio centralizado de logging que envuelve Winston
 * Proporciona métodos convenientes para logging con contexto
 */
@Injectable()
export class AppLoggerService implements NestLoggerService {
  constructor(
    @Inject(WINSTON_MODULE_PROVIDER) private readonly logger: Logger,
  ) {}

  /**
   * Log nivel DEBUG - información detallada de debugging
   */
  debug(message: string, context?: string, meta?: Record<string, any>) {
    this.logger.debug(message, { context, ...meta });
  }

  /**
   * Log nivel INFO - información general del flujo
   */
  log(message: string, context?: string, meta?: Record<string, any>) {
    this.logger.info(message, { context, ...meta });
  }

  /**
   * Log nivel WARN - advertencias que no son errores
   */
  warn(message: string, context?: string, meta?: Record<string, any>) {
    this.logger.warn(message, { context, ...meta });
  }

  /**
   * Log nivel ERROR - errores que requieren atención
   */
  error(message: string, trace?: string, context?: string, meta?: Record<string, any>) {
    this.logger.error(message, { context, stack: trace, ...meta });
  }

  /**
   * Log nivel VERBOSE - información muy detallada
   */
  verbose(message: string, context?: string, meta?: Record<string, any>) {
    this.logger.verbose(message, { context, ...meta });
  }

  /**
   * Log de inicio de operación
   */
  logOperationStart(operation: string, context: string, params?: Record<string, any>) {
    this.log(`Starting ${operation}`, context, params);
  }

  /**
   * Log de éxito de operación
   */
  logOperationSuccess(operation: string, context: string, result?: Record<string, any>) {
    this.log(`Successfully completed ${operation}`, context, result);
  }

  /**
   * Log de fallo de operación
   */
  logOperationFailure(operation: string, context: string, error: Error, params?: Record<string, any>) {
    this.error(
      `Failed to ${operation}: ${error.message}`,
      error.stack,
      context,
      params,
    );
  }

  /**
   * Log de request HTTP saliente
   */
  logHttpRequest(method: string, url: string, context: string, data?: any) {
    this.debug(`HTTP ${method} ${url}`, context, { requestData: data });
  }

  /**
   * Log de response HTTP
   */
  logHttpResponse(method: string, url: string, status: number, context: string, data?: any) {
    this.debug(`HTTP ${method} ${url} - ${status}`, context, { responseData: data });
  }
}
