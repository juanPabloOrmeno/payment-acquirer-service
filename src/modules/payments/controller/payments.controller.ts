import { Controller, Post, Get, Body, Param, HttpStatus, HttpCode } from '@nestjs/common';

@Controller('payments')
export class PaymentsController {
  constructor() {}

  /**
   * Procesa un nuevo pago
   * POST /payments
   */
  @Post()
  @HttpCode(HttpStatus.CREATED)
  async processPayment(@Body() paymentRequest: any) {
    return {
      message: 'Payment processed successfully',
      transactionId: '12345',
      status: 'PENDING',
      timestamp: new Date(),
    };
  }

  /**
   * Obtiene el estado de un pago
   * GET /payments/:transactionId
   */
  @Get(':transactionId')
  async getPaymentStatus(@Param('transactionId') transactionId: string) {
    return {
      transactionId,
      status: 'COMPLETED',
      amount: 5000,
      currency: 'CLP',
      timestamp: new Date(),
    };
  }
}
