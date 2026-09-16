import type { User } from './User.d';

export type CustomerResponse = {
	fullName: string;
	dateOfBirth: string; // ISO date string (yyyy-MM-dd)
	address?: string;
	gender?: boolean;
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
	userId: string; // account id as string (comes from session)
	tourDepartureId: string; // id from url
	listOfCustomers: CustomerRequest[]; // customers from the booking form
};

export type BookingResponse = {
	id: string;
	accountId?: string;
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
	fullName,
	birthDate,
	address,
	gender
}

export type CustomerResponse = {
	fullName,
	birthDate,
	address,
	gender
}
