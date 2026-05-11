export interface ServiceBooking {
  id: number;
  serviceRequestId: number;
  offerId: number;
  workshopId: number;
  vehicleId: number;
  scheduledDate: string;
  proposedPriceAmount: number;
  proposedPriceCurrency: string;
  finalPriceAmount: number;
  finalPriceCurrency: string;
  status: 'PENDING_SCHEDULE' | 'IN_PROGRESS' | 'COMPLETED' | 'PICKED_UP' | 'CANCELLED';
  servicesToPerform: string[];
  description: string;
  createdAt: string;
  completedAt: string | null;
  pickedUpAt: string | null;
  cancelledAt: string | null;
}