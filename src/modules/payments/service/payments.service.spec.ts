import { Test, TestingModule } from '@nestjs/testing';
import { BadRequestException, NotFoundException, HttpException, HttpStatus } from '@nestjs/common';
import { PaymentsService } from './payments.service';
import { IssuerClient } from '../../../issuer/issuer.client';
import { PaymentRequestDto, OperationType } from '../dto/payment-request.dto';
import { MerchantId } from '../enums/merchant.enum';
import { AppLoggerService } from '../../../common/logger/logger.service';
import { IssuerResponseDto } from '../dto/issuer-response.dto';

describe('PaymentsService', () => {
  let service: PaymentsService;
  let issuerClient: jest.Mocked<IssuerClient>;
  let logger: jest.Mocked<AppLoggerService>;

  const mockIssuerResponse: IssuerResponseDto = {
    transactionId: 'txn_123456',
    status: 'APPROVED',
    responseCode: '00',
    createdAt: new Date('2025-12-27T10:00:00Z'),
  };

  const validPaymentRequest: PaymentRequestDto = {
    merchantId: MerchantId.MERCHANT_001,
    amount: 50000,
    currency: 'CLP',
    cardToken: 'tok_abc123xyz',
    expirationDate: '12/26',
    operationType: OperationType.PURCHASE,
  };

  beforeEach(async () => {
    const mockIssuerClient = {
      authorize: jest.fn(),
      getPaymentStatus: jest.fn(),
    };

    const mockLogger = {
      log: jest.fn(),
      error: jest.fn(),
      warn: jest.fn(),
      debug: jest.fn(),
      logOperationStart: jest.fn(),
      logOperationSuccess: jest.fn(),
      logOperationFailure: jest.fn(),
      logHttpRequest: jest.fn(),
      logHttpResponse: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        PaymentsService,
        { provide: IssuerClient, useValue: mockIssuerClient },
        { provide: AppLoggerService, useValue: mockLogger },
      ],
    }).compile();

    service = module.get<PaymentsService>(PaymentsService);
    issuerClient = module.get(IssuerClient);
    logger = module.get(AppLoggerService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('processPayment', () => {
    it('debería procesar un pago válido exitosamente', async () => {
      issuerClient.authorize.mockResolvedValue(mockIssuerResponse);

      const result = await service.processPayment(validPaymentRequest);

      expect(result).toBeDefined();
      expect(result.transactionId).toBe('txn_123456');
      expect(result.status).toBe('APPROVED');
      expect(result.responseCode).toBe('00');
      expect(result.amount).toBe(50000);
      expect(result.currency).toBe('CLP');
      expect(result.maskedCard).toContain('*');
      expect(result.operationType).toBe(OperationType.PURCHASE);
      
      expect(issuerClient.authorize).toHaveBeenCalledWith(
        validPaymentRequest.merchantId,
        validPaymentRequest.cardToken,
        validPaymentRequest.amount,
        validPaymentRequest.currency,
        validPaymentRequest.expirationDate,
      );

      expect(logger.logOperationStart).toHaveBeenCalled();
      expect(logger.logOperationSuccess).toHaveBeenCalled();
    });

    it('debería lanzar BadRequestException cuando falta merchantId', async () => {
      const invalidDto = { ...validPaymentRequest, merchantId: null as any };

      await expect(service.processPayment(invalidDto)).rejects.toThrow(BadRequestException);
      await expect(service.processPayment(invalidDto)).rejects.toThrow(
        'Missing required fields: merchantId, amount, currency'
      );
      expect(logger.warn).toHaveBeenCalled();
    });

    it('debería lanzar BadRequestException cuando falta amount', async () => {
      const invalidDto = { ...validPaymentRequest, amount: null as any };

      await expect(service.processPayment(invalidDto)).rejects.toThrow(BadRequestException);
      expect(logger.warn).toHaveBeenCalled();
    });

    it('debería lanzar BadRequestException cuando falta currency', async () => {
      const invalidDto = { ...validPaymentRequest, currency: null as any };

      await expect(service.processPayment(invalidDto)).rejects.toThrow(BadRequestException);
      expect(logger.warn).toHaveBeenCalled();
    });

    it('debería lanzar BadRequestException cuando amount es cero', async () => {
      const invalidDto = { ...validPaymentRequest, amount: 0 };

      await expect(service.processPayment(invalidDto)).rejects.toThrow(BadRequestException);
      // Amount 0 triggers the "missing required fields" check first due to falsy value
    });

    it('debería lanzar BadRequestException cuando amount es negativo', async () => {
      const invalidDto = { ...validPaymentRequest, amount: -1000 };

      await expect(service.processPayment(invalidDto)).rejects.toThrow(BadRequestException);
    });

    it('debería lanzar BadRequestException por token de tarjeta inválido', async () => {
      const invalidDto = { ...validPaymentRequest, cardToken: 'invalid' };

      await expect(service.processPayment(invalidDto)).rejects.toThrow(BadRequestException);
      expect(logger.warn).toHaveBeenCalledWith(
        'Card token validation failed',
        expect.any(String),
        expect.any(Object)
      );
    });

    it('debería lanzar BadRequestException por tarjeta expirada', async () => {
      const invalidDto = { ...validPaymentRequest, expirationDate: '12/20' };

      await expect(service.processPayment(invalidDto)).rejects.toThrow(BadRequestException);
      await expect(service.processPayment(invalidDto)).rejects.toThrow(
        'Card has expired or expiration date is invalid'
      );
    });

    it('debería lanzar BadRequestException por comerciante inválido', async () => {
      const invalidDto = { 
        ...validPaymentRequest, 
        merchantId: 'INVALID_MERCHANT' as any 
      };

      await expect(service.processPayment(invalidDto)).rejects.toThrow(BadRequestException);
    });

    it('debería lanzar BadRequestException cuando amount excede el límite del comerciante', async () => {
      const invalidDto = { 
        ...validPaymentRequest, 
        merchantId: MerchantId.MERCHANT_001,
        amount: 10000000 // Exceeds limit
      };

      await expect(service.processPayment(invalidDto)).rejects.toThrow(BadRequestException);
      expect(logger.warn).toHaveBeenCalledWith(
        'Merchant validation failed',
        expect.any(String),
        expect.any(Object)
      );
    });

    it('debería manejar pago rechazado del emisor', async () => {
      const declinedResponse: IssuerResponseDto = {
        transactionId: 'txn_declined',
        status: 'DECLINED',
        responseCode: '51',
        createdAt: new Date(),
      };
      issuerClient.authorize.mockResolvedValue(declinedResponse);

      const result = await service.processPayment(validPaymentRequest);

      expect(result.status).toBe('DECLINED');
      expect(result.responseCode).toBe('51');
      expect(result.transactionId).toBe('txn_declined');
    });

    it('debería manejar diferentes tipos de operación', async () => {
      issuerClient.authorize.mockResolvedValue(mockIssuerResponse);

      const refundDto = { ...validPaymentRequest, operationType: OperationType.REFUND };
      const result = await service.processPayment(refundDto);

      expect(result.operationType).toBe(OperationType.REFUND);
    });

    it('debería usar PURCHASE por defecto cuando operationType no está especificado', async () => {
      issuerClient.authorize.mockResolvedValue(mockIssuerResponse);

      const dtoWithoutType = { ...validPaymentRequest };
      delete dtoWithoutType.operationType;
      
      const result = await service.processPayment(dtoWithoutType);

      expect(result.operationType).toBe(OperationType.PURCHASE);
    });

    it('debería relanzar errores del servicio emisor', async () => {
      const issuerError = new HttpException('Issuer service unavailable', HttpStatus.SERVICE_UNAVAILABLE);
      issuerClient.authorize.mockRejectedValue(issuerError);

      await expect(service.processPayment(validPaymentRequest)).rejects.toThrow(issuerError);
      expect(logger.logOperationFailure).toHaveBeenCalled();
    });

    it('debería procesar pagos con diferentes comerciantes', async () => {
      issuerClient.authorize.mockResolvedValue(mockIssuerResponse);

      const merchants = [
        MerchantId.MERCHANT_001,
        MerchantId.MERCHANT_002,
        MerchantId.MERCHANT_003,
      ];

      for (const merchantId of merchants) {
        const dto = { ...validPaymentRequest, merchantId };
        const result = await service.processPayment(dto);
        expect(result.transactionId).toBeDefined();
      }
    });

    it('debería procesar pagos con diferentes monedas', async () => {
      issuerClient.authorize.mockResolvedValue(mockIssuerResponse);

      const currencies = ['CLP', 'USD', 'EUR', 'BRL'];

      for (const currency of currencies) {
        const dto = { ...validPaymentRequest, currency };
        const result = await service.processPayment(dto);
        expect(result.currency).toBe(currency);
      }
    });

    it('debería enmascarar el token de tarjeta correctamente', async () => {
      issuerClient.authorize.mockResolvedValue(mockIssuerResponse);

      const result = await service.processPayment(validPaymentRequest);

      // El masking puede variar dependiendo de la longitud del token
      expect(result.maskedCard).toContain('*');
      expect(result.maskedCard).not.toContain('tok_abc123');
    });

    it('debería almacenar transacción en memoria', async () => {
      issuerClient.authorize.mockResolvedValue(mockIssuerResponse);

      const result = await service.processPayment(validPaymentRequest);
      const storedTransaction = await service.getPaymentStatus(result.transactionId);

      expect(storedTransaction).toBeDefined();
      expect(storedTransaction.transactionId).toBe(result.transactionId);
    });
  });

  describe('getPaymentStatus', () => {
    beforeEach(async () => {
      issuerClient.authorize.mockResolvedValue(mockIssuerResponse);
      await service.processPayment(validPaymentRequest);
    });

    it('debería recuperar el estado del pago exitosamente', async () => {
      const result = await service.getPaymentStatus('txn_123456');

      expect(result).toBeDefined();
      expect(result.transactionId).toBe('txn_123456');
      expect(result.status).toBe('APPROVED');
      expect(logger.logOperationStart).toHaveBeenCalledWith(
        'getPaymentStatus',
        expect.any(String),
        expect.any(Object)
      );
    });

    it('debería lanzar BadRequestException cuando transactionId está vacío', async () => {
      await expect(service.getPaymentStatus('')).rejects.toThrow(BadRequestException);
      await expect(service.getPaymentStatus('')).rejects.toThrow('Transaction ID is required');
    });

    it('debería lanzar BadRequestException cuando transactionId es espacio en blanco', async () => {
      await expect(service.getPaymentStatus('   ')).rejects.toThrow(BadRequestException);
    });

    it('debería lanzar NotFoundException cuando la transacción no existe', async () => {
      await expect(service.getPaymentStatus('nonexistent_txn')).rejects.toThrow(NotFoundException);
      await expect(service.getPaymentStatus('nonexistent_txn')).rejects.toThrow(
        'Transaction nonexistent_txn not found'
      );
    });

    it('debería retornar detalles completos de la transacción', async () => {
      const result = await service.getPaymentStatus('txn_123456');

      expect(result).toHaveProperty('transactionId');
      expect(result).toHaveProperty('amount');
      expect(result).toHaveProperty('currency');
      expect(result).toHaveProperty('maskedCard');
      expect(result).toHaveProperty('status');
      expect(result).toHaveProperty('responseCode');
      expect(result).toHaveProperty('createdAt');
      expect(result).toHaveProperty('updatedAt');
    });

    it('debería no exponer el token de tarjeta en la respuesta', async () => {
      const result = await service.getPaymentStatus('txn_123456');

      expect(result).not.toHaveProperty('cardToken');
      expect(JSON.stringify(result)).not.toContain('tok_abc123');
    });
  });

  describe('Almacenamiento de transacciones', () => {
    it('debería almacenar múltiples transacciones independientemente', async () => {
      const response1: IssuerResponseDto = {
        transactionId: 'txn_001',
        status: 'APPROVED',
        responseCode: '00',
        createdAt: new Date(),
      };

      const response2: IssuerResponseDto = {
        transactionId: 'txn_002',
        status: 'DECLINED',
        responseCode: '51',
        createdAt: new Date(),
      };

      issuerClient.authorize
        .mockResolvedValueOnce(response1)
        .mockResolvedValueOnce(response2);

      await service.processPayment(validPaymentRequest);
      await service.processPayment({ ...validPaymentRequest, amount: 10000 });

      const txn1 = await service.getPaymentStatus('txn_001');
      const txn2 = await service.getPaymentStatus('txn_002');

      expect(txn1.transactionId).toBe('txn_001');
      expect(txn1.status).toBe('APPROVED');
      expect(txn2.transactionId).toBe('txn_002');
      expect(txn2.status).toBe('DECLINED');
    });
  });
});
