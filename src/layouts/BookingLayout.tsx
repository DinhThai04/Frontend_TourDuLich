import { Row, Col, Card, Modal } from 'antd';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useRef, useState, useEffect } from 'react';

import PersonalInfo from '@/components/Booking/PersonalInfo';
import ListOfCustomerInfo from '@/components/Booking/ListOfCustomerInfo';
import BookingTitle from '@/components/Booking/BookingTitle';
import BookingExpense from '@/components/Booking/BookingExpense';

import bookingServices from '@/services/bookingServices';
import { sessionService } from '@/services/sessionServices';

import type { BookingRequest, CustomerRequest } from '@/types/Booking';

export default function BookingLayout() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const tourDepartureId = searchParams.get('departureId') || '1';

  const personalFormRef = useRef<any>(null);
  const customersFormRef = useRef<any>(null);
  const [expenseItems, setExpenseItems] = useState<any[]>([]);

  const handlePersonalFormReady = (form: any) => (personalFormRef.current = form);
  const handleCustomersFormReady = (form: any) => (customersFormRef.current = form);

  /** =====================================================
   *  🔹 Tính tổng chi phí theo danh sách khách
   *  ===================================================== */
  const computeItemsFromCustomers = (customers: any[] = []) => {
    const summary: Record<string, { label: string; quantity: number; price: number }> = {};

    customers.forEach((c) => {
      const type = c.type || 'ADULT';
      const label =
        type === 'ADULT'
          ? 'Người lớn'
          : type === 'CHILD'
            ? 'Trẻ em'
            : type === 'TODDLER'
              ? 'Trẻ nhỏ'
              : 'Em bé';

      if (!summary[label]) summary[label] = { label, quantity: 0, price: 0 };

      summary[label].quantity += 1;
    });

    return Object.values(summary);
  };

  const handleCustomersChange = (customers: any[]) => {
    setExpenseItems(computeItemsFromCustomers(customers));
  };

  /** =====================================================
   *  🔹 Khởi tạo danh sách chi phí khi mở trang
   *  ===================================================== */
  useEffect(() => {
    const initialCustomers = customersFormRef.current?.getFieldValue('customers') || [];
    setExpenseItems(computeItemsFromCustomers(initialCustomers));
  }, []);

  /** =====================================================
   *  🔹 Function xử lý khi nhấn "Xác nhận"
   *  ===================================================== */
  const handleConfirm = async () => {
    try {
      const personalForm = personalFormRef.current;
      const customerForm = customersFormRef.current;

      if (!personalForm || !customerForm) throw new Error('Form chưa được khởi tạo.');

      // Validate forms
      await personalForm.validateFields();

      let customers = customerForm.getFieldValue('customers') || [];

      // Nếu chưa có khách => auto thêm từ form cá nhân
      if (customers.length === 0) {
        const p = personalForm.getFieldsValue();
        customers = [
          {
            id: 1,
            type: 'adult',
            fullName: p.fullName,
            gender: p.gender,
            birthDate: p.birthDate,
            address: p.address,
          },
        ];
        customerForm.setFieldsValue({ customers });
      }

      await customerForm.validateFields();

      /** =====================================================
       *  🔹 Tạo booking request
       *  ===================================================== */
      const user = sessionService.getUser();
      if (!user) throw new Error('Không tìm thấy thông tin người dùng.');

      const bookingRequest: BookingRequest = {
        userId: String(user.id),
        tourDepartureId: String(tourDepartureId),
        listOfCustomers: customers.map((c: CustomerRequest) => ({
          fullName: c.fullName,
          birthdate: c.birthDate?.format('YYYY-MM-DD'),
          address: c.address,
          gender: c.gender === 'male' ? 'Male' : 'Female',
        })),
      };

      console.log('📌 bookingRequest:', bookingRequest);

      /** =====================================================
       *  🔹 Gọi API tạo booking
       *  ===================================================== */
      const res = await bookingServices.create(bookingRequest as any);

      Modal.success({
        title: 'Thành công',
        content: 'Đã tạo booking!',
      });

      // Navigate ABSOLUTE PATH
      navigate(`/invoice/booking/${res.result.id}`);
    } catch (err: any) {
      Modal.error({
        title: 'Lỗi',
        content: err?.message || 'Đã xảy ra lỗi',
      });
    }
  };

  /** =====================================================
   *  🔹 RETURN SCOPE
   *  ===================================================== */
  return (
    <div style={{ padding: '24px 10rem', background: '#fff', minHeight: '100vh' }}>
      <Row gutter={[24, 24]} justify="center">
        <BookingTitle />
      </Row>

      <Row gutter={[24, 24]} justify="center">
        {/* LEFT COLUMN */}
        <Col xs={24} lg={16}>
          <Card
            bordered={false}
            style={{ borderRadius: 12, boxShadow: '0 4px 12px rgba(0,0,0,0.15)' }}
          >
            <PersonalInfo onFormReady={handlePersonalFormReady} />
          </Card>

          <Card
            bordered={false}
            style={{
              borderRadius: 12,
              boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
              marginTop: '20px',
            }}
          >
            <ListOfCustomerInfo
              onFormReady={handleCustomersFormReady}
              personalFormGetter={handlePersonalFormReady}
              onCustomersChange={handleCustomersChange}
            />
          </Card>
        </Col>

        {/* RIGHT COLUMN */}
        <Col xs={24} lg={8}>
          <Card
            style={{
              borderRadius: 12,
              boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
              marginBottom: 16,
              position: 'fixed',
              width: '25em',
            }}
          >
            <BookingExpense
              items={expenseItems}
              onConfirm={handleConfirm}
              tourDepartureId={Number(tourDepartureId)}
            />
          </Card>
        </Col>
      </Row>
    </div>
  );
}
