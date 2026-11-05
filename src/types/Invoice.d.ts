import type { CustomerResponse } from './Booking';
import type { ITourDeparture } from './Tour';
export type InvoiceItem = {
  name: string;
  dob?: string;
  price: number;
};

export type PaymentQuote = {
  /** Tổng tiền server sẽ thu (VND, dạng chuỗi số nguyên). */
  amount: string;
  unitPrices: Record<'ADULT' | 'CHILD' | 'TODDLER' | 'INFANT', string>;
};

interface InvoiceFormProps {
  account: { fullName: string; email: string; phone: string };
  customers?: CustomerResponse[];
  tourDeparture?: ITourDeparture;
  quote?: PaymentQuote;
  onCreate: (totalAmount: number) => Promise<void>;
}

export type InvoiceResponse = {
  accountId?: string;
  id: string;
  userId?: string;
  bookingId?: string;
  dayOfPay?: string;
  paymentMethodId?: string;
  status?: string;
  message?: string;
  totalCountOfAdult?: string;
  totalCountOfChildren?: string;
  totalCountOfToddler?: string;
  totalCountOfInfant?: string;
  totalChargeOfAdult?: string;
  totalChargeOfChildren?: string;
  totalChargeOfToddler?: string;
  totalChargeOfInfant?: string;
  totalExtraFee?: string;
  totalBookingTourExpense?: string;
  paymentUrl?: string;
  paymentQrBase64?: string;
  customerResponseList?: CustomerResponse[];
};
