import { Controller, Post, Get, Body, Param, HttpStatus, HttpCode } from '@nestjs/common';
import { PaymentsService } from '../service/payments.service';
import { PaymentRequestDto } from '../dto/payment-request.dto';

@Controller('payments')
export class PaymentsController {
  constructor(private readonly paymentsService: PaymentsService) {}

  /**
   * Procesa un nuevo pago
   * POST /payments
   */
  @Post()
  @HttpCode(HttpStatus.CREATED)
  async processPayment(@Body() paymentRequest: PaymentRequestDto) {
    return this.paymentsService.processPayment(paymentRequest);
  }

  /**
   * Obtiene el estado de un pago
   * GET /payments/:transactionId
   */
  @Get(':transactionId')
  async getPaymentStatus(@Param('transactionId') transactionId: string) {
    return this.paymentsService.getPaymentStatus(transactionId);
  }
}
