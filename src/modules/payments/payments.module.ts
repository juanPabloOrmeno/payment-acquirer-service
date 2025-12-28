import { Module } from '@nestjs/common';
import { PaymentsController } from './controller/payments.controller';
import { PaymentsService } from './service/payments.service';
import { IssuerClient } from '../../issuer/issuer.client';
import { AppLoggerService } from '../../common/logger/logger.service';

@Module({
  controllers: [PaymentsController],
  providers: [PaymentsService, IssuerClient, AppLoggerService],
  exports: [PaymentsService],
})
export class PaymentsModule {}
