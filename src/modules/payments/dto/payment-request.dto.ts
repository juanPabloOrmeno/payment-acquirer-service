import {
  IsNotEmpty,
  IsString,
  IsNumber,
  IsPositive,
  MinLength,
  MaxLength,
  Matches,
  IsEnum,
  IsOptional,
} from 'class-validator';
import { MerchantId } from '../enums/merchant.enum';

export enum OperationType {
  PURCHASE = 'PURCHASE',
  REFUND = 'REFUND',
  VOID = 'VOID',
}

export class PaymentRequestDto {
  @IsNotEmpty({ message: 'Merchant ID is required' })
  @IsEnum(MerchantId, { message: 'Invalid merchant ID. Must be one of: MERCHANT_001, MERCHANT_002, MERCHANT_003, MERCHANT_004, MERCHANT_005' })
  merchantId: MerchantId;

  @IsNotEmpty({ message: 'Amount is required' })
  @IsNumber({}, { message: 'Amount must be a number' })
  @IsPositive({ message: 'Amount must be greater than zero' })
  amount: number;

  @IsNotEmpty({ message: 'Currency is required' })
  @IsString({ message: 'Currency must be a string' })
  @MinLength(1, { message: 'Currency cannot be empty' })
  currency: string;

  @IsNotEmpty({ message: 'Card token is required' })
  @IsString({ message: 'Card token must be a string' })
  @MinLength(1, { message: 'Card token cannot be empty' })
  cardToken: string;

  @IsNotEmpty({ message: 'Expiration date is required' })
  @IsString({ message: 'Expiration date must be a string' })
  @Matches(/^(0[1-9]|1[0-2])\/([0-9]{2})$/, {
    message: 'Expiration date must be in MM/YY format',
  })
  expirationDate: string;

  @IsOptional()
  @IsEnum(OperationType, { message: 'Operation type must be PURCHASE, REFUND, or VOID' })
  operationType?: OperationType = OperationType.PURCHASE;
}
