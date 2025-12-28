import * as crypto from 'crypto';

export interface CardTokenValidationResult {
  valid: boolean;
  error?: string;
}

export class CryptoUtil {
  private static readonly MIN_TOKEN_LENGTH = 10;
  private static readonly TOKEN_REGEX = /^[A-Za-z0-9_]+$/;
  private static readonly BLOCKED_CARD_SUFFIX = '999';
  private static readonly INVALID_CARD_PATTERN = '0000';

  /**
   * Valida un token de tarjeta (PAN tokenizado) según reglas de seguridad
   * @param token El token a validar
   * @returns Resultado de validación con mensaje de error si aplica
   */
  static validateCardToken(token: string): CardTokenValidationResult {
    // 1. El token NO puede ser nulo ni vacío
    if (!token || token.trim() === '') {
      return {
        valid: false,
        error: 'Card token cannot be null or empty',
      };
    }

    // 2. El token debe tener al menos 10 caracteres
    if (token.length < this.MIN_TOKEN_LENGTH) {
      return {
        valid: false,
        error: `Card token must be at least ${this.MIN_TOKEN_LENGTH} characters long`,
      };
    }

    // 3. El token solo puede contener letras (A–Z, a–z), números (0–9) y guiones bajos (_)
    if (!this.TOKEN_REGEX.test(token)) {
      return {
        valid: false,
        error: 'Card token can only contain letters, numbers, and underscores',
      };
    }

    // 4. El token NO puede terminar en "999" (simula tarjeta bloqueada)
    if (token.endsWith(this.BLOCKED_CARD_SUFFIX)) {
      return {
        valid: false,
        error: 'Card is blocked - token ends with blocked pattern',
      };
    }

    // 5. El token NO puede contener "0000" (simula tarjeta inválida)
    if (token.includes(this.INVALID_CARD_PATTERN)) {
      return {
        valid: false,
        error: 'Invalid card token - contains invalid pattern',
      };
    }

    return { valid: true };
  }

  /**
   * Valida el monto de la transacción
   * @param amount Monto de la transacción
   * @param maxLimit Límite máximo configurable
   * @returns Resultado de validación
   */
  static validateTransactionAmount(
    amount: number,
    maxLimit: number = 1000000,
  ): CardTokenValidationResult {
    // 6. El monto de la transacción debe ser mayor a 0
    if (amount <= 0) {
      return {
        valid: false,
        error: 'Transaction amount must be greater than zero',
      };
    }

    // 7. El monto NO puede superar un límite configurable
    if (amount > maxLimit) {
      return {
        valid: false,
        error: `Transaction amount exceeds maximum limit of ${maxLimit}`,
      };
    }

    return { valid: true };
  }

  /**
   * Hashea un PAN (Primary Account Number) usando SHA-256
   * @param pan El número de tarjeta a hashear
   * @returns El hash del PAN en formato hexadecimal
   */
  static hashPAN(pan: string): string {
    if (!pan) {
      throw new Error('PAN cannot be empty');
    }

    // Remover espacios y guiones si los hay
    const cleanPan = pan.replace(/[\s-]/g, '');

    // Crear hash SHA-256
    const hash = crypto.createHash('sha256');
    hash.update(cleanPan);

    return hash.digest('hex');
  }

  /**
   * Valida el formato de fecha de expiración MM/YY
   * @param expirationDate Fecha en formato MM/YY
   * @returns true si es válida y no está expirada
   */
  static validateExpirationDate(expirationDate: string): boolean {
    const regex = /^(0[1-9]|1[0-2])\/([0-9]{2})$/;

    if (!regex.test(expirationDate)) {
      return false;
    }

    const [month, year] = expirationDate.split('/');
    const currentDate = new Date();
    const currentYear = currentDate.getFullYear() % 100; // Últimos 2 dígitos
    const currentMonth = currentDate.getMonth() + 1; // 1-12

    const expYear = parseInt(year, 10);
    const expMonth = parseInt(month, 10);

    // Verificar si la tarjeta está expirada
    if (expYear < currentYear) {
      return false;
    }

    if (expYear === currentYear && expMonth < currentMonth) {
      return false;
    }

    return true;
  }

  /**
   * Enmascara un PAN mostrando solo los últimos 4 dígitos
   * @param pan El PAN a enmascarar
   * @returns PAN enmascarado (ej: ****1234)
   */
  static maskPAN(pan: string): string {
    if (!pan || pan.length < 4) {
      return '****';
    }

    const cleanPan = pan.replace(/[\s-]/g, '');
    const lastFour = cleanPan.slice(-4);

    return `****${lastFour}`;
  }
}
