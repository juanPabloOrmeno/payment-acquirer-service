import { Injectable, BadRequestException, NotFoundException } from '@nestjs/common';
import { PaymentRequestDto } from '../dto/payment-request.dto';
import { IssuerClient } from '../../../issuer/issuer.client';

@Injectable()
export class PaymentsService {

  private transactions: Map<string, any> = new Map();

  constructor(private readonly issuerClient: IssuerClient) {}

  async processPayment(dto: PaymentRequestDto) {

    if (!dto.merchantId || !dto.amount || !dto.currency) {
      throw new BadRequestException(
        'Missing required fields: merchantId, amount, currency',
      );
    }

    if (dto.amount <= 0) {
      throw new BadRequestException('Amount must be greater than zero');
    }


    const transactionId = this.generateTransactionId();

    const transaction = {
      transactionId,
      merchantId: dto.merchantId,
      amount: dto.amount,
      currency: dto.currency,
      cardToken: dto.cardToken,
      status: 'PENDING',
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    // Llamar al issuer para autorizar el pago
    const issuerResponse = await this.issuerClient.authorize(
      dto.cardToken,
      dto.amount,
      dto.currency,
    );

    console.log('Issuer response:', issuerResponse);

    // Actualizar estado según respuesta del issuer
    if (issuerResponse.status === 'APPROVED') {
      transaction.status = 'COMPLETED';
      transaction['responseCode'] = issuerResponse.responseCode;
      transaction['issuerTransactionId'] = issuerResponse.transactionId;
    } else {
      transaction.status = 'DECLINED';
      transaction['responseCode'] = issuerResponse.responseCode;
      transaction['issuerTransactionId'] = issuerResponse.transactionId;
    }

    transaction.updatedAt = new Date();

    this.transactions.set(transactionId, transaction);

    return {
      transactionId,
      status: transaction.status,
      amount: transaction.amount,
      currency: transaction.currency,
      responseCode: transaction['responseCode'],
      createdAt: transaction.createdAt,
      updatedAt: transaction.updatedAt,
    };
  }


  async getPaymentStatus(transactionId: string) {
    if (!transactionId || transactionId.trim() === '') {
      throw new BadRequestException('Transaction ID is required');
    }

    const transaction = this.transactions.get(transactionId);

    if (!transaction) {
      throw new NotFoundException(
        `Transaction with ID ${transactionId} not found`,
      );
    }

    return {
      transactionId: transaction.transactionId,
      status: transaction.status,
      amount: transaction.amount,
      currency: transaction.currency,
      responseCode: transaction.responseCode || null,
      createdAt: transaction.createdAt,
      updatedAt: transaction.updatedAt,
    };
  }


  private generateTransactionId(): string {
    return `TXN_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }
}
