import { Injectable } from '@nestjs/common';
import { IssuerResponseDto } from 'src/modules/payments/dto/issuer-response.dto';
import { IssuerPort } from 'src/modules/payments/ports/IssuerPort';

@Injectable()
export class IssuerClient implements IssuerPort {
  private generateTransactionId(): string {
    return `ISS_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  async authorize(
    cardToken: string,
    amount: number,
    currency: string
  ): Promise<IssuerResponseDto> {
    const transactionId = this.generateTransactionId();
    const now = new Date();

    // Simulación de reglas del banco
    if (amount > 1_000_000) {
      return new IssuerResponseDto(
        transactionId,
        'DECLINED',
        'LIMIT_EXCEEDED',
        now
      );
    }

    if (cardToken.endsWith('999')) {
      return new IssuerResponseDto(
        transactionId,
        'DECLINED',
        'CARD_BLOCKED',
        now
      );
    }

    // Aprobación aleatoria (80% aprobado, 20% rechazado)
    const approved = Math.random() > 0.2;

    return new IssuerResponseDto(
      transactionId,
      approved ? 'APPROVED' : 'DECLINED',
      approved ? '00' : '05',
      now
    );
  }
}
