import type { BookingResponse, CustomerResponse } from '@/types/Booking';
import type { ITourDeparture } from '@/types/Tour';
import type { InvoiceResponse } from '@/types/Invoice';

export type HistoryBooking = BookingResponse & {
  tourCode?: string;
  tourTitle?: string;
  departureDate?: string;
  returnDate?: string;
  invoiceStatus?: string;
  totalAmount?: number;
  tourDeparture?: ITourDeparture | null;
  listOfCustomers?: CustomerResponse[];
  invoice?: InvoiceResponse | null;
};
