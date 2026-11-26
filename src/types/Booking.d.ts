import type { Dayjs } from 'dayjs';

export type CustomerResponse = {
	fullName: string;
	dateOfBirth: string; // ISO date string (yyyy-MM-dd)
	address?: string;
	gender?: string;
	status?: string;
	bookingType?: string;
	id?: string;
	booking?: BookingResponseWithoutListOfCustomers;
};

export type InvoiceCustomerResponse = {
	fullName: string;
	birthdate: string; // ISO date string (yyyy-MM-dd)
	address?: string;
	gender?: string;
	status?: string;
	bookingType?: string;
};

export type BookingRequest = {
  pickupConfirmationKey?: string;
	userId: string; // account id as string (comes from session)
	tourDepartureId: string; // id from url
	listOfCustomers: { fullName: string; birthdate: string; address?: string; gender: string; guardianName?: string; guardianPhone?: string }[]; // customers from the booking form
	clientKey?: string; // stable UUID for one checkout attempt; retries must reuse it
	pricingDate?: string; // Vietnam calendar date used for the current preview
	expectedAmount?: string;
};

export type BookingResponse = {
	restartAllowed?: boolean;
	reservationStatus?: 'HELD' | 'CHECKOUT' | 'PAID' | 'EXPIRED' | 'CANCELLED' | null;
	paymentDeadline?: string | null;
	paymentRequiredNow?: boolean;
	message?: string;
	id: string;
	accountId?: string;
	tripCompleted?: boolean;
	pickup?: { address: string; landmark?: string; arrivalTime?: string; directionsUrl?: string } | null;
	tourDepartureId?: string;
	createdAt?: string;
	status?: string;
	listOfCustomers?: CustomerResponse[];
};

export type BookingResponseWithoutListOfCustomers = {
	id: string;
	accountId?: string;
	tourDepartureId?: string;
	createdAt?: string;
	status?: string;
}

export type CustomerRequest = {
  fullName: string;
  birthDate: Dayjs;
  guardianName?: string;
  guardianPhone?: string;
  address?: string;
  gender: string;
}

export type PassengerType = 'ADULT' | 'CHILD' | 'TODDLER' | 'INFANT';

export interface PassengerFormValues {
  id?: number;
  type: PassengerType;
  fullName: string;
  birthDate: Dayjs | null;
  gender?: string;
  address?: string;
  guardianName?: string;
  guardianPhone?: string;
}
export type PersonalFormValues = PassengerFormValues & { email: string; phone: string };
export interface CustomersFormValues { customers?: PassengerFormValues[] }
