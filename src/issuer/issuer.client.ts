import { Injectable, HttpException, HttpStatus } from '@nestjs/common';
import axios, { AxiosInstance } from 'axios';
import { IssuerResponseDto } from 'src/modules/payments/dto/issuer-response.dto';
import { IssuerPort } from 'src/modules/payments/ports/IssuerPort';

@Injectable()
export class IssuerClient implements IssuerPort {

  private readonly http: AxiosInstance;

  constructor() {
    this.http = axios.create({
      baseURL: process.env.ISSUER_BASE_URL || 'http://localhost:8080',
      timeout: 5000,
      headers: {
        'Content-Type': 'application/json',
      },
    });
  }

  async authorize(
    cardToken: string,
    amount: number,
    currency: string
  ): Promise<IssuerResponseDto> {

    try {
      const response = await this.http.post('/payments', {
        merchantId: 'ACQUIRER_MERCHANT',
        amount,
        currency,
        cardToken,
        expirationDate: '12/26',
      });

      return new IssuerResponseDto(
        response.data.transactionId,
        response.data.status,
        response.data.responseCode,
        new Date(response.data.createdAt)
      );
    } catch (error: any) {
        console.error('Error communicating with issuer:', error.response?.data || error.message);
      throw new HttpException(
        'Issuer service unavailable',
        HttpStatus.SERVICE_UNAVAILABLE
      );
    }
  }
}
