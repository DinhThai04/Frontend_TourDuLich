import { Row, Col, Card, Spin, Alert, message } from 'antd';
import { useParams } from 'react-router-dom';
import { useEffect, useState, useCallback } from 'react';

import InvoiceForm from '@/components/Invoice/InvoiceForm';
import bookingServices from '@/services/bookingServices';
import { getTourDepartureById } from '@/services/tourServices';
import { sessionService } from '@/services/sessionServices';
import paymentServices from '@/services/paymentServices';
import type { BookingResponse, CustomerResponse } from '@/types/Booking';
import type { ITourDeparture } from '@/types/Tour';
import type { PaymentRequest } from '@/types/Payment';

export default function InvoiceLayout() {
  const { id } = useParams<{ id: string }>();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [currentUser, setCurrentUser] = useState<any>();
  const [bookingResult, setBookingResult] = useState<BookingResponse>();
  const [tourDepartureResult, setTourDepartureResult] = useState<ITourDeparture>();
  const [customerResult, setCustomerResult] = useState<CustomerResponse[]>([]);

  /** ---------------------------------------------------------
   * 🔹 Load toàn bộ dữ liệu: Booking, Customer, TourDeparture
   ----------------------------------------------------------*/
  const loadData = useCallback(async (bookingId: number) => {
    setLoading(true);
    setError(null);

    try {
      const user = sessionService.getUser();
      if (!user) {
        throw new Error('Không thể xác định người dùng (session error).');
      } else {
        setCurrentUser(user);

        const [bookingRes, customerRes] = await Promise.all([
          bookingServices.getById(bookingId),
          bookingServices.getListOfCustomersByBookingId(bookingId),
        ]);

        if (bookingRes.code === 1000 && customerRes.code === 1000) {
          const booking = bookingRes?.result as BookingResponse;
          const customerList = customerRes?.result as CustomerResponse[];
          const tourRes = await getTourDepartureById(Number(booking.tourDepartureId));

          setBookingResult(booking);
          setCustomerResult(customerList);

          if (tourRes.code === 1000) setTourDepartureResult(tourRes?.result);
          else {
            throw new Error('Lỗi khi fetch dữ liệu tour');
          }
        } else {
          throw new Error('Lỗi khi fetch dữ liệu đặt tour và khách hàng');
        }
      }
    } catch (err: any) {
      setError(err?.message);
      console.log(err);
      message.error(err?.message);
    } finally {
      setLoading(false);
    }
  }, []);

  /** Call loadData khi id thay đổi */
  useEffect(() => {
    if (id) {
      loadData(Number(id));
    }
  }, [id, loadData]);

  /** ---------------------------------------------------------
   * 🔹 Xử lý tạo hóa đơn
   ----------------------------------------------------------*/
  const handleCreatePayment = async (paymentMethod: string, totalAmount: number) => {
    console.log(paymentMethod); // log để build
    try {
      const totalAmountStr = String(totalAmount * 100000);
      const paymentRequest: PaymentRequest = { amount: totalAmountStr };
      const paymentResponse = await paymentServices.create(paymentRequest);

      if (paymentResponse) {
        window.location.href = String(paymentResponse);
      } else {
        throw new Error('Không thể tạo url điều hướng đến vnpay');
      }

      if (bookingResult && tourDepartureResult) {
        const invoiceRequest = {
          bookingRequest: {
            bookingId: String(bookingResult.id),
            userId: String(currentUser?.id),
            tourDepartureId: String(tourDepartureResult.id),
            listOfCustomers: customerResult.map((c) => ({
              fullName: c.fullName,
              birthdate: c.dateOfBirth,
              address: c.address,
              gender: c.gender,
              status: c.status,
              bookingType: c.bookingType,
            })),
          },
        };

        sessionStorage.setItem(
          'invoice_temp',
          JSON.stringify({
            invoiceRequest,
          })
        );
      } else {
        throw new Error('Thiếu dữ liệu để tạo hóa đơn.');
      }
    } catch (err: any) {
      setError(err?.message);
      message.error(err?.message);
    }
  };

  /** ---------------------------------------------------------
   * Render
   ----------------------------------------------------------*/
  return (
    <div style={{ padding: '24px 10rem', background: '#fff', minHeight: '100vh' }}>
      <Row gutter={[24, 24]} justify="center">
        <Col xs={24} lg={16}>
          <Card
            bordered={false}
            style={{ borderRadius: 12, boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }}
          >
            {loading && <Spin />}
            {error && <Alert type="error" message={error} showIcon />}

            {!loading && !error && bookingResult && (
              <InvoiceForm
                account={{
                  fullName: currentUser?.username || 'Khách hàng',
                  email: currentUser?.email || '',
                  phone: currentUser?.phone || '',
                }}
                // customers={customerResult}
                tourDeparture={tourDepartureResult}
                onCreate={handleCreatePayment}
              />
            )}
          </Card>
        </Col>
      </Row>
    </div>
  );
}
