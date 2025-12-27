import {
  IsNotEmpty,
  IsString,
  IsNumber,
  IsPositive,
  MinLength,
  MaxLength,
} from 'class-validator';

export class PaymentRequestDto {
  @IsNotEmpty({ message: 'Merchant ID is required' })
  @IsString({ message: 'Merchant ID must be a string' })
  @MinLength(1, { message: 'Merchant ID cannot be empty' })
  merchantId: string;

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
  @MinLength(1, { message: 'Expiration date cannot be empty' })
  expirationDate: string;
}
