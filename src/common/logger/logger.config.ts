import { WinstonModuleOptions } from 'nest-winston';
import * as winston from 'winston';
import DailyRotateFile from 'winston-daily-rotate-file';
import { getCorrelationId } from '../middleware/correlation-id.middleware';
import { LoggingConstants } from '../constants/logging.constants';

/**
 * Formato personalizado para agregar correlationId a cada log
 */
const correlationIdFormat = winston.format((info) => {
  const correlationId = getCorrelationId();
  if (correlationId) {
    info.correlationId = correlationId;
  }
  return info;
});

/**
 * Formato para consola (desarrollo)
 */
const consoleFormat = winston.format.combine(
  winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
  correlationIdFormat(),
  winston.format.colorize(),
  winston.format.printf(({ timestamp, level, message, correlationId, context, ...meta }) => {
    const corrId = correlationId ? `[${correlationId}]` : '';
    const ctx = context ? `[${context}]` : '';
    const metaStr = Object.keys(meta).length ? JSON.stringify(meta) : '';
    return `${timestamp} ${level} ${ctx}${corrId} ${message} ${metaStr}`;
  }),
);

/**
 * Formato JSON estructurado (producción)
 */
const jsonFormat = winston.format.combine(
  winston.format.timestamp(),
  correlationIdFormat(),
  winston.format.errors({ stack: true }),
  winston.format.json(),
);

/**
 * Configuración de Winston según el ambiente
 */
export function createLoggerConfig(): WinstonModuleOptions {
  const env = process.env.NODE_ENV || 'development';
  const isDevelopment = env === 'development';

  // Transport para consola
  const consoleTransport = new winston.transports.Console({
    format: isDevelopment ? consoleFormat : jsonFormat,
  });

  // Transport para archivo con rotación diaria (todos los logs)
  const allLogsTransport = new DailyRotateFile({
    filename: 'logs/all-%DATE%.log',
    datePattern: 'YYYY-MM-DD',
    maxSize: '10m',
    maxFiles: '30d',
    format: jsonFormat,
    level: 'debug',
  });

  // Transport para archivo de info/warn (sin debug)
  const infoLogsTransport = new DailyRotateFile({
    filename: 'logs/info-%DATE%.log',
    datePattern: 'YYYY-MM-DD',
    maxSize: '10m',
    maxFiles: '60d',
    format: jsonFormat,
    level: 'info',
  });

  // Transport para errores
  const errorLogsTransport = new DailyRotateFile({
    filename: 'logs/error-%DATE%.log',
    datePattern: 'YYYY-MM-DD',
    maxSize: '10m',
    maxFiles: '90d',
    format: jsonFormat,
    level: 'error',
  });

  const transports: winston.transport[] = [consoleTransport];

  // Solo agregar file transports en producción o si está explícitamente habilitado
  if (!isDevelopment || process.env.ENABLE_FILE_LOGGING === 'true') {
    transports.push(allLogsTransport, infoLogsTransport, errorLogsTransport);
  }

  return {
    level: isDevelopment ? 'debug' : 'info',
    format: jsonFormat,
    defaultMeta: {
      service: LoggingConstants.SERVICE_NAME,
      environment: env,
    },
    transports,
    exceptionHandlers: [
      new winston.transports.File({ filename: 'logs/exceptions.log' }),
    ],
    rejectionHandlers: [
      new winston.transports.File({ filename: 'logs/rejections.log' }),
    ],
  };
}
