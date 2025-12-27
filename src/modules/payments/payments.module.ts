import { Module } from '@nestjs/common';
import { PaymentsController } from './controller/payments.controller';
import { PaymentsService } from './service/payments.service';
import { IssuerClient } from '../../issuer/issuer.client';

@Module({
  controllers: [PaymentsController],
  providers: [PaymentsService, IssuerClient],
  exports: [PaymentsService],
})
export class PaymentsModule {}
