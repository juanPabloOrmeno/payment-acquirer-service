import { IssuerResponseDto } from "../dto/issuer-response.dto";

export interface IssuerPort {
  authorize(
    cardToken: string,
    amount: number,
    currency: string
  ): Promise<IssuerResponseDto>;
}
