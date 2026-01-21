export class SeatAvailabilityDto {
  id: string;
  number: number;
  status: 'AVAILABLE' | 'RESERVED' | 'SOLD';
}
