# Sistema de Logging - Payment Acquirer Service

## Descripción General

Sistema de logging robusto y centralizado para el servicio de adquirencia de pagos, implementado con **Winston** y **nest-winston**. Proporciona trazabilidad completa de requests mediante `correlationId`, logging estructurado en formato JSON, rotación automática de archivos y diferentes niveles de severidad.

## Características Principales

### 1. CorrelationId para Trazabilidad
- **Generación automática**: UUID único para cada request
- **Propagación**: Se mantiene a través de AsyncLocalStorage (similar a MDC en Java)
- **Header HTTP**: `X-Correlation-Id` en requests y responses
- **Integración con issuer**: Se propaga automáticamente al llamar al banco emisor

### 2. Formatos de Log

#### Desarrollo (Consola)
```
2024-01-15 10:30:45 info [PaymentsService][abc-123-def] Starting processPayment {"merchantId":"MERCHANT_001","amount":50000}
```

#### Producción (JSON)
```json
{
  "timestamp": "2024-01-15T10:30:45.123Z",
  "level": "info",
  "message": "Starting processPayment",
  "correlationId": "abc-123-def",
  "context": "PaymentsService",
  "service": "payment-acquirer-service",
  "environment": "production",
  "merchantId": "MERCHANT_001",
  "amount": 50000
}
```

### 3. Archivos de Log con Rotación

Los logs se guardan en el directorio `logs/` con rotación automática:

| Archivo | Contenido | Rotación | Retención |
|---------|-----------|----------|-----------|
| `all-YYYY-MM-DD.log` | Todos los niveles (debug+) | 10MB / día | 30 días |
| `info-YYYY-MM-DD.log` | Info, warn, error | 10MB / día | 60 días |
| `error-YYYY-MM-DD.log` | Solo errores | 10MB / día | 90 días |
| `exceptions.log` | Excepciones no manejadas | Manual | Indefinido |
| `rejections.log` | Promise rejections | Manual | Indefinido |

### 4. Niveles de Log

- **DEBUG**: Información detallada de debugging (solo desarrollo)
- **INFO**: Flujo normal de la aplicación
- **WARN**: Advertencias que no son errores
- **ERROR**: Errores que requieren atención

## Arquitectura del Sistema

```
┌─────────────────────────────────────────────────────────┐
│                    HTTP Request                          │
│                 (con/sin X-Correlation-Id)               │
└──────────────────────┬──────────────────────────────────┘
                       │
┌──────────────────────▼──────────────────────────────────┐
│          CorrelationIdMiddleware                         │
│  - Extrae o genera correlationId                         │
│  - Lo guarda en AsyncLocalStorage                        │
│  - Lo agrega al response header                          │
└──────────────────────┬──────────────────────────────────┘
                       │
┌──────────────────────▼──────────────────────────────────┐
│           LoggingInterceptor                             │
│  - Log del request entrante                              │
│  - Mide tiempo de ejecución                              │
│  - Log del response/error                                │
│  - Sanitiza información sensible                         │
└──────────────────────┬──────────────────────────────────┘
                       │
┌──────────────────────▼──────────────────────────────────┐
│        Controllers & Services                            │
│  - Usan AppLoggerService para logging                    │
│  - CorrelationId automático en cada log                  │
└──────────────────────┬──────────────────────────────────┘
                       │
┌──────────────────────▼──────────────────────────────────┐
│              IssuerClient                                │
│  - Propaga correlationId al issuer                       │
│  - Log de requests/responses HTTP                        │
└──────────────────────┬──────────────────────────────────┘
                       │
┌──────────────────────▼──────────────────────────────────┐
│         Winston Transports                               │
│  - Console (dev/prod)                                    │
│  - DailyRotateFile (prod)                                │
└──────────────────────────────────────────────────────────┘
```

## Componentes Principales

### 1. LoggingConstants
```typescript
// src/common/constants/logging.constants.ts
export const LoggingConstants = {
  CORRELATION_ID_KEY: 'correlationId',
  CORRELATION_ID_HEADER: 'X-Correlation-Id',
  SERVICE_NAME: 'payment-acquirer-service',
  ASYNC_STORAGE_NAMESPACE: 'payment-acquirer',
} as const;
```

### 2. CorrelationIdMiddleware
```typescript
// src/common/middleware/correlation-id.middleware.ts
// - Gestiona el correlationId
// - Usa AsyncLocalStorage para mantener contexto
// - Se aplica a todas las rutas (*)
```

### 3. Logger Config
```typescript
// src/common/logger/logger.config.ts
// - Configuración de Winston según ambiente
// - Formatos (consola colorizada / JSON estructurado)
// - Transports (consola + archivos rotativos)
```

### 4. AppLoggerService
```typescript
// src/common/logger/logger.service.ts
// - Servicio centralizado de logging
// - Métodos convenientes: log, debug, warn, error
// - Métodos especializados: logOperationStart, logHttpRequest, etc.
```

### 5. LoggingInterceptor
```typescript
// src/common/interceptors/logging.interceptor.ts
// - Logging automático de requests/responses
// - Medición de tiempo de ejecución
// - Sanitización de campos sensibles (cardToken, password, etc.)
```

## Configuración en app.module.ts

```typescript
import { WinstonModule } from 'nest-winston';
import { createLoggerConfig } from './common/logger/logger.config';
import { CorrelationIdMiddleware } from './common/middleware/correlation-id.middleware';
import { LoggingInterceptor } from './common/interceptors/logging.interceptor';
import { AppLoggerService } from './common/logger/logger.service';

@Module({
  imports: [
    WinstonModule.forRoot(createLoggerConfig()),
    // ... otros módulos
  ],
  providers: [
    AppLoggerService,
    {
      provide: APP_INTERCEPTOR,
      useClass: LoggingInterceptor,
    },
    // ... otros providers
  ],
})
export class AppModule implements NestModule {
  configure(consumer: MiddlewareConsumer) {
    consumer.apply(CorrelationIdMiddleware).forRoutes('*');
  }
}
```

## Uso en Servicios

### Ejemplo en PaymentsService

```typescript
import { AppLoggerService } from '../../../common/logger/logger.service';

@Injectable()
export class PaymentsService {
  private readonly context = 'PaymentsService';

  constructor(private readonly logger: AppLoggerService) {}

  async processPayment(dto: PaymentRequestDto) {
    // Log inicio de operación
    this.logger.logOperationStart('processPayment', this.context, {
      merchantId: dto.merchantId,
      amount: dto.amount,
    });

    try {
      // Lógica de negocio...
      
      // Log nivel debug
      this.logger.debug('Card token validated', this.context);
      
      // Log nivel info con metadata
      this.logger.log('Calling issuer', this.context, {
        merchantId: dto.merchantId,
        amount: dto.amount,
      });

      // Log éxito de operación
      this.logger.logOperationSuccess('processPayment', this.context, {
        transactionId,
        status: 'approved',
      });

      return result;
    } catch (error) {
      // Log fallo de operación
      this.logger.logOperationFailure('processPayment', this.context, error, {
        merchantId: dto.merchantId,
      });
      throw error;
    }
  }
}
```

### Ejemplo en IssuerClient

```typescript
@Injectable()
export class IssuerClient {
  private readonly context = 'IssuerClient';

  constructor(private readonly logger: AppLoggerService) {
    // Configurar interceptor para agregar correlationId a headers
    this.http.interceptors.request.use((config) => {
      const correlationId = getCorrelationId();
      if (correlationId) {
        config.headers[LoggingConstants.CORRELATION_ID_HEADER] = correlationId;
      }
      return config;
    });
  }

  async authorize(...params) {
    // Log request HTTP saliente
    this.logger.logHttpRequest('POST', '/payments', this.context, { 
      merchantId, 
      amount 
    });

    try {
      const response = await this.http.post('/payments', data);

      // Log response HTTP
      this.logger.logHttpResponse('POST', '/payments', response.status, this.context, {
        transactionId: response.data.transactionId,
      });

      return response.data;
    } catch (error) {
      // Log error con stack trace
      this.logger.error(
        `Error communicating with issuer: ${error.message}`,
        error.stack,
        this.context,
        { status: error.response?.status }
      );
      throw error;
    }
  }
}
```

## Variables de Entorno

```bash
# Ambiente (development, production, test)
NODE_ENV=development

# Habilitar logging a archivos en desarrollo (opcional)
ENABLE_FILE_LOGGING=true

# URL del issuer (para propagación de correlationId)
ISSUER_BASE_URL=http://localhost:8080
```

## Ejemplos de Logs

### Request Entrante
```json
{
  "timestamp": "2024-01-15T10:30:45.123Z",
  "level": "info",
  "message": "Incoming POST /payments",
  "correlationId": "550e8400-e29b-41d4-a716-446655440000",
  "context": "HTTP",
  "method": "POST",
  "url": "/payments",
  "body": {
    "merchantId": "MERCHANT_001",
    "amount": 50000,
    "currency": "CLP",
    "cardToken": "***REDACTED***"
  },
  "userAgent": "PostmanRuntime/7.32.2",
  "ip": "::1"
}
```

### Validación de Negocio
```json
{
  "timestamp": "2024-01-15T10:30:45.234Z",
  "level": "warn",
  "message": "Merchant validation failed",
  "correlationId": "550e8400-e29b-41d4-a716-446655440000",
  "context": "PaymentsService",
  "merchantId": "MERCHANT_999",
  "amount": 5000000,
  "message": "Unknown merchant or amount exceeds limit"
}
```

### HTTP Request a Issuer
```json
{
  "timestamp": "2024-01-15T10:30:45.345Z",
  "level": "debug",
  "message": "HTTP POST http://localhost:8080/payments",
  "correlationId": "550e8400-e29b-41d4-a716-446655440000",
  "context": "IssuerClient",
  "requestData": {
    "merchantId": "MERCHANT_001",
    "amount": 50000,
    "currency": "CLP"
  }
}
```

### Error de Comunicación
```json
{
  "timestamp": "2024-01-15T10:30:46.456Z",
  "level": "error",
  "message": "Error communicating with issuer: Network Error",
  "correlationId": "550e8400-e29b-41d4-a716-446655440000",
  "context": "IssuerClient",
  "stack": "Error: Network Error\n    at createError...",
  "status": undefined
}
```

### Response Exitoso
```json
{
  "timestamp": "2024-01-15T10:30:46.567Z",
  "level": "info",
  "message": "Completed POST /payments - 201 in 432ms",
  "correlationId": "550e8400-e29b-41d4-a716-446655440000",
  "context": "HTTP",
  "method": "POST",
  "url": "/payments",
  "statusCode": 201,
  "duration": 432,
  "responseSize": 245
}
```

## Métodos Disponibles en AppLoggerService

| Método | Descripción | Uso |
|--------|-------------|-----|
| `debug(message, context?, meta?)` | Log nivel DEBUG | Información de debugging |
| `log(message, context?, meta?)` | Log nivel INFO | Flujo normal |
| `warn(message, context?, meta?)` | Log nivel WARN | Advertencias |
| `error(message, trace?, context?, meta?)` | Log nivel ERROR | Errores con stack |
| `logOperationStart(op, ctx, params?)` | Inicio de operación | Marca inicio de función |
| `logOperationSuccess(op, ctx, result?)` | Éxito de operación | Marca éxito de función |
| `logOperationFailure(op, ctx, error, params?)` | Fallo de operación | Marca error de función |
| `logHttpRequest(method, url, ctx, data?)` | Request HTTP saliente | Log antes de HTTP call |
| `logHttpResponse(method, url, status, ctx, data?)` | Response HTTP | Log después de HTTP call |

## Mejores Prácticas

### 1. Siempre usar contexto
```typescript
// ✅ BIEN
this.logger.log('Processing payment', 'PaymentsService', { amount: 1000 });

// ❌ MAL
this.logger.log('Processing payment');
```

### 2. Incluir metadata relevante
```typescript
// ✅ BIEN
this.logger.warn('Validation failed', this.context, {
  field: 'amount',
  value: -100,
  reason: 'negative value',
});

// ❌ MAL
this.logger.warn('Validation failed');
```

### 3. Usar métodos especializados
```typescript
// ✅ BIEN
this.logger.logOperationStart('processPayment', this.context, { merchantId });
// ... lógica
this.logger.logOperationSuccess('processPayment', this.context, { transactionId });

// ❌ MAL
this.logger.log('Starting');
// ... lógica
this.logger.log('Done');
```

### 4. Log de errores con stack trace
```typescript
// ✅ BIEN
catch (error) {
  this.logger.error(
    `Failed to process: ${error.message}`,
    error.stack,
    this.context,
    { merchantId }
  );
}

// ❌ MAL
catch (error) {
  this.logger.log('Error: ' + error);
}
```

### 5. No loggear información sensible
```typescript
// ✅ BIEN - sanitizado automáticamente por LoggingInterceptor
this.logger.log('Request received', this.context, {
  cardToken: dto.cardToken  // Se sanitiza automáticamente
});

// ✅ BIEN - sanitización manual
this.logger.log('Card processed', this.context, {
  maskedCard: CryptoUtil.maskPAN(dto.cardToken)
});

// ❌ MAL
console.log('Full card:', dto.cardToken);
```

## Comparación con Sistema Java

| Característica | Java (issuingBank) | NestJS (acquirer) |
|----------------|-------------------|-------------------|
| Framework logging | Logback + SLF4J | Winston + nest-winston |
| Contexto request | MDC (Mapped Diagnostic Context) | AsyncLocalStorage |
| Formato JSON | logstash-logback-encoder | winston.format.json() |
| CorrelationId | CorrelationIdFilter (Filter) | CorrelationIdMiddleware (Middleware) |
| Rotación archivos | SizeAndTimeBasedRollingPolicy | DailyRotateFile transport |
| Logging automático | Filter logging + @Slf4j | LoggingInterceptor |
| Perfiles | spring profiles (dev/prod/test) | NODE_ENV |
| Async logging | AsyncAppender | Winston async (nativo) |

## Troubleshooting

### Logs no aparecen en archivos
- Verificar que `NODE_ENV` no sea `development` o activar `ENABLE_FILE_LOGGING=true`
- Verificar permisos del directorio `logs/`
- Revisar consola para errores de Winston

### CorrelationId no aparece en logs
- Verificar que `CorrelationIdMiddleware` esté registrado en `app.module.ts`
- Asegurar que `createLoggerConfig()` incluye el `correlationIdFormat`
- Verificar que el código esté dentro del contexto del middleware (no en constructores)

### Logs en consola sin color
- Verificar que `NODE_ENV=development`
- Revisar configuración de terminal (soporte ANSI)

### Archivos de log crecen mucho
- Ajustar `maxSize` en `DailyRotateFile` (default: 10MB)
- Reducir `maxFiles` para retención más corta
- Aumentar nivel de log de `debug` a `info` en producción

## Mantenimiento

### Limpieza de Logs
Los archivos se limpian automáticamente según configuración:
- `all-*.log`: 30 días
- `info-*.log`: 60 días
- `error-*.log`: 90 días

Para limpieza manual:
```bash
# Eliminar logs más antiguos de 30 días
find logs/ -name "*.log" -mtime +30 -delete

# Comprimir logs antiguos
find logs/ -name "*.log" -mtime +7 -exec gzip {} \;
```

### Monitoreo
Se recomienda integrar con herramientas de agregación:
- **ELK Stack**: Elasticsearch + Logstash + Kibana
- **Splunk**: Ingesta directa de archivos JSON
- **CloudWatch**: AWS CloudWatch Logs
- **Datadog**: Agent de Datadog

### Alertas
Configurar alertas para:
- Alto volumen de logs ERROR (>10/min)
- Requests con duración >5s
- Errores 5xx (>5% del tráfico)
- Excepciones no manejadas

## Referencias

- [Winston Documentation](https://github.com/winstonjs/winston)
- [nest-winston](https://github.com/gremo/nest-winston)
- [AsyncLocalStorage](https://nodejs.org/api/async_context.html#class-asynclocalstorage)
- [winston-daily-rotate-file](https://github.com/winstonjs/winston-daily-rotate-file)

---

**Versión**: 1.0.0  
**Última actualización**: 2024-01-15  
**Mantenedor**: Payment Acquirer Team
