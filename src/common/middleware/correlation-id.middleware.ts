import { Injectable, NestMiddleware } from '@nestjs/common';
import { Request, Response, NextFunction } from 'express';
import { v4 as uuidv4 } from 'uuid';
import { LoggingConstants } from '../constants/logging.constants';
import { AsyncLocalStorage } from 'async_hooks';

/**
 * Storage para mantener el correlationId en el contexto de cada request
 * Similar a MDC en Java/Logback
 */
export const asyncLocalStorage = new AsyncLocalStorage<Map<string, any>>();

/**
 * Middleware que gestiona el correlationId para trazabilidad de requests
 * El correlationId se propaga automáticamente a través de AsyncLocalStorage
 */
@Injectable()
export class CorrelationIdMiddleware implements NestMiddleware {
  use(req: Request, res: Response, next: NextFunction) {
    // Obtener correlationId del header o generar uno nuevo
    let correlationId =
      req.headers[LoggingConstants.CORRELATION_ID_HEADER.toLowerCase()] as string;

    if (!correlationId) {
      correlationId = uuidv4();
    }

    // Crear almacenamiento local para esta request
    const store = new Map<string, any>();
    store.set(LoggingConstants.CORRELATION_ID_KEY, correlationId);

    // Agregar correlationId al response header
    res.setHeader(LoggingConstants.CORRELATION_ID_HEADER, correlationId);

    // Agregar al objeto request para acceso directo
    (req as any).correlationId = correlationId;

    // Ejecutar la request dentro del contexto de AsyncLocalStorage
    asyncLocalStorage.run(store, () => {
      next();
    });
  }
}

/**
 * Helper para obtener el correlationId del contexto actual
 */
export function getCorrelationId(): string | undefined {
  const store = asyncLocalStorage.getStore();
  return store?.get(LoggingConstants.CORRELATION_ID_KEY);
}
