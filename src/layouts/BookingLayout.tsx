import type { FormInstance } from 'antd';
import type { CustomersFormValues, PassengerFormValues, PassengerType, PersonalFormValues } from '@/types/Booking';
import type { ITourPrice } from '@/types/Tour';
import { errorMessage } from '@/utils/errors';
import { parseDate, createClientKey, formatDate } from '@/utils';
import { Row, Col, Card, Modal, Checkbox, Alert, Spin, Button, Select } from 'antd';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { isAxiosError } from 'axios';
import { useContext, useRef, useState, useMemo, useCallback, useEffect } from 'react';

import PersonalInfo from '@/components/Booking/PersonalInfo';
import ListOfCustomerInfo from '@/components/Booking/ListOfCustomerInfo';
import BookingTitle from '@/components/Booking/BookingTitle';
import BookingExpense, { type ExpenseItem } from '@/components/Booking/BookingExpense';

import bookingServices from '@/services/bookingServices';
import { getMeetingPointOptions, getTourDepartureById, type MeetingPoint } from '@/services/tourServices';
import { isDepartureSalesClosed } from '@/utils/tourSchedule';
import { sessionService } from '@/services/sessionServices';
import { bookingHistoryLink, DEFAULT_PARTY, formatParty, parseParty, PARTY_TYPES, PASSENGER_LABELS, passengerTypeFor,
  passengersForBooking, readPartyDraft, savePartyDraft, unitPriceFor, vietnamBookingDay, type PartyCounts } from '@/utils/booking';
import { bookingAttemptKey, bookingAttemptScope, clearBookingAttempt, pendingBookingKey } from '@/utils/bookingAttempt';

import type { BookingRequest, CustomerRequest } from '@/types/Booking';

import { BookingDraftContext } from './BookingDraftContext';

const previousBookingsLink = (
  // The same-origin tab needs its opener to inherit the sign-in session in sessionStorage.
  <a href="/profile#don-dat-tour" target="_blank" rel="opener">
    Kiểm tra đơn đã giữ chỗ trước khi đặt lại
  </a>
);

async function validateBookingFields<T>(form: FormInstance<T>, onInvalid: (focus: () => void) => void) {
  try {
    await form.validateFields();
  } catch (failure) {
    const invalid = failure as { errorFields?: { name: Parameters<typeof form.scrollToField>[0] }[] };
    const first = invalid.errorFields?.[0];
    if (first) onInvalid(() => form.scrollToField(first.name, { focus: true, block: 'center' }));
    throw failure;
  }
}

export default function BookingLayout() {
  const [params] = useSearchParams();
  const key = [params.get('tourId'), params.get('departureId'), params.get('party')].join(':');
  return <BookingForm key={key} />;
}

function BookingForm() {
  const { clearDraft, markDirty } = useContext(BookingDraftContext);
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const tourDepartureId = searchParams.get('departureId');
  const tourId = searchParams.get('tourId');
  const currentUser = sessionService.getUser();
  const scope = currentUser && tourDepartureId ? bookingAttemptScope(currentUser.id, tourDepartureId) : null;
  const requestedParty = searchParams.get('party');
  const draftScope = scope ? `${scope}:${parseParty(requestedParty) ? requestedParty : 'default'}` : null;
  const [draftParty] = useState(() => {
    const restored = draftScope ? readPartyDraft(draftScope) : undefined;
    if (restored) return restored;
    const counts = parseParty(requestedParty) ?? DEFAULT_PARTY;
    return { counts, includeBooker: counts.ADULT > 0 };
  });
  const [initialCustomers] = useState<PassengerFormValues[]>(() => PARTY_TYPES.flatMap(type =>
    Array.from({ length: draftParty.counts[type] - (type === 'ADULT' && draftParty.includeBooker ? 1 : 0) }, (_, index) => ({
      id: PARTY_TYPES.indexOf(type) * 40 + index + 1, type, fullName: '', birthDate: null, address: '',
    })),
  ));
  const [departureError, setDepartureError] = useState<string | null>(null);
  const [departureReady, setDepartureReady] = useState(false);
  const [pickupDepartureDay, setPickupDepartureDay] = useState('');
  const [pickupOptions, setPickupOptions] = useState<MeetingPoint[]>([]);
  const [pickupKey, setPickupKey] = useState<string>();
  const pickup = pickupOptions.find(point => point.confirmationKey === pickupKey);
  const [pickupConfirmed, setPickupConfirmed] = useState(false);
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
        if (isDepartureSalesClosed(departure)) throw new Error('Chuyến đi đã đóng đặt chỗ; vui lòng chọn chuyến khác.');
        const seats = Number(departure.availableSeats);
        if (!Number.isFinite(seats) || seats <= 0) throw new Error('Chuyến đi đã hết chỗ.');
        const pickupResponse = await getMeetingPointOptions(id, Number(departure.tourId));
        if (pickupResponse.code !== 1000 || !Array.isArray(pickupResponse.result)
          || pickupResponse.result.some(point => !point.confirmationKey)) {
          throw new Error('Không thể xác minh điểm tập trung. Vui lòng tải lại trang.');
        }
        if (active) {
          setPickupDepartureDay(formatDate(departure.departureDate));
          setPickupOptions(pickupResponse.result);
          setPickupKey(pickupResponse.result.length === 1 ? pickupResponse.result[0]?.confirmationKey : undefined);
          setPickupConfirmed(false);
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
  const [includeBooker, setIncludeBooker] = useState(draftParty.includeBooker);
  const [extraCustomers, setExtraCustomers] = useState(initialCustomers);
  const [, setRestartNotice] = useState(false);
  const [recovering, setRecovering] = useState(false);
  const [bookingIssue, setBookingIssue] = useState<string | null>(null);
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

  useEffect(() => {
    if (!draftScope) return;
    const counts: PartyCounts = { ADULT: 0, CHILD: 0, TODDLER: 0, INFANT: 0 };
    expenseItems.forEach(item => { counts[item.type] = item.quantity; });
    savePartyDraft(draftScope, counts, includeBooker);
  }, [draftScope, expenseItems, includeBooker]);

  async function recoverAttempt() {
    if (!scope) return false;
    const key = pendingBookingKey(scope);
    if (!key) return false;
    const { code, result } = await bookingServices.findOwnAttempt(key);
    if (code !== 1000) throw new Error('Chưa kiểm tra được lượt giữ chỗ trước');
    if (!result?.id) return false;
    clearBookingAttempt(scope, key);
    if (result.restartAllowed) {
      setRestartNotice(true);
      return true;
    }
    clearDraft();
    navigate(result.reservationStatus === 'PAID' || result.reservationStatus === 'EXPIRED' || result.reservationStatus === 'CANCELLED'
      ? bookingHistoryLink(Number(result.id)) : `/invoice/booking/${result.id}`);
    return true;
  }

  const checkAttempt = async () => {
    if (recovering) return;
    setBookingIssue(null);
    setRecovering(true);
    try {
      if (!await recoverAttempt()) setBookingIssue('Hệ thống chưa thấy đơn cho lượt gửi trước. Bạn có thể gửi lại bằng cùng mã giữ chỗ.');
    } catch {
      setBookingIssue('Chưa kiểm tra được lượt gửi trước. Vui lòng thử lại khi kết nối ổn định.');
    } finally { setRecovering(false); }
  };

  /** =====================================================
   *  🔹 Function xử lý khi nhấn "Xác nhận"
   *  ===================================================== */
  const scheduleBack = `/tours/detail/${Number(tourId)}?party=${formatParty(
    Object.fromEntries(PARTY_TYPES.map(type => [type, expenseItems.find(item => item.type === type)?.quantity ?? 0])) as PartyCounts,
  )}#lich-khoi-hanh`;

  const focusInvalid = useRef<(() => void) | null>(null);
  const rememberInvalidField = (focus: () => void) => { focusInvalid.current = focus; };

  const handleConfirm = async () => {
    try {
      setBookingIssue(null);
      if (recovering || await recoverAttempt()) return;
      const ensureDisplayedDayIsCurrent = () => {
        const today = vietnamBookingDay();
        if (today === pricingDay) return;
        setPricingDay(today);
        throw new Error('Đã sang ngày mới theo giờ Việt Nam. Vui lòng kiểm tra lại giá và nhóm tuổi trước khi xác nhận.');
      };
      ensureDisplayedDayIsCurrent();
      if (!departureReady) throw new Error('Chưa xác nhận được chuyến đi hợp lệ.');
      if (pickupOptions.length && !pickup) throw new Error('Vui lòng chọn điểm tập trung cho cả đoàn.');
      if (pickup && !pickupConfirmed) throw new Error('Vui lòng xác nhận cả đoàn có thể đến điểm tập trung.');
      const personalForm = personalFormRef.current;
      const customerForm = customersFormRef.current;

      // The booker form only matters when the booker joins the tour; otherwise it must not block checkout.
      if (includeBooker && !personalForm) throw new Error('Form chưa được khởi tạo.');
      if (!customerForm) throw new Error('Form chưa được khởi tạo.');

      if (personalForm && includeBooker) await validateBookingFields(personalForm, rememberInvalidField);
      await validateBookingFields(customerForm, rememberInvalidField);
      ensureDisplayedDayIsCurrent();
      const p = personalForm?.getFieldsValue();
      const extras = customerForm.getFieldsValue().customers || [];
      const passengers = passengersForBooking<PassengerFormValues>(includeBooker,
        { type: 'ADULT', fullName: p?.fullName ?? '', gender: p?.gender, birthDate: p?.birthDate ?? null, address: p?.address }, extras);
      if (!passengers.length) throw new Error('Cần ít nhất một hành khách tham gia tour.');
      if (passengers.length > 40) throw new Error('Mỗi đơn chỉ nhận tối đa 40 hành khách.');
      if (availableSeats != null && passengers.length > availableSeats)
        throw new Error(`Chuyến đi chỉ còn ${availableSeats} chỗ nhưng đoàn có ${passengers.length} hành khách.`);

      const customers: CustomerRequest[] = passengers.map(c => {
        if (!c.birthDate?.isValid() || !c.gender || !c.fullName?.trim()) throw new Error('Vui lòng nhập đầy đủ thông tin hành khách.');
        return { fullName: c.fullName, birthDate: c.birthDate, gender: c.gender, address: c.address, guardianName: c.guardianName, guardianPhone: c.guardianPhone };
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
        pickupConfirmationKey: pickup?.confirmationKey,
        expectedAmount: String(passengers.reduce((sum, passenger) =>
          sum + unitPriceFor(passengerTypeFor(passenger.birthDate, pricingDate, passenger.type), tourPrice), 0)),
        listOfCustomers: customers.map((c: CustomerRequest) => ({
          fullName: c.fullName,
          birthdate: c.birthDate.format('YYYY-MM-DD'),
          address: c.address,
          guardianName: c.guardianName,
          guardianPhone: c.guardianPhone,
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
      // Navigate directly to step 2 payment page (no blocking modal popup)
      navigate(`/invoice/booking/${res.result.id}`);
    } catch (err: unknown) {
      // AntD rejects validateFields with field info, which the form already highlights.
      if (err && typeof err === 'object' && 'errorFields' in err) return;
      const status = isAxiosError(err) ? err.response?.status : undefined;
      if (status === 409 && tourDepartureId) {
        const text = errorMessage(err);
        const latest = await getTourDepartureById(Number(tourDepartureId)).catch(() => undefined);
        if (latest?.code === 1000 && latest.result?.tourPrice) {
          setAvailableSeats(latest.result.availableSeats);
          setTourPrice(latest.result.tourPrice);
        }
        setBookingIssue(text);
        return;
      }
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
  const hasPendingAttempt = currentUser && tourDepartureId
    && pendingBookingKey(bookingAttemptScope(currentUser.id, tourDepartureId));
  if (departureError) return <Alert type="error" showIcon message={departureError}
    description={<div className="flex flex-wrap gap-3">
      {bookingIssue && <p role="status" className="w-full">{bookingIssue}</p>}
      {Number(tourId) > 0 && <Link to={scheduleBack}>Chọn ngày khởi hành khác</Link>}
      {hasPendingAttempt && <Button loading={recovering} onClick={() => void checkAttempt()}>Kiểm tra lượt giữ chỗ trước</Button>}
    </div>} />;
  if (!departureReady) return <Spin tip="Đang kiểm tra chuyến đi"><div style={{ minHeight: 160 }} /></Spin>;
  return (
    <div className="bg-[#f4f8f7] min-h-screen" style={{ padding: '24px clamp(16px, 5vw, 140px)' }}>
      <Row gutter={[24, 24]} justify="center">
        <BookingTitle />
      </Row>

      {bookingIssue && <Alert className="!mb-4" type="warning" showIcon message={bookingIssue}
        action={Number(tourId) > 0 ? <Link to={scheduleBack}>Xem ngày khác</Link> : undefined} />}

      <Row gutter={[24, 24]} justify="center" align="top">
        {/* LEFT COLUMN */}
        <Col xs={24} lg={15}>
          <Card
            style={{ borderRadius: 14, border: '1px solid #d2e4e0', boxShadow: '0 8px 24px rgba(21,94,84,0.08)' }}
          >
            <Alert className="!mb-4" showIcon type="info" message="Điểm tập trung"
              description={pickupOptions.length > 0 ? (
                <div className="space-y-2">
                  {pickupOptions.length > 1 && <Select aria-label="Điểm tập trung cho cả đoàn"
                    placeholder="Chọn điểm tập trung cho cả đoàn" className="w-full" value={pickupKey}
                    options={pickupOptions.map(point => ({
                      value: point.confirmationKey,
                      label: `${point.arrivalTime ? point.arrivalTime.slice(0, 5) + ' · ' : ''}${point.address}`,
                    }))} onChange={value => {
                      setPickupKey(value);
                      setPickupConfirmed(false);
                    }} />}
                  {pickup && <>
                  <div className="font-semibold">{pickup.address}</div>
                  <div>Ngày khởi hành {pickupDepartureDay}</div>
                  {pickup.arrivalTime && <div>Có mặt lúc {pickup.arrivalTime.slice(0, 5)} (giờ Việt Nam)</div>}
                  {pickup.landmark && <div>{pickup.landmark}</div>}
                  {pickup.directionsUrl?.startsWith('https://') && (
                    <a href={pickup.directionsUrl} target="_blank" rel="noopener noreferrer">Xem chỉ đường</a>
                  )}
                  <div>
                    <Checkbox checked={pickupConfirmed} onChange={event => setPickupConfirmed(event.target.checked)}>
                      Tôi xác nhận cả đoàn tự túc có mặt tại điểm tập trung theo thông tin trên.
                    </Checkbox>
                  </div>
                  </>}
                </div>
              ) : 'Điều hành sẽ xác nhận điểm tập trung trước chuyến đi.'}
            />
            <div className="mb-4 rounded-lg border border-[#cfe3df] bg-[#f4faf8] px-3.5 py-2.5">
              <Checkbox checked={includeBooker} onChange={event => {
                markDirty();
                setIncludeBooker(event.target.checked);
              }}>
                <span className="font-semibold text-[#134E48]">
                  Người đặt cũng tham gia tour (ưu tiên dùng thông tin nhập bên dưới)
                </span>
              </Checkbox>
              {!includeBooker && (
                <p className="mb-0 mt-1 text-xs text-[#6B7280]">
                  Bạn đang đặt hộ người khác — vui lòng điền thông tin hành khách tham gia ở khung bên dưới.
                </p>
              )}
            </div>
            <PersonalInfo onFormReady={handlePersonalFormReady} disabled={!includeBooker} />
          </Card>

          <Card
            style={{
              borderRadius: 14,
              border: '1px solid #d2e4e0',
              boxShadow: '0 8px 24px rgba(21,94,84,0.08)',
              marginTop: '20px',
            }}
          >
            <ListOfCustomerInfo
              onFormReady={handleCustomersFormReady}
              onCustomersChange={handleCustomersChange}
              initialCustomers={initialCustomers}
              pricingDate={pricingDate}
              maxPassengers={Math.max(0, Math.min(40, availableSeats ?? 40) - (includeBooker ? 1 : 0))}
            />
          </Card>
        </Col>

        {/* RIGHT COLUMN */}
        <Col xs={24} lg={9} style={{ position: 'sticky', top: 92, alignSelf: 'flex-start' }}>
          <Card
            styles={{ body: { padding: 18 } }}
            style={{
              borderRadius: 14,
              border: '1px solid #d2e4e0',
              boxShadow: '0 8px 24px rgba(21,94,84,0.08)',
              marginBottom: 16,
              width: '100%',
            }}
          >
            <BookingExpense
              items={expenseItems}
              tourPrice={tourPrice}
              onConfirm={handleConfirm}
              onCloseConfirmation={() => {
                focusInvalid.current?.();
                focusInvalid.current = null;
              }}
            />
          </Card>
        </Col>
      </Row>
    </div>
  );
}
