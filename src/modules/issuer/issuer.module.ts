import { Module } from '@nestjs/common';
import { IssuerClient } from './client/issuer.client';


@Module({
  providers: [IssuerClient],
  exports: [IssuerClient],
})
export class IssuerModule {}
