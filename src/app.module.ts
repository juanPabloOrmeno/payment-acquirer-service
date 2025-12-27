import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { PaymentsController } from './modules/payments/controller/payments.controller';

@Module({
  imports: [],
  controllers: [AppController, PaymentsController],
  providers: [AppService],
})
export class AppModule {}
