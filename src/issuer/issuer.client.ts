import { Injectable, HttpException, HttpStatus } from '@nestjs/common';
import axios, { AxiosInstance } from 'axios';
import { IssuerResponseDto } from 'src/modules/payments/dto/issuer-response.dto';
import { IssuerPort } from 'src/modules/payments/ports/IssuerPort';
import { AppLoggerService } from '../common/logger/logger.service';
import { LoggingConstants } from '../common/constants/logging.constants';
import { getCorrelationId } from '../common/middleware/correlation-id.middleware';

@Injectable()
export class IssuerClient implements IssuerPort {

    private readonly http: AxiosInstance;
    private readonly context = 'IssuerClient';

    constructor(private readonly logger: AppLoggerService) {
        this.http = axios.create({
            baseURL: process.env.ISSUER_BASE_URL || 'http://localhost:8080',
            timeout: 5000,
            headers: {
                'Content-Type': 'application/json',
            },
        });

        // Interceptor para agregar correlationId a requests salientes
        this.http.interceptors.request.use((config) => {
            const correlationId = getCorrelationId();
            if (correlationId) {
                config.headers[LoggingConstants.CORRELATION_ID_HEADER] = correlationId;
            }
            return config;
        });
    }

    async authorize(
        merchantId: string,
        cardToken: string,
        amount: number,
        currency: string,
        expirationDate: string
    ): Promise<IssuerResponseDto> {
        const requestData = { merchantId, amount, currency, cardToken, expirationDate };
        
        this.logger.logHttpRequest('POST', '/payments', this.context, { 
            merchantId, 
            amount, 
            currency 
        });

        try {
            const response = await this.http.post('/payments', requestData);

            this.logger.logHttpResponse('POST', '/payments', response.status, this.context, {
                transactionId: response.data.transactionId,
                status: response.data.status,
            });

            return new IssuerResponseDto(
                response.data.transactionId,
                response.data.status,
                response.data.responseCode,
                new Date(response.data.createdAt)
            );
        } catch (error: any) {
            this.logger.error(
                `Error communicating with issuer: ${error.message}`,
                error.stack,
                this.context,
                { 
                    status: error.response?.status,
                    errorData: error.response?.data 
                }
            );
            
            if (error.response) {
                const errorData = error.response.data;
                const statusCode = error.response.status;
                
                throw new HttpException(
                    {
                        message: errorData?.message || 'Error from issuer',
                        errorCode: errorData?.errorCode,
                        issuerStatus: statusCode,
                    },
                    statusCode === 404 ? HttpStatus.NOT_FOUND : 
                    statusCode >= 400 && statusCode < 500 ? HttpStatus.BAD_REQUEST : 
                    HttpStatus.SERVICE_UNAVAILABLE
                );
            }
            
            throw new HttpException(
                'Issuer service unavailable',
                HttpStatus.SERVICE_UNAVAILABLE
            );
        }
    }

    async getPaymentStatus(transactionId: string): Promise<IssuerResponseDto> {
        this.logger.logHttpRequest('GET', `/payments/${transactionId}`, this.context);

        try {
            const response = await this.http.get(`/payments/${transactionId}`);

            this.logger.logHttpResponse('GET', `/payments/${transactionId}`, response.status, this.context, {
                transactionId: response.data.transactionId,
                status: response.data.status,
            });

            return new IssuerResponseDto(
                response.data.transactionId,
                response.data.status,
                response.data.responseCode,
                new Date(response.data.createdAt)
            );
        } catch (error: any) {
            this.logger.error(
                `Error fetching payment status from issuer: ${error.message}`,
                error.stack,
                this.context,
                { 
                    transactionId,
                    status: error.response?.status,
                    errorData: error.response?.data 
                }
            );
            
            if (error.response) {
                const errorData = error.response.data;
                const statusCode = error.response.status;
                
                throw new HttpException(
                    {
                        message: errorData?.message || 'Error from issuer',
                        errorCode: errorData?.errorCode,
                        issuerStatus: statusCode,
                    },
                    statusCode === 404 ? HttpStatus.NOT_FOUND : 
                    statusCode >= 400 && statusCode < 500 ? HttpStatus.BAD_REQUEST : 
                    HttpStatus.SERVICE_UNAVAILABLE
                );
            }
            
            throw new HttpException(
                'Issuer service unavailable',
                HttpStatus.SERVICE_UNAVAILABLE
            );
        }
    }
}
