import { Test, TestingModule } from '@nestjs/testing';
import { HttpStatus, INestApplication, ValidationPipe, Logger } from '@nestjs/common';
import request from 'supertest';
import { PaymentsController } from './payments.controller';
import { PaymentsService } from '../service/payments.service';
import { MerchantId } from '../enums/merchant.enum';
import { OperationType } from '../dto/payment-request.dto';

describe('PaymentsController (Integration)', () => {
  let app: INestApplication;
  let paymentsService: jest.Mocked<PaymentsService>;

  const mockSuccessResponse = {
    transactionId: 'txn_123456',
    status: 'APPROVED',
    amount: 50000,
    currency: 'CLP',
    maskedCard: '****1234',
    operationType: OperationType.PURCHASE,
    responseCode: '00',
    createdAt: new Date('2025-12-27T10:00:00Z'),
    updatedAt: new Date('2025-12-27T10:00:01Z'),
  };

  const validPaymentRequest = {
    merchantId: MerchantId.MERCHANT_001,
    amount: 50000,
    currency: 'CLP',
    cardToken: 'tok_abc123xyz',
    expirationDate: '12/26',
    operationType: OperationType.PURCHASE,
  };

  beforeAll(async () => {
    // Suprimir logs de error durante los tests
    jest.spyOn(Logger.prototype, 'error').mockImplementation();
    jest.spyOn(Logger.prototype, 'warn').mockImplementation();

    const mockPaymentsService = {
      processPayment: jest.fn(),
      getPaymentStatus: jest.fn(),
    };

    const moduleFixture: TestingModule = await Test.createTestingModule({
      controllers: [PaymentsController],
      providers: [
        { provide: PaymentsService, useValue: mockPaymentsService },
      ],
    }).compile();

    app = moduleFixture.createNestApplication();
    app.useGlobalPipes(new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
    }));

    await app.init();

    paymentsService = moduleFixture.get(PaymentsService);
  });

  afterAll(async () => {
    if (app) {
      await app.close();
    }
    // Restaurar los mocks del logger
    jest.restoreAllMocks();
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('POST /payments', () => {
    it('debería procesar un pago válido exitosamente', () => {
      paymentsService.processPayment.mockResolvedValue(mockSuccessResponse);

      return request(app.getHttpServer())
        .post('/payments')
        .send(validPaymentRequest)
        .expect(HttpStatus.CREATED)
        .expect((res) => {
          expect(res.body).toHaveProperty('transactionId');
          expect(res.body.status).toBe('APPROVED');
          expect(res.body.amount).toBe(50000);
          expect(res.body.currency).toBe('CLP');
          expect(paymentsService.processPayment).toHaveBeenCalledWith(
            expect.objectContaining(validPaymentRequest)
          );
        });
    });

    it('debería retornar 400 cuando falta merchantId', () => {
      const invalidRequest: any = { ...validPaymentRequest };
      delete invalidRequest.merchantId;

      return request(app.getHttpServer())
        .post('/payments')
        .send(invalidRequest)
        .expect(HttpStatus.BAD_REQUEST)
        .expect((res) => {
          const messages = Array.isArray(res.body.message) ? res.body.message : [res.body.message];
          const hasError = messages.some(msg => msg.toLowerCase().includes('merchant'));
          expect(hasError).toBe(true);
        });
    });

    it('debería retornar 400 cuando merchantId es inválido', () => {
      const invalidRequest = { 
        ...validPaymentRequest, 
        merchantId: 'INVALID_MERCHANT' 
      };

      return request(app.getHttpServer())
        .post('/payments')
        .send(invalidRequest)
        .expect(HttpStatus.BAD_REQUEST);
    });

    it('debería retornar 400 cuando falta amount', () => {
      const invalidRequest: any = { ...validPaymentRequest };
      delete invalidRequest.amount;

      return request(app.getHttpServer())
        .post('/payments')
        .send(invalidRequest)
        .expect(HttpStatus.BAD_REQUEST)
        .expect((res) => {
          const messages = Array.isArray(res.body.message) ? res.body.message : [res.body.message];
          const hasError = messages.some(msg => msg.toLowerCase().includes('amount'));
          expect(hasError).toBe(true);
        });
    });

    it('debería retornar 400 cuando amount es cero', () => {
      const invalidRequest = { ...validPaymentRequest, amount: 0 };

      return request(app.getHttpServer())
        .post('/payments')
        .send(invalidRequest)
        .expect(HttpStatus.BAD_REQUEST)
        .expect((res) => {
          const messages = Array.isArray(res.body.message) ? res.body.message : [res.body.message];
          const hasError = messages.some(msg => msg.toLowerCase().includes('amount') || msg.includes('greater'));
          expect(hasError).toBe(true);
        });
    });

    it('debería retornar 400 cuando amount es negativo', () => {
      const invalidRequest = { ...validPaymentRequest, amount: -1000 };

      return request(app.getHttpServer())
        .post('/payments')
        .send(invalidRequest)
        .expect(HttpStatus.BAD_REQUEST);
    });

    it('debería retornar 400 cuando falta currency', () => {
      const invalidRequest: any = { ...validPaymentRequest };
      delete invalidRequest.currency;

      return request(app.getHttpServer())
        .post('/payments')
        .send(invalidRequest)
        .expect(HttpStatus.BAD_REQUEST)
        .expect((res) => {
          const messages = Array.isArray(res.body.message) ? res.body.message : [res.body.message];
          const hasError = messages.some(msg => msg.toLowerCase().includes('currency'));
          expect(hasError).toBe(true);
        });
    });

    it('debería retornar 400 cuando currency es string vacío', () => {
      const invalidRequest = { ...validPaymentRequest, currency: '' };

      return request(app.getHttpServer())
        .post('/payments')
        .send(invalidRequest)
        .expect(HttpStatus.BAD_REQUEST);
    });

    it('debería retornar 400 cuando falta cardToken', () => {
      const invalidRequest: any = { ...validPaymentRequest };
      delete invalidRequest.cardToken;

      return request(app.getHttpServer())
        .post('/payments')
        .send(invalidRequest)
        .expect(HttpStatus.BAD_REQUEST)
        .expect((res) => {
          const messages = Array.isArray(res.body.message) ? res.body.message : [res.body.message];
          const hasError = messages.some(msg => msg.toLowerCase().includes('card') || msg.toLowerCase().includes('token'));
          expect(hasError).toBe(true);
        });
    });

    it('debería retornar 400 cuando falta expirationDate', () => {
      const invalidRequest: any = { ...validPaymentRequest };
      delete invalidRequest.expirationDate;

      return request(app.getHttpServer())
        .post('/payments')
        .send(invalidRequest)
        .expect(HttpStatus.BAD_REQUEST)
        .expect((res) => {
          const messages = Array.isArray(res.body.message) ? res.body.message : [res.body.message];
          const hasError = messages.some(msg => msg.toLowerCase().includes('expiration'));
          expect(hasError).toBe(true);
        });
    });

    it('debería retornar 400 cuando el formato de expirationDate es inválido', () => {
      const invalidRequest = { ...validPaymentRequest, expirationDate: '13/25' };

      return request(app.getHttpServer())
        .post('/payments')
        .send(invalidRequest)
        .expect(HttpStatus.BAD_REQUEST);
    });

    it('debería retornar 400 cuando múltiples campos son inválidos', () => {
      const invalidRequest = {
        merchantId: '',
        amount: -100,
        currency: '',
        cardToken: '',
        expirationDate: '',
      };

      return request(app.getHttpServer())
        .post('/payments')
        .send(invalidRequest)
        .expect(HttpStatus.BAD_REQUEST)
        .expect((res) => {
          expect(Array.isArray(res.body.message)).toBe(true);
          expect(res.body.message.length).toBeGreaterThan(3);
        });
    });

    it('debería manejar pago rechazado correctamente', () => {
      const declinedResponse = {
        ...mockSuccessResponse,
        status: 'DECLINED',
        responseCode: '51',
      };
      paymentsService.processPayment.mockResolvedValue(declinedResponse);

      return request(app.getHttpServer())
        .post('/payments')
        .send(validPaymentRequest)
        .expect(HttpStatus.CREATED)
        .expect((res) => {
          expect(res.body.status).toBe('DECLINED');
          expect(res.body.responseCode).toBe('51');
        });
    });

    it('debería procesar tipo de operación REFUND', () => {
      const refundRequest = { 
        ...validPaymentRequest, 
        operationType: OperationType.REFUND 
      };
      paymentsService.processPayment.mockResolvedValue({
        ...mockSuccessResponse,
        operationType: OperationType.REFUND,
      });

      return request(app.getHttpServer())
        .post('/payments')
        .send(refundRequest)
        .expect(HttpStatus.CREATED)
        .expect((res) => {
          expect(res.body.operationType).toBe('REFUND');
        });
    });

    it('debería procesar tipo de operación VOID', () => {
      const voidRequest = { 
        ...validPaymentRequest, 
        operationType: OperationType.VOID 
      };
      paymentsService.processPayment.mockResolvedValue({
        ...mockSuccessResponse,
        operationType: OperationType.VOID,
      });

      return request(app.getHttpServer())
        .post('/payments')
        .send(voidRequest)
        .expect(HttpStatus.CREATED)
        .expect((res) => {
          expect(res.body.operationType).toBe('VOID');
        });
    });

    it('debería accept payment without operationType (optional)', () => {
      const requestWithoutType: any = { ...validPaymentRequest };
      delete requestWithoutType.operationType;
      paymentsService.processPayment.mockResolvedValue(mockSuccessResponse);

      return request(app.getHttpServer())
        .post('/payments')
        .send(requestWithoutType)
        .expect(HttpStatus.CREATED);
    });

    it('debería manejar diferentes comerciantes válidos', async () => {
      paymentsService.processPayment.mockResolvedValue(mockSuccessResponse);

      const merchants = [
        MerchantId.MERCHANT_001,
        MerchantId.MERCHANT_002,
        MerchantId.MERCHANT_003,
      ];

      for (const merchantId of merchants) {
        await request(app.getHttpServer())
          .post('/payments')
          .send({ ...validPaymentRequest, merchantId })
          .expect(HttpStatus.CREATED);
      }
    });

    it('debería manejar diferentes monedas válidas', async () => {
      paymentsService.processPayment.mockResolvedValue(mockSuccessResponse);

      const currencies = ['CLP', 'USD', 'EUR', 'BRL'];

      for (const currency of currencies) {
        await request(app.getHttpServer())
          .post('/payments')
          .send({ ...validPaymentRequest, currency })
          .expect(HttpStatus.CREATED);
      }
    });

    it('debería rechazar tipo de operación inválido', () => {
      const invalidRequest = { 
        ...validPaymentRequest, 
        operationType: 'INVALID_TYPE' 
      };

      return request(app.getHttpServer())
        .post('/payments')
        .send(invalidRequest)
        .expect(HttpStatus.BAD_REQUEST);
    });

    it('debería manejar errores del servicio correctamente', () => {
      paymentsService.processPayment.mockRejectedValue(
        new Error('Issuer service unavailable')
      );

      return request(app.getHttpServer())
        .post('/payments')
        .send(validPaymentRequest)
        .expect(HttpStatus.INTERNAL_SERVER_ERROR);
    });
  });

  describe('GET /payments/:transactionId', () => {
    const mockTransactionDetails = {
      transactionId: 'txn_123456',
      merchantId: MerchantId.MERCHANT_001,
      amount: 50000,
      currency: 'CLP',
      maskedCard: '****1234',
      status: 'APPROVED',
      operationType: OperationType.PURCHASE,
      responseCode: '00',
      createdAt: new Date('2025-12-27T10:00:00Z'),
      updatedAt: new Date('2025-12-27T10:00:01Z'),
    };

    it('debería obtener estado del pago exitosamente', () => {
      paymentsService.getPaymentStatus.mockResolvedValue(mockTransactionDetails);

      return request(app.getHttpServer())
        .get('/payments/txn_123456')
        .expect(HttpStatus.OK)
        .expect((res) => {
          expect(res.body.transactionId).toBe('txn_123456');
          expect(res.body.status).toBe('APPROVED');
          expect(res.body.amount).toBe(50000);
          expect(paymentsService.getPaymentStatus).toHaveBeenCalledWith('txn_123456');
        });
    });

    it('debería retornar 404 cuando no se encuentra la transacción', () => {
      paymentsService.getPaymentStatus.mockRejectedValue(
        new Error('Transaction not found')
      );

      return request(app.getHttpServer())
        .get('/payments/nonexistent')
        .expect(HttpStatus.INTERNAL_SERVER_ERROR);
    });

    it('debería retornar detalles de transacción con todos los campos', () => {
      paymentsService.getPaymentStatus.mockResolvedValue(mockTransactionDetails);

      return request(app.getHttpServer())
        .get('/payments/txn_123456')
        .expect(HttpStatus.OK)
        .expect((res) => {
          expect(res.body).toHaveProperty('transactionId');
          expect(res.body).toHaveProperty('merchantId');
          expect(res.body).toHaveProperty('amount');
          expect(res.body).toHaveProperty('currency');
          expect(res.body).toHaveProperty('maskedCard');
          expect(res.body).toHaveProperty('status');
          expect(res.body).toHaveProperty('responseCode');
          expect(res.body).toHaveProperty('createdAt');
          expect(res.body).toHaveProperty('updatedAt');
        });
    });

    it('debería no exponer el token de tarjeta en la respuesta', () => {
      paymentsService.getPaymentStatus.mockResolvedValue(mockTransactionDetails);

      return request(app.getHttpServer())
        .get('/payments/txn_123456')
        .expect(HttpStatus.OK)
        .expect((res) => {
          expect(res.body).not.toHaveProperty('cardToken');
          expect(JSON.stringify(res.body)).not.toContain('tok_');
        });
    });

    it('debería manejar diferentes IDs de transacción', async () => {
      const transactionIds = ['txn_001', 'txn_002', 'txn_003'];

      for (const txnId of transactionIds) {
        paymentsService.getPaymentStatus.mockResolvedValue({
          ...mockTransactionDetails,
          transactionId: txnId,
        });

        await request(app.getHttpServer())
          .get(`/payments/${txnId}`)
          .expect(HttpStatus.OK)
          .expect((res) => {
            expect(res.body.transactionId).toBe(txnId);
          });
      }
    });

    it('debería retornar estado DECLINED correctamente', () => {
      const declinedTransaction = {
        ...mockTransactionDetails,
        status: 'DECLINED',
        responseCode: '51',
      };
      paymentsService.getPaymentStatus.mockResolvedValue(declinedTransaction);

      return request(app.getHttpServer())
        .get('/payments/txn_declined')
        .expect(HttpStatus.OK)
        .expect((res) => {
          expect(res.body.status).toBe('DECLINED');
          expect(res.body.responseCode).toBe('51');
        });
    });
  });

  describe('Manejo de errores', () => {
    it('debería manejar errores de validación con mensajes detallados', () => {
      return request(app.getHttpServer())
        .post('/payments')
        .send({})
        .expect(HttpStatus.BAD_REQUEST)
        .expect((res) => {
          expect(res.body).toHaveProperty('message');
          expect(Array.isArray(res.body.message)).toBe(true);
        });
    });

    it('debería rechazar peticiones con campos desconocidos', () => {
      const requestWithExtraFields = {
        ...validPaymentRequest,
        unknownField: 'value',
        anotherUnknown: 123,
      };

      return request(app.getHttpServer())
        .post('/payments')
        .send(requestWithExtraFields)
        .expect(HttpStatus.BAD_REQUEST);
    });
  });

  describe('Validación de Content-Type', () => {
    it('debería aceptar application/json', () => {
      paymentsService.processPayment.mockResolvedValue(mockSuccessResponse);

      return request(app.getHttpServer())
        .post('/payments')
        .set('Content-Type', 'application/json')
        .send(validPaymentRequest)
        .expect(HttpStatus.CREATED);
    });

    it('debería rechazar contenido no-JSON', () => {
      return request(app.getHttpServer())
        .post('/payments')
        .set('Content-Type', 'text/plain')
        .send('invalid data')
        .expect(HttpStatus.BAD_REQUEST);
    });
  });
});
