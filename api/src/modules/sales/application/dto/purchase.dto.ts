export class PurchaseDto {
  saleId: string;
  reservationId: string;
  sessionId: string;
  totalPaidCents: number;
  paymentRef: string | null;
  soldAt: Date;
}
