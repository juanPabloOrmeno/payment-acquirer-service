import { validate } from 'class-validator';
import { PaymentRequestDto, OperationType } from './payment-request.dto';
import { MerchantId } from '../enums/merchant.enum';

describe('Validación de PaymentRequestDto', () => {
  let dto: PaymentRequestDto;

  beforeEach(() => {
    dto = new PaymentRequestDto();
    dto.merchantId = MerchantId.MERCHANT_001;
    dto.amount = 50000;
    dto.currency = 'CLP';
    dto.cardToken = 'tok_abc123xyz';
    dto.expirationDate = '12/26';
    dto.operationType = OperationType.PURCHASE;
  });

  describe('DTO Válido', () => {
    it('debería pasar la validación con todos los campos válidos', async () => {
      const errors = await validate(dto);
      expect(errors.length).toBe(0);
    });

    it('debería pasar la validación con operationType opcional', async () => {
      delete dto.operationType;
      const errors = await validate(dto);
      expect(errors.length).toBe(0);
    });
  });

  describe('validación de merchantId', () => {
    it('debería fallar cuando merchantId está vacío', async () => {
      dto.merchantId = '' as any;
      const errors = await validate(dto);
      expect(errors.length).toBeGreaterThan(0);
      expect(errors[0].property).toBe('merchantId');
      expect(errors[0].constraints?.isNotEmpty).toBeDefined();
    });

    it('debería fallar cuando merchantId no es un valor de enum válido', async () => {
      dto.merchantId = 'INVALID_MERCHANT' as any;
      const errors = await validate(dto);
      expect(errors.length).toBeGreaterThan(0);
      expect(errors[0].property).toBe('merchantId');
      expect(errors[0].constraints?.isEnum).toBeDefined();
    });

    it('debería pasar con todos los IDs de comerciante válidos', async () => {
      const validMerchants = [
        MerchantId.MERCHANT_001,
        MerchantId.MERCHANT_002,
        MerchantId.MERCHANT_003,
        MerchantId.MERCHANT_004,
        MerchantId.MERCHANT_005,
      ];

      for (const merchantId of validMerchants) {
        dto.merchantId = merchantId;
        const errors = await validate(dto);
        expect(errors.length).toBe(0);
      }
    });
  });

  describe('validación de amount', () => {
    it('debería fallar cuando amount es null', async () => {
      dto.amount = null as any;
      const errors = await validate(dto);
      expect(errors.length).toBeGreaterThan(0);
      expect(errors[0].property).toBe('amount');
    });

    it('debería fallar cuando amount es cero', async () => {
      dto.amount = 0;
      const errors = await validate(dto);
      expect(errors.length).toBeGreaterThan(0);
      expect(errors[0].property).toBe('amount');
      expect(errors[0].constraints?.isPositive).toBeDefined();
    });

    it('debería fallar cuando amount es negativo', async () => {
      dto.amount = -1000;
      const errors = await validate(dto);
      expect(errors.length).toBeGreaterThan(0);
      expect(errors[0].property).toBe('amount');
      expect(errors[0].constraints?.isPositive).toBeDefined();
    });

    it('debería fallar cuando amount no es un número', async () => {
      dto.amount = 'invalid' as any;
      const errors = await validate(dto);
      expect(errors.length).toBeGreaterThan(0);
      expect(errors[0].property).toBe('amount');
      expect(errors[0].constraints?.isNumber).toBeDefined();
    });

    it('debería pasar con montos positivos válidos', async () => {
      const validAmounts = [1, 100, 1000, 50000, 1000000];
      for (const amount of validAmounts) {
        dto.amount = amount;
        const errors = await validate(dto);
        expect(errors.length).toBe(0);
      }
    });
  });

  describe('validación de currency', () => {
    it('debería fallar cuando currency está vacío', async () => {
      dto.currency = '';
      const errors = await validate(dto);
      expect(errors.length).toBeGreaterThan(0);
      expect(errors[0].property).toBe('currency');
    });

    it('debería fallar cuando currency es null', async () => {
      dto.currency = null as any;
      const errors = await validate(dto);
      expect(errors.length).toBeGreaterThan(0);
      expect(errors[0].property).toBe('currency');
    });

    it('debería pasar con códigos de moneda válidos', async () => {
      const validCurrencies = ['CLP', 'USD', 'EUR', 'BRL'];
      for (const currency of validCurrencies) {
        dto.currency = currency;
        const errors = await validate(dto);
        expect(errors.length).toBe(0);
      }
    });
  });

  describe('validación de cardToken', () => {
    it('debería fallar cuando cardToken está vacío', async () => {
      dto.cardToken = '';
      const errors = await validate(dto);
      expect(errors.length).toBeGreaterThan(0);
      expect(errors[0].property).toBe('cardToken');
    });

    it('debería fallar cuando cardToken es null', async () => {
      dto.cardToken = null as any;
      const errors = await validate(dto);
      expect(errors.length).toBeGreaterThan(0);
      expect(errors[0].property).toBe('cardToken');
    });

    it('debería pasar con tokens de tarjeta válidos', async () => {
      const validTokens = ['tok_abc123', 'tok_xyz789', 'token_12345678'];
      for (const token of validTokens) {
        dto.cardToken = token;
        const errors = await validate(dto);
        expect(errors.length).toBe(0);
      }
    });
  });

  describe('validación de expirationDate', () => {
    it('debería fallar cuando expirationDate está vacío', async () => {
      dto.expirationDate = '';
      const errors = await validate(dto);
      expect(errors.length).toBeGreaterThan(0);
      expect(errors[0].property).toBe('expirationDate');
    });

    it('debería fallar cuando el formato de expirationDate es inválido', async () => {
      dto.expirationDate = '13/25'; // Invalid month
      const errors = await validate(dto);
      expect(errors.length).toBeGreaterThan(0);
      expect(errors[0].property).toBe('expirationDate');
      expect(errors[0].constraints?.matches).toBeDefined();
    });

    it('debería fallar cuando expirationDate tiene formato incorrecto', async () => {
      const invalidFormats = ['1/25', '12-26', '2025/12', '12/2025'];
      for (const format of invalidFormats) {
        dto.expirationDate = format;
        const errors = await validate(dto);
        expect(errors.length).toBeGreaterThan(0);
      }
    });

    it('debería pasar con fechas de expiración válidas', async () => {
      const validDates = ['01/25', '12/26', '06/30', '11/29'];
      for (const date of validDates) {
        dto.expirationDate = date;
        const errors = await validate(dto);
        expect(errors.length).toBe(0);
      }
    });
  });

  describe('validación de operationType', () => {
    it('debería fallar cuando operationType es inválido', async () => {
      dto.operationType = 'INVALID_TYPE' as any;
      const errors = await validate(dto);
      expect(errors.length).toBeGreaterThan(0);
      expect(errors[0].property).toBe('operationType');
      expect(errors[0].constraints?.isEnum).toBeDefined();
    });

    it('debería pasar con todos los tipos de operación válidos', async () => {
      const validTypes = [
        OperationType.PURCHASE,
        OperationType.REFUND,
        OperationType.VOID,
      ];

      for (const type of validTypes) {
        dto.operationType = type;
        const errors = await validate(dto);
        expect(errors.length).toBe(0);
      }
    });
  });

  describe('Multiple field validation', () => {
    it('should report multiple validation errors simultaneously', async () => {
      dto.merchantId = '' as any;
      dto.amount = -100;
      dto.currency = '';
      dto.cardToken = '';
      dto.expirationDate = '';

      const errors = await validate(dto);
      expect(errors.length).toBeGreaterThan(3);
      
      const properties = errors.map(e => e.property);
      expect(properties).toContain('merchantId');
      expect(properties).toContain('amount');
      expect(properties).toContain('currency');
      expect(properties).toContain('cardToken');
      expect(properties).toContain('expirationDate');
    });
  });
});
