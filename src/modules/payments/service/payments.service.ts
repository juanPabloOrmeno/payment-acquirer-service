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

    // Llamar al issuer para autorizar el pago
    const issuerResponse = await this.issuerClient.authorize(
        dto.merchantId,
        dto.cardToken,
        dto.amount,
        dto.currency,
        dto.expirationDate,
    );

    const transactionId = issuerResponse.transactionId;

    const transaction = {
      transactionId,
      merchantId: dto.merchantId,
      amount: dto.amount,
      currency: dto.currency,
      cardToken: dto.cardToken,
      status: issuerResponse.status === 'APPROVED' ? 'COMPLETED' : 'DECLINED',
      responseCode: issuerResponse.responseCode,
      createdAt: issuerResponse.createdAt,
      updatedAt: new Date(),
    };

    this.transactions.set(transactionId, transaction);

    return {
      transactionId,
      status: transaction.status,
      amount: transaction.amount,
      currency: transaction.currency,
      responseCode: transaction.responseCode,
      createdAt: transaction.createdAt,
      updatedAt: transaction.updatedAt,
    };
  }


  async getPaymentStatus(transactionId: string) {
    if (!transactionId || transactionId.trim() === '') {
      throw new BadRequestException('Transaction ID is required');
    }

    // Consultar al issuer para obtener el estado actualizado
    const issuerResponse = await this.issuerClient.getPaymentStatus(transactionId);

    console.log('Issuer response:', issuerResponse);

    // Actualizar caché local si existe
    const localTransaction = this.transactions.get(transactionId);
    if (localTransaction) {
      localTransaction.status = issuerResponse.status === 'APPROVED' ? 'COMPLETED' : 'DECLINED';
      localTransaction.responseCode = issuerResponse.responseCode;
      localTransaction.updatedAt = new Date();
    }

    return {
      transactionId: issuerResponse.transactionId,
      status: issuerResponse.status === 'APPROVED' ? 'COMPLETED' : 'DECLINED',
      amount: localTransaction?.amount,
      currency: localTransaction?.currency,
      responseCode: issuerResponse.responseCode,
      createdAt: issuerResponse.createdAt,
      updatedAt: new Date(),
    };
  }



}
