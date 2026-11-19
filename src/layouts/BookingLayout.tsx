import type { FormInstance } from 'antd';
import type { CustomersFormValues, PassengerFormValues, PassengerType, PersonalFormValues } from '@/types/Booking';
import type { ITourPrice } from '@/types/Tour';
import { errorMessage } from '@/utils/errors';
import { parseDate, formatDatetime, createClientKey } from '@/utils';
import { Row, Col, Card, Modal, Checkbox, Alert, Spin } from 'antd';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { isAxiosError } from 'axios';
import { useContext, useRef, useState, useMemo, useCallback, useEffect } from 'react';

import PersonalInfo from '@/components/Booking/PersonalInfo';
import ListOfCustomerInfo from '@/components/Booking/ListOfCustomerInfo';
import BookingTitle from '@/components/Booking/BookingTitle';
import BookingExpense, { type ExpenseItem } from '@/components/Booking/BookingExpense';

import bookingServices from '@/services/bookingServices';
import { getTourDepartureById } from '@/services/tourServices';
import { sessionService } from '@/services/sessionServices';
import { PASSENGER_LABELS, passengerTypeFor, passengersForBooking, vietnamBookingDay } from '@/utils/booking';
import { bookingAttemptKey, bookingAttemptScope, clearBookingAttempt, pendingBookingKey } from '@/utils/bookingAttempt';

import type { BookingRequest, CustomerRequest } from '@/types/Booking';

import { BookingDraftContext } from './BookingDraftContext';

const previousBookingsLink = (
  // The same-origin tab needs its opener to inherit the sign-in session in sessionStorage.
  <a href="/profile#don-dat-tour" target="_blank" rel="opener">
    Kiểm tra đơn đã giữ chỗ trước khi đặt lại
  </a>
);

export default function BookingLayout() {
  const { clearDraft, markDirty } = useContext(BookingDraftContext);
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const tourDepartureId = searchParams.get('departureId');
  const tourId = searchParams.get('tourId');
  const [departureError, setDepartureError] = useState<string | null>(null);
  const [departureReady, setDepartureReady] = useState(false);
  const [availableSeats, setAvailableSeats] = useState<number | null>(null);
  const [tourPrice, setTourPrice] = useState<ITourPrice | null>(null);
  useEffect(() => {
    let active = true;
    setDepartureReady(false);
    setDepartureError(null);
    setAvailableSeats(null);
    setTourPrice(null);
    const validate = async () => {
      try {
        const id = Number(tourDepartureId);
        if (!tourDepartureId || !Number.isSafeInteger(id) || id <= 0) {
          throw new Error('Vui lòng quay lại tour và chọn ngày khởi hành.');
        }
        const response = await getTourDepartureById(id);
        const departure = response.result;
        if (response.code !== 1000 || !departure?.tourPrice) throw new Error('Không tìm thấy chuyến đi hoặc bảng giá.');
        if (departure.operationalStatus && departure.operationalStatus !== 'OPEN') throw new Error('Lịch này đang dừng hoặc chỉ phục vụ khách bị dời lịch. Vui lòng chọn lịch đang mở bán.');
        if (tourId && String(departure.tourId) !== tourId) throw new Error('Chuyến đi không thuộc tour đã chọn.');
        const start = parseDate(departure.departureDate)?.getTime() ?? NaN;
        if (!Number.isFinite(start) || start <= Date.now()) throw new Error('Chuyến đi đã khởi hành; vui lòng chọn chuyến khác.');
        const seats = Number(departure.availableSeats);
        if (!Number.isFinite(seats) || seats <= 0) throw new Error('Chuyến đi đã hết chỗ.');
        if (active) {
          setAvailableSeats(Number.isFinite(seats) ? seats : null);
          setTourPrice(departure.tourPrice);
          setDepartureReady(true);
        }
      } catch (error) {
        if (active) setDepartureError(error instanceof Error ? error.message : 'Không thể kiểm tra chuyến đi.');
      }
    };
    void validate();
    return () => { active = false; };
  }, [tourDepartureId, tourId]);

  const personalFormRef = useRef<FormInstance<PersonalFormValues> | null>(null);
  const customersFormRef = useRef<FormInstance<CustomersFormValues> | null>(null);
  const [includeBooker, setIncludeBooker] = useState(true);
  const [extraCustomers, setExtraCustomers] = useState<PassengerFormValues[]>([]);
  const [restartNotice, setRestartNotice] = useState(false);
  const [pricingDay, setPricingDay] = useState(vietnamBookingDay);
  const pricingDate = useMemo(() => parseDate(pricingDay) ?? new Date(), [pricingDay]);

  useEffect(() => {
    let timer = 0;
    const syncDay = () => {
      const now = Date.now();
      const today = vietnamBookingDay(new Date(now));
      setPricingDay(today);
      const midnight = parseDate(today)?.getTime();
      window.clearTimeout(timer);
      if (midnight !== undefined) timer = window.setTimeout(syncDay, Math.max(1, midnight + 86_400_000 - now));
    };
    syncDay();
    window.addEventListener('focus', syncDay);
    document.addEventListener('visibilitychange', syncDay);
    return () => {
      window.clearTimeout(timer);
      window.removeEventListener('focus', syncDay);
      document.removeEventListener('visibilitychange', syncDay);
    };
  }, []);

  const handlePersonalFormReady = useCallback((form: FormInstance<PersonalFormValues>) => { personalFormRef.current = form; }, []);
  const handleCustomersFormReady = useCallback((form: FormInstance<CustomersFormValues>) => { customersFormRef.current = form; }, []);

  /** =====================================================
   *  🔹 Tính tổng chi phí theo danh sách khách
   *  ===================================================== */
  const handleCustomersChange = useCallback(
    (customers: PassengerFormValues[]) => setExtraCustomers(customers),
    [],
  );

  const expenseItems = useMemo<ExpenseItem[]>(() => {
    const counts: Record<PassengerType, number> = { ADULT: 0, CHILD: 0, TODDLER: 0, INFANT: 0 };
    // Người đặt đã được form cá nhân kiểm tra từ 18 tuổi trở lên nên luôn là người lớn.
    if (includeBooker) counts.ADULT += 1;
    extraCustomers.forEach((customer) => {
      counts[passengerTypeFor(customer.birthDate, pricingDate, customer.type)] += 1;
    });
    return (Object.keys(counts) as PassengerType[])
      .filter((type) => counts[type] > 0)
      .map((type) => ({ type, label: PASSENGER_LABELS[type], quantity: counts[type] }));
  }, [includeBooker, extraCustomers, pricingDate]);

  /** =====================================================
   *  🔹 Function xử lý khi nhấn "Xác nhận"
   *  ===================================================== */
  const handleConfirm = async () => {
    try {
      const ensureDisplayedDayIsCurrent = () => {
        const today = vietnamBookingDay();
        if (today === pricingDay) return;
        setPricingDay(today);
        throw new Error('Đã sang ngày mới theo giờ Việt Nam. Vui lòng kiểm tra lại giá và nhóm tuổi trước khi xác nhận.');
      };
      ensureDisplayedDayIsCurrent();
      if (!departureReady) throw new Error('Chưa xác nhận được chuyến đi hợp lệ.');
      const personalForm = personalFormRef.current;
      const customerForm = customersFormRef.current;

      // The booker form only matters when the booker joins the tour; otherwise it must not block checkout.
      if (includeBooker && !personalForm) throw new Error('Form chưa được khởi tạo.');
      if (!customerForm) throw new Error('Form chưa được khởi tạo.');

      if (personalForm && includeBooker) await personalForm.validateFields();
      await customerForm.validateFields();
      ensureDisplayedDayIsCurrent();
      const p = personalForm?.getFieldsValue();
      const extras = customerForm.getFieldsValue().customers || [];
      const passengers = passengersForBooking<PassengerFormValues>(includeBooker,
        { type: 'ADULT', fullName: p?.fullName ?? '', gender: p?.gender, birthDate: p?.birthDate ?? null, address: p?.address }, extras);
      if (!passengers.length) throw new Error('Cần ít nhất một hành khách tham gia tour.');
      if (availableSeats != null && passengers.length > availableSeats)
        throw new Error(`Chuyến đi chỉ còn ${availableSeats} chỗ nhưng đoàn có ${passengers.length} hành khách.`);

      const customers: CustomerRequest[] = passengers.map(c => {
        if (!c.birthDate?.isValid() || !c.gender || !c.fullName?.trim()) throw new Error('Vui lòng nhập đầy đủ thông tin hành khách.');
        return { fullName: c.fullName, birthDate: c.birthDate, gender: c.gender, address: c.address };
      });

      /** =====================================================
       *  🔹 Tạo booking request
       *  ===================================================== */
      const user = sessionService.getUser();
      if (!user || !tourDepartureId) throw new Error('Không xác định được tài khoản hoặc lịch khởi hành.');
      const attemptScope = bookingAttemptScope(user.id, tourDepartureId);
      const clientKey = bookingAttemptKey(attemptScope, createClientKey);
      setRestartNotice(false);

      const bookingRequest: BookingRequest = {
        userId: String(user.id),
        tourDepartureId: String(tourDepartureId),
        clientKey,
        pricingDate: pricingDay,
        listOfCustomers: customers.map((c: CustomerRequest) => ({
          fullName: c.fullName,
          birthdate: c.birthDate.format('YYYY-MM-DD'),
          address: c.address,
          gender: c.gender === 'male' ? 'Male' : 'Female',
        })),
      };


      /** =====================================================
       *  🔹 Gọi API tạo booking
       *  ===================================================== */
      const res = await bookingServices.create(bookingRequest);

      if (res.code !== 1000 || !res.result?.id) throw new Error(res.result?.message || res.message || 'Đặt tour thất bại');

      clearBookingAttempt(attemptScope, clientKey);
      if (res.result.restartAllowed) {
        setRestartNotice(true);
        Modal.info({
          title: 'Đơn trước đã kết thúc',
          content: 'Thông tin đang nhập vẫn được giữ. Chọn “Tiếp tục giữ chỗ” để xác nhận một lượt đặt mới.',
        });
        return;
      }
      clearDraft();
      const reservationStatus = res.result.reservationStatus;
      if (reservationStatus === 'EXPIRED' || reservationStatus === 'CANCELLED' || reservationStatus === 'PAID') {
        navigate(`/invoice/booking/${res.result.id}`);
        return;
      }
      Modal.success({
        title: res.result.paymentRequiredNow ? 'Vui lòng thanh toán ngay' : 'Đã giữ chỗ',
        content: res.result.paymentRequiredNow
          ? 'Chuyến đi còn tối đa 7 ngày. Vui lòng thanh toán VNPay trong thời hạn hiển thị để hoàn tất đặt tour.'
          : `Chỗ được giữ đến ${res.result.paymentDeadline ? formatDatetime(res.result.paymentDeadline) : 'hạn thanh toán'}. Booking tự hủy nếu chưa thanh toán khi hết hạn.`,
      });

      // Navigate ABSOLUTE PATH
      navigate(`/invoice/booking/${res.result.id}`);
    } catch (err: unknown) {
      // AntD rejects validateFields with field info, which the form already highlights.
      if (err && typeof err === 'object' && 'errorFields' in err) return;
      const status = isAxiosError(err) ? err.response?.status : undefined;
      const checkPreviousBooking = isAxiosError(err) && (!status || status === 409 || status >= 500);
      Modal.error({
        title: 'Lỗi',
        content: checkPreviousBooking ? <>
          <p>{errorMessage(err)}</p>
          {previousBookingsLink}
        </> : errorMessage(err),
      });
    }
  };

  /** =====================================================
   *  🔹 RETURN SCOPE
   *  ===================================================== */
  const currentUser = sessionService.getUser();
  const hasPendingAttempt = currentUser && tourDepartureId
    && pendingBookingKey(bookingAttemptScope(currentUser.id, tourDepartureId));
  if (departureError) return <Alert type="error" showIcon message={departureError}
    description={hasPendingAttempt ? previousBookingsLink : undefined} />;
  if (!departureReady) return <Spin tip="Đang kiểm tra chuyến đi"><div style={{ minHeight: 160 }} /></Spin>;
  return (
    <div className="bg-white min-h-screen" style={{ padding: '24px clamp(16px, 5vw, 160px)' }}>
      <Row gutter={[24, 24]} justify="center">
        <BookingTitle />
      </Row>

      {hasPendingAttempt && (
        <Alert className="!mb-4" type="info" showIcon
          message="Lần giữ chỗ trước chưa có kết quả xác nhận trên trang này."
          description={previousBookingsLink} />
      )}
      {restartNotice && !hasPendingAttempt && (
        <Alert className="!mb-4" type="info" showIcon
          message="Đơn trước đã kết thúc. Bạn có thể tạo lượt giữ chỗ mới với thông tin đang nhập." />
      )}

      <Row gutter={[24, 24]} justify="center">
        {/* LEFT COLUMN */}
        <Col xs={24} lg={16}>
          <Card
            variant="borderless"
            style={{ borderRadius: 12, boxShadow: '0 4px 12px rgba(0,0,0,0.15)' }}
          >
            <PersonalInfo onFormReady={handlePersonalFormReady} />
          </Card>

          <Card
            variant="borderless"
            style={{
              borderRadius: 12,
              boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
              marginTop: '20px',
            }}
          >
            <Checkbox checked={includeBooker} onChange={event => {
              markDirty();
              setIncludeBooker(event.target.checked);
            }}>
              Người đặt cũng tham gia tour (không cần nhập lại ở danh sách bên dưới)
            </Checkbox>
            <ListOfCustomerInfo
              onFormReady={handleCustomersFormReady}
              onCustomersChange={handleCustomersChange}
              pricingDate={pricingDate}
              maxPassengers={availableSeats == null ? undefined : Math.max(0, availableSeats - (includeBooker ? 1 : 0))}
            />
          </Card>
        </Col>

        {/* RIGHT COLUMN */}
        <Col xs={24} lg={8} className="lg:sticky lg:top-24 lg:self-start">
          <Card
            style={{
              borderRadius: 12,
              boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
              marginBottom: 16,
              width: '100%',
            }}
          >
            <BookingExpense
              items={expenseItems}
              tourPrice={tourPrice}
              onConfirm={handleConfirm}
            />
          </Card>
        </Col>
      </Row>
    </div>
  );
}
