# 💳 Payment Acquirer Service - Servicio Adquirente de Pagos

## 📌 Descripción General

**Payment Acquirer Service** es un servicio backend que actúa como **adquirente** en un sistema de procesamiento de pagos. Su responsabilidad principal es recibir solicitudes de pago de comercios, validarlas, y coordinar con el banco emisor para autorizar y procesar transacciones.

### ¿Qué problema resuelve?

Este sistema simula el rol de un acquirer/adquirente en una infraestructura de pagos:
- Recibe y valida solicitudes de pago de múltiples comercios
- Actúa como intermediario entre comercios y bancos emisores
- Gestiona el ciclo de vida completo de las transacciones
- Proporciona logging estructurado con trazabilidad distribuida
- Almacena y consulta el historial de transacciones

### Tipo de sistema

**Payment Acquirer / Payment Gateway**
- Actúa como intermediario entre comercios y bancos emisores
- Valida y enruta transacciones de pago
- Gestiona comunicación HTTP con servicios bancarios
- Mantiene registro persistente de transacciones

### Stack tecnológico

| Tecnología | Versión | Propósito |
|-----------|---------|-----------|
| **Node.js** | 20+ | Runtime de JavaScript |
| **NestJS** | 11.0.1 | Framework principal |
| **TypeScript** | 5.7.3 | Lenguaje tipado |
| **class-validator** | 0.14.3 | Validación de DTOs |
| **class-transformer** | 0.5.1 | Transformación de objetos |
| **Axios** | 1.13.2 | Cliente HTTP |
| **Winston** | 3.17.0 | Logging estructurado |
| **Swagger/OpenAPI** | 11.2.3 | Documentación de API |
| **Jest** | 30.0.0 | Framework de testing |
| **Docker** | - | Containerización |

---

## 🧱 Arquitectura del Proyecto

### Arquitectura modular (Modular Architecture)

El proyecto sigue la arquitectura modular de NestJS con **separación de responsabilidades**:

```
┌────────────────────────────────────────┐
│     Controller Layer (HTTP)            │  ← Endpoints REST
├────────────────────────────────────────┤
│     Service Layer (Business Logic)     │  ← Lógica de negocio
├────────────────────────────────────────┤
│     Client Layer (External APIs)       │  ← Comunicación con issuer
├────────────────────────────────────────┤
│     Common Layer (Utilities)           │  ← Logger, interceptors, utils
└────────────────────────────────────────┘
```

### Estructura de carpetas

```
payment-acquirer-service/
├── src/
│   ├── modules/
│   │   └── payments/              # Módulo de pagos
│   │       ├── controller/
│   │       │   ├── payments.controller.ts
│   │       │   └── payments.controller.spec.ts
│   │       ├── service/
│   │       │   ├── payments.service.ts
│   │       │   └── payments.service.spec.ts
│   │       ├── dto/
│   │       │   ├── payment-request.dto.ts
│   │       │   ├── payment-request.dto.spec.ts
│   │       │   └── issuer-response.dto.ts
│   │       ├── enums/
│   │       │   └── merchant.enum.ts
│   │       └── payments.module.ts
│   ├── issuer/                    # Cliente del banco emisor
│   │   ├── issuer.client.ts
│   │   └── issuer.client.spec.ts
│   ├── common/                    # Utilidades compartidas
│   │   ├── logger/
│   │   │   ├── logger.service.ts
│   │   │   └── logger.config.ts
│   │   ├── interceptors/
│   │   │   └── logging.interceptor.ts
│   │   ├── middleware/
│   │   │   └── correlation-id.middleware.ts
│   │   ├── constants/
│   │   │   └── logging.constants.ts
│   │   └── utils/
│   │       └── crypto.util.ts
│   ├── config/                    # Configuraciones
│   ├── health/                    # Health checks
│   ├── app.module.ts              # Módulo raíz
│   ├── app.controller.ts
│   ├── app.service.ts
│   └── main.ts                    # Punto de entrada
├── test/                          # Tests E2E
├── coverage/                      # Reportes de cobertura
├── logs/                          # Archivos de log
├── Dockerfile
├── docker-compose.yml
├── package.json
├── tsconfig.json
├── jest.setup.js
├── LOGGING_README.md
└── README.md
```

### Descripción de módulos

| Módulo | Responsabilidad |
|--------|----------------|
| **modules/payments** | Lógica principal de procesamiento de pagos |
| **controller** | Expone endpoints REST, valida entrada HTTP |
| **service** | Implementa lógica de negocio, orquesta operaciones |
| **dto** | Define contratos de entrada/salida con validaciones |
| **issuer** | Cliente HTTP para comunicación con banco emisor |
| **common/logger** | Logging estructurado JSON con Winston |
| **common/interceptors** | Interceptores HTTP para logging automático |
| **common/middleware** | Middleware para correlationId, etc. |
| **common/utils** | Utilidades de cifrado, formateo, etc. |

---

## ⚙️ Requisitos Previos

### Obligatorios

- 🟢 **Node.js 20 o superior**
  ```bash
  node --version  # Debe mostrar v20+
  ```

- 📦 **Yarn 1.22+** (gestor de paquetes)
  ```bash
  yarn --version
  ```

### Opcionales

- 🐳 **Docker** (para ejecución containerizada)
  ```bash
  docker --version
  docker-compose --version
  ```

### Sistema operativo

Compatible con:
- ✅ Linux (Ubuntu, Debian, RHEL, etc.)
- ✅ macOS (Intel y Apple Silicon)
- ✅ Windows 10/11 (con WSL2 recomendado)

---

## 🚀 Cómo Levantar el Proyecto

### Opción 1: Ejecución local con npm

```bash
# 1. Navegar al directorio del proyecto
cd payment-acquirer-service

# 2. Instalar dependencias
yarn install

# 3. Ejecutar en modo desarrollo (con hot-reload)
yarn start:dev

# O ejecutar en modo producción
yarn build
yarn start:prod
```

La aplicación estará disponible en: **http://localhost:3000**

### Opción 2: Ejecución con Docker

```bash
# 1. Construir la imagen
docker build -t payment-acquirer:latest .

# 2. Ejecutar el contenedor
docker run -p 3000:3000 \
  -e ISSUER_BASE_URL=http://localhost:8080 \
  payment-acquirer:latest
```

### Opción 3: Ejecución con Docker Compose (stack completo)

```bash
# Levantar acquirer + issuing bank juntos
docker-compose up --build

# Detener los servicios
docker-compose down
```

Esto levantará:
- **Payment Acquirer**: http://localhost:3000
- **Issuing Bank**: http://localhost:8080

### Verificar que el servicio está activo

```bash
# Endpoint básico
curl http://localhost:3000

# Swagger UI
open http://localhost:3000/api
$ yarn run test

# e2e tests
$ yarn run test:e2e

# test coverage
$ npm run test:cov
```

---

## 🔗 Endpoints Disponibles

### Base URL
```
http://localhost:3000
```

### 1. Procesar un pago

**POST** `/payments`

Procesa una nueva transacción de pago y la envía al banco emisor para autorización.

#### Request

```json
{
  "merchantId": "MERCHANT_001",
  "amount": 15000,
  "currency": "CLP",
  "cardToken": "tok_9f83hdf92ksl",
  "expirationDate": "12/26",
  "operationType": "PURCHASE"
}
```

#### Response (201 Created)

```json
{
  "transactionId": "fa2f2617-7a3f-44a7-af3f-50d5d427c139",
  "status": "COMPLETED",
  "amount": 15000,
  "currency": "CLP",
  "maskedCard": "****1234",
  "operationType": "PURCHASE",
  "responseCode": "00",
  "createdAt": "2025-12-28T10:30:00.876Z",
  "updatedAt": "2025-12-28T10:30:00.900Z"
}
```

#### Estados de transacción

| Estado | Descripción |
|--------|-------------|
| `COMPLETED` | Transacción aprobada por el emisor |
| `DECLINED` | Transacción rechazada (fondos insuficientes, etc.) |
| `PENDING` | Transacción en proceso |
| `ERROR` | Error en el procesamiento |

#### Tipos de operación

- `PURCHASE`: Compra normal
- `REFUND`: Reembolso/devolución
- `VOID`: Anulación

#### Ejemplo con curl

```bash
curl -X POST http://localhost:3000/payments \
  -H "Content-Type: application/json" \
  -d '{
    "merchantId": "MERCHANT_001",
    "amount": 15000,
    "currency": "CLP",
    "cardToken": "tok_9f83hdf92ksl",
    "expirationDate": "12/26",
    "operationType": "PURCHASE"
  }'
```

---

### 2. Consultar estado de transacción

**GET** `/payments/{transactionId}`

Obtiene el estado actual de una transacción por su ID único.

#### Request

```bash
GET /payments/fa2f2617-7a3f-44a7-af3f-50d5d427c139
```

#### Response (200 OK)

```json
{
  "transactionId": "fa2f2617-7a3f-44a7-af3f-50d5d427c139",
  "merchantId": "MERCHANT_001",
  "amount": 15000,
  "currency": "CLP",
  "maskedCard": "****1234",
  "status": "DECLINED",
  "operationType": "PURCHASE",
  "responseCode": "05",
  "createdAt": "2025-12-28T10:30:00.876Z",
  "updatedAt": "2025-12-28T10:30:00.900Z"
}
```

#### Ejemplo con curl

```bash
curl http://localhost:3000/payments/fa2f2617-7a3f-44a7-af3f-50d5d427c139
```

---

## 📘 Swagger / OpenAPI

### Acceso a la documentación interactiva

- **Swagger UI**: http://localhost:3000/api
- **OpenAPI JSON**: http://localhost:3000/api-json

### Cómo probar la API desde Swagger

1. Abrir http://localhost:3000/api
2. Expandir el endpoint deseado (ej: `POST /payments`)
3. Hacer clic en **"Try it out"**
4. Editar el JSON de ejemplo
5. Hacer clic en **"Execute"**
6. Ver la respuesta en tiempo real con correlationId incluido

### Características de Swagger

- ✅ Ejemplos de request/response
- ✅ Validaciones documentadas
- ✅ Códigos de error HTTP
- ✅ Modelos de datos interactivos
- ✅ Testing directo desde el navegador

---

## 🧪 Testing

### Ejecutar todos los tests

```bash
yarn test
```

### Ejecutar tests con cobertura

```bash
yarn test:cov
```

El reporte HTML estará disponible en: `coverage/lcov-report/index.html`

### Ejecutar tests en modo watch

```bash
yarn test:watch
```

### Tipos de tests

| Tipo | Ubicación | Descripción |
|------|-----------|-------------|
| **Unitarios** | `**/*.spec.ts` | Validan lógica aislada (service, dto) |
| **Integración** | `controller/*.spec.ts` | Validan endpoints con supertest |
| **E2E** | `test/*.e2e-spec.ts` | Validan flujos completos |

### Estructura de tests

```
src/
├── aaa-app.controller.spec.ts                    # 2 tests
├── modules/payments/
│   ├── controller/
│   │   └── payments.controller.spec.ts           # 31 tests
│   ├── service/
│   │   └── payments.service.spec.ts              # 24 tests
│   └── dto/
│       └── payment-request.dto.spec.ts           # 24 tests
└── issuer/
    └── issuer.client.spec.ts                     # 10 tests
```

### Estadísticas de cobertura

```
Test Suites: 5 passed
Tests:       91 passed
Coverage:    >54% overall
             93.65% en payments.service.ts
             100% en payments.controller.ts
```

---

## 🗂️ Configuración

### Variables de entorno

Puedes configurar el servicio mediante variables de entorno:

```bash
# Puerto del servidor
export PORT=3000

# URL del banco emisor
export ISSUER_BASE_URL=http://localhost:8080

# Entorno
export NODE_ENV=production

# Nivel de logs
export LOG_LEVEL=info
```

### Archivo .env (desarrollo)

Crear un archivo `.env` en la raíz:

```env
PORT=3000
ISSUER_BASE_URL=http://localhost:8080
NODE_ENV=development
LOG_LEVEL=debug
```

### Configuración de logging

El servicio usa Winston con logging estructurado JSON:

```typescript
// logger.config.ts
{
  level: 'info',
  format: winston.format.json(),
  transports: [
    new winston.transports.Console(),
    new DailyRotateFile({
      filename: 'logs/app-%DATE%.log',
      datePattern: 'YYYY-MM-DD',
      maxFiles: '14d'
    })
  ]
}
```

---

## 🔐 Manejo de Errores

### Estructura de errores

Todos los errores HTTP siguen un formato estándar de NestJS:

```json
{
  "statusCode": 400,
  "message": [
    "Amount must be greater than zero",
    "Currency is required"
  ],
  "error": "Bad Request"
}
```

### Códigos HTTP utilizados

| Código | Escenario |
|--------|-----------|
| `201 CREATED` | Pago procesado exitosamente |
| `200 OK` | Consulta exitosa |
| `400 BAD REQUEST` | Validación fallida en DTO |
| `404 NOT FOUND` | Transacción no encontrada |
| `500 INTERNAL SERVER ERROR` | Error inesperado |
| `503 SERVICE UNAVAILABLE` | Banco emisor no disponible |

### Ejemplos de respuestas de error

#### Validación fallida (400)

```json
{
  "statusCode": 400,
  "message": [
    "Amount must be greater than zero",
    "Expiration date must be in MM/YY format"
  ],
  "error": "Bad Request"
}
```

#### Transacción no encontrada (404)

```json
{
  "statusCode": 404,
  "message": "Transaction with ID abc123 not found",
  "error": "Not Found"
}
```

#### Servicio emisor no disponible (503)

```json
{
  "statusCode": 503,
  "message": "Issuer service unavailable",
  "error": "Service Unavailable"
}
```

---

## 🧠 Decisiones Técnicas

### ¿Por qué NestJS?

- ✅ **Arquitectura escalable**: Módulos, inyección de dependencias
- ✅ **TypeScript first**: Tipado fuerte out-of-the-box
- ✅ **Ecosystem maduro**: Amplia integración con librerías
- ✅ **Testing integrado**: Jest configurado por defecto
- ✅ **Decoradores**: Código declarativo y limpio
- ✅ **Swagger automático**: Documentación desde decoradores

### ¿Por qué arquitectura modular?

- ✅ **Escalabilidad**: Módulos independientes y reutilizables
- ✅ **Mantenibilidad**: Cambios aislados por módulo
- ✅ **Testing**: Módulos testeables independientemente
- ✅ **Lazy loading**: Carga bajo demanda si es necesario
- ✅ **Separation of concerns**: Responsabilidad única

### ¿Por qué class-validator?

- ✅ **Validación declarativa**: Decoradores en DTOs
- ✅ **Mensajes personalizados**: Errores descriptivos
- ✅ **Validación en pipeline**: Automático en todos los endpoints
- ✅ **TypeScript native**: Tipado preservado
- ✅ **Extensible**: Validadores custom fáciles

### ¿Por qué Winston para logging?

- ✅ **JSON estructurado**: Logs parseables por herramientas
- ✅ **Múltiples transportes**: Console, archivo, remote
- ✅ **Rotación de logs**: Daily rotate file integrado
- ✅ **Niveles configurables**: debug, info, warn, error
- ✅ **MDC/Context**: correlationId para tracing distribuido

### ¿Por qué almacenamiento en memoria?

- ✅ **Desarrollo rápido**: Sin dependencias externas
- ✅ **Testing simple**: Estado limpio entre tests
- ✅ **Prototipado**: Validar lógica sin infraestructura
- ⚠️ **No para producción**: Usar PostgreSQL/MongoDB en prod

### ¿Por qué TypeScript?

- ✅ **Type safety**: Errores en compilación, no en runtime
- ✅ **IntelliSense**: Autocompletado y refactoring
- ✅ **Contratos claros**: Interfaces documentan código
- ✅ **Refactoring seguro**: Cambios de tipos detectados
- ✅ **Developer experience**: Más productividad

---

## 🧪 Cómo Probar Rápidamente

### 1. Procesar un pago exitoso

```bash
curl -X POST http://localhost:3000/payments \
  -H "Content-Type: application/json" \
  -d '{
    "merchantId": "MERCHANT_001",
    "amount": 25000,
    "currency": "CLP",
    "cardToken": "tok_valid_card_123",
    "expirationDate": "12/27",
    "operationType": "PURCHASE"
  }' | jq
```

### 2. Consultar el estado de la transacción

```bash
# Guarda el transactionId de la respuesta anterior
TRANSACTION_ID="<pegar-transaction-id-aqui>"

curl http://localhost:3000/payments/$TRANSACTION_ID | jq
```

### 3. Validar errores de validación

```bash
# Enviar monto negativo (debe fallar)
curl -X POST http://localhost:3000/payments \
  -H "Content-Type: application/json" \
  -d '{
    "merchantId": "MERCHANT_001",
    "amount": -100,
    "currency": "CLP",
    "cardToken": "tok_123",
    "expirationDate": "invalid"
  }' | jq
```

### 4. Consultar transacción inexistente

```bash
curl http://localhost:3000/payments/nonexistent-id | jq
```

### 5. Ver logs estructurados

```bash
# Ver logs en tiempo real
tail -f logs/app-2025-12-28.log | jq

# Buscar por correlationId
grep "correlationId" logs/app-2025-12-28.log | jq

# Filtrar errores
grep '"level":"error"' logs/app-2025-12-28.log | jq
```

### 6. Probar con diferentes comerciantes

```bash
# MERCHANT_001
curl -X POST http://localhost:3000/payments \
  -H "Content-Type: application/json" \
  -d '{
    "merchantId": "MERCHANT_001",
    "amount": 10000,
    "currency": "CLP",
    "cardToken": "tok_test_1",
    "expirationDate": "12/27"
  }' | jq

# MERCHANT_002
curl -X POST http://localhost:3000/payments \
  -H "Content-Type: application/json" \
  -d '{
    "merchantId": "MERCHANT_002",
    "amount": 20000,
    "currency": "USD",
    "cardToken": "tok_test_2",
    "expirationDate": "06/28"
  }' | jq
```

---

## 📦 Estructura del Proyecto (Árbol Completo)

```
payment-acquirer-service/
├── coverage/                                # Reportes de cobertura Jest
│   ├── lcov-report/
│   │   └── index.html                      # Reporte HTML de cobertura
│   ├── lcov.info
│   └── coverage-final.json
├── logs/                                    # Archivos de log con rotación
│   ├── app-2025-12-27.log
│   └── app-2025-12-28.log
├── src/
│   ├── modules/
│   │   └── payments/                       # Módulo principal de pagos
│   │       ├── controller/
│   │       │   ├── payments.controller.ts               # REST endpoints
│   │       │   └── payments.controller.spec.ts          # 31 tests
│   │       ├── service/
│   │       │   ├── payments.service.ts                  # Lógica de negocio
│   │       │   └── payments.service.spec.ts             # 24 tests
│   │       ├── dto/
│   │       │   ├── payment-request.dto.ts               # DTO entrada
│   │       │   ├── payment-request.dto.spec.ts          # 24 tests
│   │       │   └── issuer-response.dto.ts               # DTO del issuer
│   │       ├── enums/
│   │       │   └── merchant.enum.ts                     # MerchantId enum
│   │       └── payments.module.ts                       # Módulo NestJS
│   ├── issuer/                             # Cliente HTTP del banco emisor
│   │   ├── issuer.client.ts                            # HTTP client
│   │   └── issuer.client.spec.ts                       # 10 tests
│   ├── common/                             # Utilidades compartidas
│   │   ├── logger/
│   │   │   ├── logger.service.ts                       # Winston logger
│   │   │   └── logger.config.ts                        # Config de logs
│   │   ├── interceptors/
│   │   │   └── logging.interceptor.ts                  # HTTP logging
│   │   ├── middleware/
│   │   │   └── correlation-id.middleware.ts            # CorrelationId
│   │   ├── constants/
│   │   │   └── logging.constants.ts                    # Constantes
│   │   └── utils/
│   │       └── crypto.util.ts                          # Utilidades crypto
│   ├── config/                             # Configuraciones
│   ├── health/                             # Health checks
│   ├── aaa-app.controller.spec.ts          # 2 tests (app básico)
│   ├── app.controller.ts                   # Controller raíz
│   ├── app.module.ts                       # Módulo raíz
│   ├── app.service.ts                      # Service raíz
│   └── main.ts                             # Bootstrap de la app
├── test/                                    # Tests E2E
│   ├── app.e2e-spec.ts
│   └── jest-e2e.json
├── .gitignore
├── docker-compose.yml                       # Stack completo (acquirer + issuer)
├── Dockerfile                               # Imagen Docker multi-stage
├── eslint.config.mjs                        # Configuración ESLint
├── jest.setup.js                            # Setup global de Jest
├── nest-cli.json                            # Configuración NestJS CLI
├── package.json                             # Dependencias y scripts
├── tsconfig.json                            # Configuración TypeScript
├── tsconfig.build.json                      # Config para build
├── LOGGING_README.md                        # Documentación de logging
└── README.md                                # Este archivo
```

---

## 📝 Notas Adicionales

### CorrelationId

Todas las peticiones HTTP incluyen un `correlationId` único:
- Generado automáticamente por el middleware
- Propagado al issuer en el header `x-correlation-id`
- Incluido en todos los logs para tracing distribuido

```bash
# Ver correlationId en la respuesta
curl -v http://localhost:3000/payments/txn_123 2>&1 | grep x-correlation-id
```

### Logging estructurado

Los logs están en formato JSON para facilitar parseo:

```json
{
  "timestamp": "2025-12-28T10:30:00.123Z",
  "level": "info",
  "context": "PaymentsService",
  "message": "Processing payment",
  "correlationId": "abc-123-def",
  "merchantId": "MERCHANT_001",
  "amount": 15000,
  "transactionId": "txn_456"
}
```

### Resiliencia

El servicio implementa:
- ✅ Retry automático en llamadas al issuer (3 intentos)
- ✅ Circuit breaker para prevenir cascading failures
- ✅ Timeouts configurables en HTTP client
- ✅ Manejo de errores con responses estructurados

### Health checks

```bash

## 👥 Contribuciones

Este proyecto es parte de un sistema de pagos educativo/evaluativo.

---

## 📄 Licencia

[Especificar licencia si aplica]

---

## 📧 Contacto

Para preguntas o soporte:
- **Email**: [email]
- **GitHub**: [repo]

---

**Desarrollado con ⚡ y NestJS**
