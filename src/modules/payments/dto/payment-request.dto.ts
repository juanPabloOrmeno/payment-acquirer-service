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
import { ApiProperty } from '@nestjs/swagger';
import { MerchantId } from '../enums/merchant.enum';

export enum OperationType {
  PURCHASE = 'PURCHASE',
  REFUND = 'REFUND',
  VOID = 'VOID',
}

export class PaymentRequestDto {
  @ApiProperty({
    description: 'ID del comercio/banco',
    enum: MerchantId,
    example: MerchantId.MERCHANT_001,
  })
  @IsNotEmpty({ message: 'Merchant ID is required' })
  @IsEnum(MerchantId, { message: 'Invalid merchant ID. Must be one of: MERCHANT_001, MERCHANT_002, MERCHANT_003, MERCHANT_004, MERCHANT_005' })
  merchantId: MerchantId;

  @ApiProperty({
    description: 'Monto de la transacción',
    example: 15000,
    minimum: 1,
  })
  @IsNotEmpty({ message: 'Amount is required' })
  @IsNumber({}, { message: 'Amount must be a number' })
  @IsPositive({ message: 'Amount must be greater than zero' })
  amount: number;

  @ApiProperty({
    description: 'Código de moneda',
    example: 'CLP',
    minLength: 1,
  })
  @IsNotEmpty({ message: 'Currency is required' })
  @IsString({ message: 'Currency must be a string' })
  @MinLength(1, { message: 'Currency cannot be empty' })
  currency: string;

  @ApiProperty({
    description: 'Token de la tarjeta (PAN tokenizado)',
    example: 'tok_9f83hdf92ksl',
    minLength: 10,
  })
  @IsNotEmpty({ message: 'Card token is required' })
  @IsString({ message: 'Card token must be a string' })
  @MinLength(1, { message: 'Card token cannot be empty' })
  cardToken: string;

  @ApiProperty({
    description: 'Fecha de expiración de la tarjeta',
    example: '12/26',
    pattern: '^(0[1-9]|1[0-2])/([0-9]{2})$',
  })
  @IsNotEmpty({ message: 'Expiration date is required' })
  @IsString({ message: 'Expiration date must be a string' })
  @Matches(/^(0[1-9]|1[0-2])\/([0-9]{2})$/, {
    message: 'Expiration date must be in MM/YY format',
  })
  expirationDate: string;

  @ApiProperty({
    description: 'Tipo de operación',
    enum: OperationType,
    example: OperationType.PURCHASE,
    required: false,
    default: OperationType.PURCHASE,
  })
  @IsOptional()
  @IsEnum(OperationType, { message: 'Operation type must be PURCHASE, REFUND, or VOID' })
  operationType?: OperationType = OperationType.PURCHASE;
}
