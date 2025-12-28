import { Injectable, BadRequestException, NotFoundException, HttpException } from '@nestjs/common';
import { PaymentRequestDto, OperationType } from '../dto/payment-request.dto';
import { IssuerClient } from '../../../issuer/issuer.client';
import { CryptoUtil } from '../../../common/utils/crypto.util';
import { MerchantValidator } from '../enums/merchant.enum';
import { AppLoggerService } from '../../../common/logger/logger.service';

@Injectable()
export class PaymentsService {

    private readonly context = 'PaymentsService';
    private transactions: Map<string, any> = new Map();

    constructor(
        private readonly issuerClient: IssuerClient,
        private readonly logger: AppLoggerService,
    ) { }

    async processPayment(dto: PaymentRequestDto) {
        this.logger.logOperationStart('processPayment', this.context, {
            merchantId: dto.merchantId,
            amount: dto.amount,
            currency: dto.currency,
            operationType: dto.operationType,
        });

        if (!dto.merchantId || !dto.amount || !dto.currency) {
            const error = 'Missing required fields: merchantId, amount, currency';
            this.logger.warn(error, this.context);
            throw new BadRequestException(error);
        }

        // Validar token de tarjeta (PAN tokenizado)
        const tokenValidation = CryptoUtil.validateCardToken(dto.cardToken);
        if (!tokenValidation.valid) {
            this.logger.warn('Card token validation failed', this.context, {
                error: tokenValidation.error,
            });
            throw new BadRequestException(tokenValidation.error);
        }

        // Validar monto básico
        if (dto.amount <= 0) {
            this.logger.warn('Invalid amount', this.context, { amount: dto.amount });
            throw new BadRequestException('Amount must be greater than zero');
        }

        // Validar merchant y límite de monto específico del merchant
        const amountValidation = MerchantValidator.validateAmount(dto.merchantId, dto.amount);
        if (!amountValidation.valid) {
            this.logger.warn('Merchant validation failed', this.context, {
                merchantId: dto.merchantId,
                amount: dto.amount,
                message: amountValidation.message,
            });
            throw new BadRequestException(amountValidation.message);
        }

        // Validar límite global de transacción (límite configurable adicional)
        const transactionAmountValidation = CryptoUtil.validateTransactionAmount(
            dto.amount,
            amountValidation.maxAmount || 1000000
        );
        if (!transactionAmountValidation.valid) {
            this.logger.warn('Transaction amount limit exceeded', this.context, {
                amount: dto.amount,
                maxAmount: amountValidation.maxAmount,
            });
            throw new BadRequestException(transactionAmountValidation.error);
        }

        // Validar fecha de expiración
        if (!CryptoUtil.validateExpirationDate(dto.expirationDate)) {
            this.logger.warn('Card expiration validation failed', this.context, {
                expirationDate: dto.expirationDate,
            });
            throw new BadRequestException('Card has expired or expiration date is invalid');
        }

        // Hashear el cardToken para seguridad
        const hashedCardToken = CryptoUtil.hashPAN(dto.cardToken);
        this.logger.debug('Card token hashed successfully', this.context);

        // Llamar al issuer para autorizar el pago
        try {
            this.logger.log('Calling issuer to authorize payment', this.context, {
                merchantId: dto.merchantId,
                amount: dto.amount,
                currency: dto.currency,
            });

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

            this.logger.logOperationSuccess('processPayment', this.context, {
                transactionId,
                status: transaction.status,
                responseCode: transaction.responseCode,
            });

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
        } catch (error) {
            this.logger.logOperationFailure('processPayment', this.context, error as Error, {
                merchantId: dto.merchantId,
                amount: dto.amount,
            });
            throw error;
        }
    }


    async getPaymentStatus(transactionId: string) {
        this.logger.logOperationStart('getPaymentStatus', this.context, { transactionId });

        if (!transactionId || transactionId.trim() === '') {
            this.logger.warn('Transaction ID is required', this.context);
            throw new BadRequestException('Transaction ID is required');
        }

        try {
            const localTransaction = this.transactions.get(transactionId);
            
            if (!localTransaction) {
                this.logger.warn('Transaction not found in local cache', this.context, { transactionId });
                throw new NotFoundException(`Transaction ${transactionId} not found`);
            }

            this.logger.logOperationSuccess('getPaymentStatus', this.context, {
                transactionId,
                status: localTransaction.status,
            });
           
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

            this.logger.logOperationFailure('getPaymentStatus', this.context, error, { transactionId });
            throw new NotFoundException(
                `Unable to retrieve payment status for transaction ${transactionId}`
            );
        }
    }



}
