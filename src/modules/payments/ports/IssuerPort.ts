import { IssuerResponseDto } from "../dto/issuer-response.dto";

export interface IssuerPort {
  authorize(
    merchantId: string,
    cardToken: string,
    amount: number,
    currency: string,
    expirationDate: string
  ): Promise<IssuerResponseDto>;
}
