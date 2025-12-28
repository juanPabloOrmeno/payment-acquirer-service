export enum MerchantId {
  MERCHANT_001 = 'MERCHANT_001',
  MERCHANT_002 = 'MERCHANT_002',
  MERCHANT_003 = 'MERCHANT_003',
  MERCHANT_004 = 'MERCHANT_004',
  MERCHANT_005 = 'MERCHANT_005',
}

export interface MerchantConfig {
  id: MerchantId;
  name: string;
  maxAmount: number;
  currency: string;
}

export const MERCHANT_CONFIGS: Record<MerchantId, MerchantConfig> = {
  [MerchantId.MERCHANT_001]: {
    id: MerchantId.MERCHANT_001,
    name: 'Banco Estado',
    maxAmount: 1000000,
    currency: 'CLP',
  },
  [MerchantId.MERCHANT_002]: {
    id: MerchantId.MERCHANT_002,
    name: 'Banco Santander',
    maxAmount: 2000000,
    currency: 'CLP',
  },
  [MerchantId.MERCHANT_003]: {
    id: MerchantId.MERCHANT_003,
    name: 'Banco de Chile',
    maxAmount: 1500000,
    currency: 'CLP',
  },
  [MerchantId.MERCHANT_004]: {
    id: MerchantId.MERCHANT_004,
    name: 'Banco BCI',
    maxAmount: 1800000,
    currency: 'CLP',
  },
  [MerchantId.MERCHANT_005]: {
    id: MerchantId.MERCHANT_005,
    name: 'Banco Itaú',
    maxAmount: 2500000,
    currency: 'CLP',
  },
};

export class MerchantValidator {
  /**
   * Valida si un merchantId es válido
   */
  static isValidMerchant(merchantId: string): boolean {
    return Object.values(MerchantId).includes(merchantId as MerchantId);
  }

  /**
   * Obtiene la configuración de un merchant
   */
  static getMerchantConfig(merchantId: string): MerchantConfig | null {
    if (!this.isValidMerchant(merchantId)) {
      return null;
    }
    return MERCHANT_CONFIGS[merchantId as MerchantId];
  }

  /**
   * Valida si el monto está dentro del límite del merchant
   */
  static validateAmount(merchantId: string, amount: number): {
    valid: boolean;
    maxAmount?: number;
    message?: string;
  } {
    const config = this.getMerchantConfig(merchantId);

    if (!config) {
      return {
        valid: false,
        message: 'Invalid merchant ID',
      };
    }

    if (amount > config.maxAmount) {
      return {
        valid: false,
        maxAmount: config.maxAmount,
        message: `Amount exceeds maximum limit of ${config.maxAmount} ${config.currency} for ${config.name}`,
      };
    }

    return { valid: true };
  }
}
