import { IsString, IsNotEmpty, IsDate } from 'class-validator';

export class IssuerResponseDto {
  @IsString()
  @IsNotEmpty()
  transactionId: string;

  @IsString()
  @IsNotEmpty()
  status: string;

  @IsString()
  @IsNotEmpty()
  responseCode: string;

  @IsNotEmpty()
  createdAt: Date;

  constructor(
    transactionId: string,
    status: string,
    responseCode: string,
    createdAt: Date,
  ) {
    this.transactionId = transactionId;
    this.status = status;
    this.responseCode = responseCode;
    this.createdAt = createdAt;
  }
}
