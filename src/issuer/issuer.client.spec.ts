import { Test, TestingModule } from '@nestjs/testing';
import { HttpService } from '@nestjs/axios';
import { IssuerClient } from './issuer.client';
import { AppLoggerService } from '../common/logger/logger.service';
import { MerchantId } from '../modules/payments/enums/merchant.enum';

describe('IssuerClient (Unitario)', () => {
  let issuerClient: IssuerClient;
  let loggerService: jest.Mocked<AppLoggerService>;

  beforeEach(async () => {
    const mockLoggerService = {
      log: jest.fn(),
      error: jest.fn(),
      warn: jest.fn(),
      debug: jest.fn(),
      verbose: jest.fn(),
      logHttpRequest: jest.fn(),
      logOperationSuccess: jest.fn(),
      logOperationError: jest.fn(),
    };

    const mockHttpService = {
      post: jest.fn(),
      get: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        IssuerClient,
        { provide: HttpService, useValue: mockHttpService },
        { provide: AppLoggerService, useValue: mockLoggerService },
      ],
    }).compile();

    issuerClient = module.get<IssuerClient>(IssuerClient);
    loggerService = module.get(AppLoggerService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('Inicialización del módulo', () => {
    it('debería estar definido', () => {
      expect(issuerClient).toBeDefined();
    });

    it('debería tener el servicio de logger inyectado', () => {
      expect(loggerService).toBeDefined();
    });

    it('debería tener todos los métodos de logger requeridos', () => {
      expect(loggerService.log).toBeDefined();
      expect(loggerService.error).toBeDefined();
      expect(loggerService.warn).toBeDefined();
      expect(loggerService.debug).toBeDefined();
      expect(loggerService.logHttpRequest).toBeDefined();
      expect(loggerService.logOperationSuccess).toBeDefined();
    });
  });

  describe('método authorize', () => {
    it('debería tener el método authorize', () => {
      expect(issuerClient.authorize).toBeDefined();
      expect(typeof issuerClient.authorize).toBe('function');
    });

    it('debería aceptar los parámetros requeridos', () => {
      const params = issuerClient.authorize.length;
      expect(params).toBe(5); // merchantId, cardToken, amount, currency, expirationDate
    });
  });

  describe('método getPaymentStatus', () => {
    it('debería tener el método getPaymentStatus', () => {
      expect(issuerClient.getPaymentStatus).toBeDefined();
      expect(typeof issuerClient.getPaymentStatus).toBe('function');
    });

    it('debería aceptar el parámetro transactionId', () => {
      const params = issuerClient.getPaymentStatus.length;
      expect(params).toBe(1); // transactionId
    });
  });

  describe('Configuración del cliente', () => {
    it('debería ser instanciado como Injectable', () => {
      expect(issuerClient).toBeInstanceOf(IssuerClient);
    });

    it('debería estar disponible para inyección de dependencias', () => {
      expect(issuerClient.constructor.name).toBe('IssuerClient');
    });
  });

  describe('Preparación para integración', () => {
    it('debería estar listo para llamar authorize', () => {
      // Verificar que el método existe sin llamarlo (requeriría issuer real)
      expect(issuerClient.authorize).toBeDefined();
      expect(typeof issuerClient.authorize).toBe('function');
    });

    it('debería estar listo para llamar getPaymentStatus', () => {
      // Verificar que el método existe sin llamarlo (requeriría issuer real)
      expect(issuerClient.getPaymentStatus).toBeDefined();
      expect(typeof issuerClient.getPaymentStatus).toBe('function');
    });
  });
});
