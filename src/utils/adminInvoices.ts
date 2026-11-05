import type { BookingResponse, CustomerResponse } from '@/types/Booking';
import type { InvoiceResponse } from '@/types/Invoice';
import type { ITour, ITourDeparture } from '@/types/Tour';

/** Shared money-method convention: 1 = VNPay, 2 = MoMo, otherwise the cash desk. */
export function paymentMethodLabel(value: string | null | undefined) {
  if (value === '1') return 'VNPAY';
  if (value === '2') return 'MoMo';
  return 'Tiền mặt';
}

/**
 * Start from authorized receipts; missing permission to list all bookings must not hide receipts.
 * Refunded invoices stay visible so the desk can trace money that already left the account.
 */
export function adminInvoiceRows(
  bookings: BookingResponse[],
  invoices: InvoiceResponse[],
  departures: ITourDeparture[],
  tours: ITour[],
  customers: CustomerResponse[] | null,
  names: Record<string, string>,
) {
  return invoices.filter(invoice => invoice.status === 'PAID' || invoice.status === 'REFUNDED').map(invoice => {
    const booking = bookings.find(item => String(item.id) === String(invoice.bookingId));
    const accountId = invoice.accountId || booking?.accountId;
    const bookingId = booking?.id ?? invoice.bookingId;
    const amount = Number(invoice.totalBookingTourExpense);
    const departure = departures.find(item => String(item.id) === String(booking?.tourDepartureId)) || null;
    return {
      ...booking,
      id: invoice.bookingId || `invoice-${invoice.id}`,
      accountId,
      userName: names[String(accountId)] || (accountId ? `Tài khoản #${accountId}` : 'Chưa có thông tin tài khoản'),
      invoice,
      invoiceAmount: invoice.totalBookingTourExpense != null && Number.isFinite(amount) ? amount : undefined,
      invoiceStatus: invoice.status,
      paymentMethod: invoice.paymentMethodId ?? null,
      tourDeparture: departure,
      tourName: tours.find(item => String(item.id) === String(departure?.tourId))?.tourTitle ?? null,
      // null means the customer source failed: show "—" instead of a misleading zero.
      // Fall back to the invoice's own booking id when bookings cannot be listed; a missing id
      // must not match customers whose booking is also missing.
      listOfCustomers: customers === null || bookingId == null
        ? undefined
        : customers.filter(item => String(item.booking?.id) === String(bookingId)),
    };
  });
}
