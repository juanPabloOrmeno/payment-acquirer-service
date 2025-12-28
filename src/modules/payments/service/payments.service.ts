import { Injectable, BadRequestException, NotFoundException, HttpException } from '@nestjs/common';
import { PaymentRequestDto, OperationType } from '../dto/payment-request.dto';
import { IssuerClient } from '../../../issuer/issuer.client';
import { CryptoUtil } from '../../../common/utils/crypto.util';
import { MerchantValidator } from '../enums/merchant.enum';

@Injectable()
export class PaymentsService {

    private transactions: Map<string, any> = new Map();

    constructor(private readonly issuerClient: IssuerClient) { }

    async processPayment(dto: PaymentRequestDto) {

        if (!dto.merchantId || !dto.amount || !dto.currency) {
            throw new BadRequestException(
                'Missing required fields: merchantId, amount, currency',
            );
        }

        // Validar token de tarjeta (PAN tokenizado)
        const tokenValidation = CryptoUtil.validateCardToken(dto.cardToken);
        if (!tokenValidation.valid) {
            throw new BadRequestException(tokenValidation.error);
        }

        // Validar monto básico
        if (dto.amount <= 0) {
            throw new BadRequestException('Amount must be greater than zero');
        }

        // Validar merchant y límite de monto específico del merchant
        const amountValidation = MerchantValidator.validateAmount(dto.merchantId, dto.amount);
        if (!amountValidation.valid) {
            throw new BadRequestException(amountValidation.message);
        }

        // Validar límite global de transacción (límite configurable adicional)
        const transactionAmountValidation = CryptoUtil.validateTransactionAmount(
            dto.amount,
            amountValidation.maxAmount || 1000000
        );
        if (!transactionAmountValidation.valid) {
            throw new BadRequestException(transactionAmountValidation.error);
        }

        // Validar fecha de expiración
        if (!CryptoUtil.validateExpirationDate(dto.expirationDate)) {
            throw new BadRequestException('Card has expired or expiration date is invalid');
        }

        // Hashear el cardToken para seguridad
        const hashedCardToken = CryptoUtil.hashPAN(dto.cardToken);

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
            cardToken: hashedCardToken,
            maskedCard: CryptoUtil.maskPAN(dto.cardToken),
            expirationDate: dto.expirationDate,
            operationType: dto.operationType || OperationType.PURCHASE,
            status: issuerResponse.status,
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
            maskedCard: transaction.maskedCard,
            operationType: transaction.operationType,
            responseCode: transaction.responseCode,
            createdAt: transaction.createdAt,
            updatedAt: transaction.updatedAt,
        };
    }


    async getPaymentStatus(transactionId: string) {
        if (!transactionId || transactionId.trim() === '') {
            throw new BadRequestException('Transaction ID is required');
        }
        try {
            const localTransaction = this.transactions.get(transactionId);
           
            return {
                transactionId: localTransaction.transactionId,
                status: localTransaction.status,
                amount: localTransaction?.amount,
                currency: localTransaction?.currency,
                maskedCard: localTransaction?.maskedCard,
                operationType: localTransaction?.operationType,
                responseCode: localTransaction.responseCode,
                createdAt: localTransaction.createdAt,
                updatedAt: new Date(),
            };
        } catch (error: any) {
            if (error instanceof HttpException) {
                throw error;
            }

            throw new NotFoundException(
                `Unable to retrieve payment status for transaction ${transactionId}`
            );
        }
    }



}
