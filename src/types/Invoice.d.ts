export type InvoiceItem = {
  name: string;
  dob?: string;
  price: number;
};

interface InvoiceFormProps {
  account: { fullName: string; email: string; phone: string };
  customers?: CustomerResponse[];
  tourDeparture?: ITourDeparture;
  onCreate: (paymentMethod: string, totalAmount: number) => Promise<void>;
}

export type InvoiceRequest = {
  bookingId: string;
  tourDepartureId: string;
  listOfCustomers: CustomerReq
};

export type CustomerResponse = {
  id?: string;
  fullName?: string;
  birthdate?: string;
  gender?: string;
  address?: string;
  bookingType?: string;
};

export type InvoiceResponse = {
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
  customerResponseList?: CustomerResponse[];
};
