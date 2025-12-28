/**
 * Constantes para el sistema de logging
 */
export const LoggingConstants = {
  /**
   * Key para el correlationId en el contexto de la request
   */
  CORRELATION_ID_KEY: 'correlationId',

  /**
   * Header HTTP para el correlationId
   */
  CORRELATION_ID_HEADER: 'X-Correlation-Id',

  /**
   * Nombre del servicio para logs
   */
  SERVICE_NAME: 'payment-acquirer-service',

  /**
   * Namespace para AsyncLocalStorage
   */
  ASYNC_STORAGE_NAMESPACE: 'payment-acquirer',
} as const;
