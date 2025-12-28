import { Controller, Post, Get, Body, Param, HttpStatus, HttpCode } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiParam, ApiBody } from '@nestjs/swagger';
import { PaymentsService } from '../service/payments.service';
import { PaymentRequestDto } from '../dto/payment-request.dto';

@ApiTags('payments')
@Controller('payments')
export class PaymentsController {
  constructor(private readonly paymentsService: PaymentsService) {}

  /**
   * Procesa un nuevo pago
   * POST /payments
   */
  @Post()
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ 
    summary: 'Procesar un nuevo pago',
    description: 'Procesa una transacción de pago y la envía al banco emisor para autorización'
  })
  @ApiBody({ type: PaymentRequestDto })
  @ApiResponse({ 
    status: 201, 
    description: 'Pago procesado exitosamente',
    schema: {
      example: {
        transactionId: 'fa2f2617-7a3f-44a7-af3f-50d5d427c139',
        status: 'COMPLETED',
        amount: 15000,
        currency: 'CLP',
        maskedCard: '****1234',
        operationType: 'PURCHASE',
        responseCode: '00',
        createdAt: '2025-12-27T11:08:50.876Z',
        updatedAt: '2025-12-27T11:08:50.900Z'
      }
    }
  })
  @ApiResponse({ status: 400, description: 'Solicitud inválida - validación fallida' })
  @ApiResponse({ status: 503, description: 'Servicio del emisor no disponible' })
  async processPayment(@Body() paymentRequest: PaymentRequestDto) {
    return this.paymentsService.processPayment(paymentRequest);
  }

  /**
   * Obtiene el estado de un pago
   * GET /payments/:transactionId
   */
  @Get(':transactionId')
  @ApiOperation({ 
    summary: 'Consultar estado de transacción',
    description: 'Obtiene el estado actual de una transacción mediante su ID'
  })
  @ApiParam({ 
    name: 'transactionId', 
    description: 'ID único de la transacción',
    example: 'fa2f2617-7a3f-44a7-af3f-50d5d427c139'
  })
  @ApiResponse({ 
    status: 200, 
    description: 'Transacción encontrada',
    schema: {
      example: {
        transactionId: 'fa2f2617-7a3f-44a7-af3f-50d5d427c139',
        status: 'DECLINED',
        amount: 15000,
        currency: 'CLP',
        maskedCard: '****1234',
        operationType: 'PURCHASE',
        responseCode: '05',
        createdAt: '2025-12-27T11:08:50.876Z',
        updatedAt: '2025-12-27T11:08:50.900Z'
      }
    }
  })
  @ApiResponse({ status: 400, description: 'ID de transacción inválido' })
  @ApiResponse({ status: 404, description: 'Transacción no encontrada' })
  async getPaymentStatus(@Param('transactionId') transactionId: string) {
    return this.paymentsService.getPaymentStatus(transactionId);
  }
}
