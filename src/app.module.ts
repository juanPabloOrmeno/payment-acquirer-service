import { Module, MiddlewareConsumer, NestModule } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { PaymentsModule } from './modules/payments/payments.module';
import { WinstonModule } from 'nest-winston';
import { createLoggerConfig } from './common/logger/logger.config';
import { CorrelationIdMiddleware } from './common/middleware/correlation-id.middleware';
import { APP_INTERCEPTOR } from '@nestjs/core';
import { LoggingInterceptor } from './common/interceptors/logging.interceptor';
import { AppLoggerService } from './common/logger/logger.service';

@Module({
  imports: [
    WinstonModule.forRoot(createLoggerConfig()),
    PaymentsModule,
  ],
  controllers: [AppController],
  providers: [
    AppService,
    AppLoggerService,
    {
      provide: APP_INTERCEPTOR,
      useClass: LoggingInterceptor,
    },
  ],
})
export class AppModule implements NestModule {
  configure(consumer: MiddlewareConsumer) {
    consumer.apply(CorrelationIdMiddleware).forRoutes('*');
  }
}
