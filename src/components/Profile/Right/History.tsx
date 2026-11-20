import { errorMessage } from '@/utils/errors';
import BookingChangesPanel from './BookingChangesPanel';
import TripPreparation from './TripPreparation';
import { useEffect, useState, useCallback, useRef } from 'react';
import {
  Input,
  DatePicker,
  Select,
  Table,
  Modal,
  Button,
  Descriptions,
  Tag,
  message,
  Empty, Alert, Space, Spin,
} from 'antd';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import dayjs from 'dayjs';

import { FileTextOutlined, UserOutlined } from '@ant-design/icons';

import bookingServices, { type BookingHistoryRow } from '@/services/bookingServices';
import { getTourDepartureById } from '@/services/tourServices';
import invoiceServices from '@/services/invoiceServices';
import { formatDate, formatDatetime, formatCurrencyVND } from '@/utils';
import { passengerLabel } from '@/utils/booking';
import { paymentMethodLabel } from '@/utils/adminInvoices';
import { tourScheduleLink } from '@/utils/tourSchedule';

import type { BookingResponse, CustomerResponse } from '@/types/Booking';
import type { ITourDeparture } from '@/types/Tour';
import type { InvoiceResponse } from '@/types/Invoice';

const { RangePicker } = DatePicker;
const { Option } = Select;

type BookingWithFullInfo = BookingResponse & {
  tourCode?: string;
  tourTitle?: string;
  departureDate?: string;
  returnDate?: string;
  invoiceStatus?: string;
  tourDeparture?: ITourDeparture | null;
  listOfCustomers?: CustomerResponse[];
  invoice?: InvoiceResponse | null;
};

function historyBooking(row: BookingHistoryRow): BookingWithFullInfo {
  return {
    ...row.booking,
    tourCode: row.tourCode,
    tourTitle: row.tourTitle,
    departureDate: row.departureDate,
    returnDate: row.returnDate,
    invoiceStatus: row.invoiceStatus,
  };
}

export default function History() {
  const navigate = useNavigate();
  const { search, hash, pathname } = useLocation();
  const linkedBookingId = Number(new URLSearchParams(search).get('bookingId'));
  const consumedBookingLink = useRef<number | null>(null);

  /** STATE */
  const [filterState, setFilterState] = useState({
    searchBookingId: '',
    dateRange: null as [dayjs.Dayjs, dayjs.Dayjs] | null,
    bookingStatus: '',
  });

  const [bookingData, setBookingData] = useState<BookingWithFullInfo[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [page, setPage] = useState(0);
  const [hasNext, setHasNext] = useState(false);
  const [focus, setFocus] = useState<{ id: number; booking?: BookingWithFullInfo; error?: boolean }>();
  const [details, setDetails] = useState<{ request: string; booking: BookingWithFullInfo; incomplete: boolean }>();
  const [loadError, setLoadError] = useState<string | null>(null);

  const [selectedBookingId, setSelectedBookingId] = useState<string | null>(null);
  const [openedModal, setOpenedModal] = useState<'booking' | 'invoice' | null>(null);
  const [changeBookingId, setChangeBookingId] = useState<number>();
  const [paymentCheck, setPaymentCheck] = useState(0);
  const [paymentStatus, setPaymentStatus] = useState<{ request: string; state: string | null }>();
  const bookingSummary = bookingData.find(record => record.id === selectedBookingId)
    ?? (String(focus?.id) === selectedBookingId ? focus?.booking : undefined);
  const paymentRequest = `${selectedBookingId}:${paymentCheck}`;
  const currentDetails = details?.request === paymentRequest ? details : undefined;
  const selectedBooking = currentDetails?.booking ?? bookingSummary;
  const currentPaymentState = paymentStatus?.request === paymentRequest ? paymentStatus.state : undefined;
  const showTripPreparation = selectedBooking
    && !['CANCELLED', 'EXPIRED', 'UNCONFIRMED'].includes(selectedBooking.status ?? '')
    && selectedBooking.invoice?.status !== 'REFUNDED' && currentPaymentState !== 'REFUNDED'
    && (selectedBooking.reservationStatus === 'PAID' || selectedBooking.invoice?.status === 'PAID' || currentPaymentState === 'PAID');
  const paymentStateMessage = currentPaymentState === 'PAYMENT_PENDING'
    ? 'Đang chờ kết quả giao dịch. Nếu ngân hàng đã trừ tiền, vui lòng không thanh toán lại.'
    : currentPaymentState === 'REVIEW_REQUIRED' ? 'Giao dịch cần kiểm tra. Vui lòng liên hệ SGU Tour nếu ngân hàng đã trừ tiền.'
      : currentPaymentState === null ? 'Chưa tải được trạng thái giao dịch. Bạn có thể cập nhật trạng thái.' : undefined;

  useEffect(() => {
    if (!linkedBookingId) {
      consumedBookingLink.current = null;
      return;
    }
    if (consumedBookingLink.current === linkedBookingId) return;
    let active = true;
    void bookingServices.ownHistory({ bookingId: linkedBookingId }).then(({ code, result }) => {
      if (!active) return;
      const row = code === 1000 ? result.items[0] : undefined;
      if (!row) { setFocus({ id: linkedBookingId, error: true }); return; }
      const booking = historyBooking(row);
      setFocus({ id: linkedBookingId, booking });
      consumedBookingLink.current = linkedBookingId;
      setSelectedBookingId(booking.id);
      setOpenedModal('booking');
    }).catch(() => { if (active) setFocus({ id: linkedBookingId, error: true }); });
    return () => { active = false; };
  }, [linkedBookingId]);

  useEffect(() => {
    if (!bookingSummary?.id) return;
    let active = true;
    const id = Number(bookingSummary.id);
    void Promise.allSettled([
      bookingServices.getById(id),
      bookingServices.getListOfCustomersByBookingId(id),
      invoiceServices.getByBookingId(id),
      bookingSummary.tourDepartureId ? getTourDepartureById(Number(bookingSummary.tourDepartureId)) : Promise.resolve(null),
    ]).then(([booking, customers, invoice, departure]) => {
      if (!active) return;
      const first = booking.status === 'fulfilled' && booking.value.code === 1000 ? booking.value.result : undefined;
      const customerList = customers.status === 'fulfilled' && customers.value.code === 1000 ? customers.value.result : undefined;
      const invoiceRecord = invoice.status === 'fulfilled' && invoice.value.code === 1000 ? invoice.value.result : null;
      const departureRecord = departure.status === 'fulfilled' && departure.value?.code === 1000 ? departure.value.result : null;
      setDetails({
        request: paymentRequest,
        booking: { ...bookingSummary, ...first, listOfCustomers: customerList, invoice: invoiceRecord, tourDeparture: departureRecord },
        incomplete: !first || !customerList || (!!bookingSummary.tourDepartureId && !departureRecord),
      });
    });
    return () => { active = false; };
  }, [bookingSummary, paymentRequest]);

  useEffect(() => {
    if (!selectedBookingId) return;
    const controller = new AbortController();
    const id = Number(selectedBookingId);
    void bookingServices.paymentStatus(id, controller.signal).then(({ code, result }) => {
      if (controller.signal.aborted) return;
      const status = code === 1000 ? result?.bookings.find(item => item.bookingId === id)?.state : undefined;
      setPaymentStatus({ request: paymentRequest, state: status ?? null });
    }).catch(() => {
      if (!controller.signal.aborted) setPaymentStatus({ request: paymentRequest, state: null });
    });
    return () => controller.abort();
  }, [selectedBookingId, paymentRequest]);

  const fetchId = useRef(0);
  const fetchAllData = useCallback(async () => {
    const current = ++fetchId.current;
    setIsLoading(true);
    setLoadError(null);
    try {
      const { code, result } = await bookingServices.ownHistory({
        page,
        bookingId: Number(filterState.searchBookingId) || undefined,
        status: filterState.bookingStatus || undefined,
        from: filterState.dateRange?.[0].format('YYYY-MM-DD'),
        to: filterState.dateRange?.[1].format('YYYY-MM-DD'),
      });
      if (code !== 1000) throw new Error('Chưa tải được lịch sử đặt tour');
      if (fetchId.current !== current) return;
      setBookingData(result.items.map(historyBooking));
      setHasNext(result.hasNext);
      if (!result.items.length && page > 0) setPage(value => value - 1);
    } catch (failure) {
      if (fetchId.current === current) setLoadError(errorMessage(failure, 'Chưa tải được lịch sử đặt tour'));
    } finally {
      if (fetchId.current === current) setIsLoading(false);
    }
  }, [filterState, page]);

  useEffect(() => {
    void fetchAllData();
    return () => { fetchId.current += 1; };
  }, [fetchAllData]);

  /** ======================================================
   * HELPERS
   * ====================================================== */
  // Mirrors the invoice page's entry conditions so the payment CTA never leads to a dead end.
  const canResumePayment = (record: BookingWithFullInfo) =>
    (currentPaymentState === 'HELD' || currentPaymentState === 'CHECKOUT') &&
    ['PENDING_PAYMENT', 'CONFIRMED'].includes(record.status ?? '') &&
    !!record.reservationStatus &&
    !['PAID', 'EXPIRED', 'CANCELLED'].includes(record.reservationStatus) &&
    !['SUSPENDED', 'CANCELLED'].includes(record.tourDeparture?.operationalStatus ?? '') &&
    (record.invoice?.status ?? record.invoiceStatus) !== 'PAID';

  // Mirrors BookingLifecycleService.cancel: paid bookings and closed holds must not offer "Hủy".
  const canCancel = (record: BookingWithFullInfo) =>
    ['PENDING_PAYMENT', 'CONFIRMED'].includes(record.status ?? '') &&
    record.reservationStatus !== 'PAID' &&
    !['CANCELLED', 'EXPIRED'].includes(record.reservationStatus ?? '') &&
    (record.invoice?.status ?? record.invoiceStatus) !== 'PAID';

  const renderStatus = (status: string) => {
    const STATUS_MAP: Record<string, { color: string; label: string }> = {
      PENDING_PAYMENT: { color: 'orange', label: 'Chờ thanh toán' },
      CONFIRMED: { color: 'green', label: 'Đã đặt tour' },
      CANCELLED: { color: 'red', label: 'Đã hủy' },
      EXPIRED: { color: 'red', label: 'Đã hết hạn' },
      UNCONFIRMED: { color: 'red', label: 'Đã hủy' },
    };

    const item = STATUS_MAP[status] || { color: 'blue', label: status };
    return <Tag color={item.color}>{item.label}</Tag>;
  };

  const renderCustomerList = (customers?: CustomerResponse[]) => {
    if (!customers || customers.length === 0) return <i>Không có khách hàng</i>;

    const isMale = (gender?: string) => ['true', 'male', '1'].includes(String(gender).toLowerCase());

    return (
      <div className="space-y-1">
        {customers.map((c) => (
          <div key={c.id}>
            • <b>{c.fullName}</b> ({isMale(c.gender) ? 'Nam' : 'Nữ'}) —{' '}
            {c.dateOfBirth ? formatDate(c.dateOfBirth) : '—'} — {passengerLabel(c.bookingType)}
            <span className="text-gray-500"> — {c.address}</span>
          </div>
        ))}
      </div>
    );
  };

  /** ======================================================
   * COLUMNS
   * ====================================================== */
  const columns = [
    { title: 'Mã Booking', dataIndex: 'id', key: 'id', width: '10%' },
    {
      title: 'Mã Tour',
      dataIndex: 'tourCode',
      key: 'tourCode',
      width: '15%',
      render: (tourCode: string | undefined) => tourCode || '-',
    },
    {
      title: 'Ngày khởi hành',
      dataIndex: 'departureDate',
      render: (d: string) => formatDatetime(d),
      width: '15%',
    },
    {
      title: 'Ngày kết thúc',
      dataIndex: 'returnDate',
      render: (d: string) => formatDatetime(d),
      width: '15%',
    },
    {
      title: 'Trạng thái',
      dataIndex: 'status',
      render: (status: string, record: BookingWithFullInfo) => (
        <>{record.reservationStatus === 'CHECKOUT' ? <Tag color="orange">Chờ thanh toán ngay</Tag>
          : record.reservationStatus === 'EXPIRED' ? <Tag color="red">Hết hạn thanh toán</Tag> : renderStatus(status)}{status === 'CONFIRMED' && (
          <Tag color={(record.invoice?.status ?? record.invoiceStatus) === 'PAID' ? 'green' : 'orange'}>
            {(record.invoice?.status ?? record.invoiceStatus) === 'PAID' ? 'Đã thanh toán' : 'Chưa thanh toán'}
          </Tag>
        )}</>
      ),
      width: '15%',
    },
    {
      title: 'Thao tác',
      key: 'action',
      width: '15%',
      render: (_: unknown, record: BookingResponse) => (
        <>
          <Button type="link" onClick={() => openModal('booking', record)}>
            Chi tiết
          </Button>
          <Button type="link" onClick={() => openModal('invoice', record)}>
            Hóa đơn
          </Button>
          <Button type="link" danger disabled={!canCancel(record)} onClick={() => handleDeleteBooking(Number(record.id))}>
            Hủy
          </Button>
        </>
      ),
    },
  ];

  /** ======================================================
   * MODAL CONTROL
   * ====================================================== */
  const openModal = (type: 'booking' | 'invoice', record: BookingWithFullInfo) => {
    setSelectedBookingId(record.id);
    setPaymentCheck(value => value + 1);
    setOpenedModal(type);
  };

  const closeModal = () => {
    setOpenedModal(null);
    setSelectedBookingId(null);
    if (linkedBookingId) {
      const params = new URLSearchParams(search);
      params.delete('bookingId');
      navigate({ pathname, search: params.toString(), hash }, { replace: true, preventScrollReset: true });
    }
  };

  const goToPayment = () => {
    if (selectedBooking) {
      navigate(`/invoice/booking/${selectedBooking.id}`);
    }
  };

  const handleDeleteBooking = async (id: number) => {
    Modal.confirm({
      title: 'Bạn có chắc chắn muốn hủy booking?',
      content: `Mã booking: ${id}`,
      okText: 'Hủy',
      okType: 'danger',
      cancelText: 'Không',

      async onOk() {
        try {
          setIsLoading(true);
          const res = await bookingServices.delete(id);

          if (res?.code === 1000) {
            message.success('Hủy booking thành công!');
            // Awaited so the spinner only drops once the refreshed list is on screen.
            await fetchAllData();
          } else {
            message.error('Không thể hủy booking!');
          }
        } catch (err) {
          message.error(errorMessage(err, 'Lỗi khi hủy booking!'));
        } finally {
          setIsLoading(false);
        }
      },
    });
  };

  /** ======================================================
   * RENDER
   * ====================================================== */
  return (
    <div className="p-4 bg-white rounded-lg shadow-sm">
      <h3 className="text-xl font-semibold mb-4 text-gray-700">
        <FileTextOutlined /> Lịch sử đặt chỗ
      </h3>

      <section id="doi-lich" className="scroll-mt-24">
        <BookingChangesPanel onChanged={() => void fetchAllData()} bookingId={changeBookingId}
          onClearBooking={() => setChangeBookingId(undefined)} />
      </section>
      {focus?.id === linkedBookingId && focus.error && (
        <Alert type="warning" showIcon className="!mb-3" message="Không tìm thấy đơn trong tài khoản hoặc chưa tải được thông tin." />
      )}
      {loadError && (
        <div className="mb-3 flex items-center justify-between gap-3 rounded border border-red-300 bg-red-50 px-3 py-2 text-sm text-red-700">
          <span>{loadError}</span>
          <Button size="small" onClick={() => void fetchAllData()}>Thử lại</Button>
        </div>
      )}
      {/* Filters */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Input.Search aria-label="Tìm mã đơn đặt tour" placeholder="Nhập mã đơn đặt tour"
          inputMode="numeric" maxLength={10} allowClear enterButton="Tìm"
          onSearch={value => {
            const id = value.trim();
            if (id && (!/^\d{1,10}$/.test(id) || Number(id) < 1 || Number(id) > 2147483647)) {
              message.warning('Nhập mã đơn dạng số'); return;
            }
            setPage(0);
            setFilterState(previous => ({ ...previous, searchBookingId: id }));
          }} />

        <RangePicker
          value={filterState.dateRange}
          onChange={range => { setPage(0); setFilterState({ ...filterState, dateRange: range?.[0] && range[1] ? [range[0], range[1]] : null }); }}
          className="w-full"
        />

        <Select
          placeholder="Chọn trạng thái"
          allowClear
          value={filterState.bookingStatus}
          onChange={val => { setPage(0); setFilterState({ ...filterState, bookingStatus: val ?? '' }); }}
        >
          <Option value="PAID">Đã thanh toán</Option>
          <Option value="UNPAID">Chưa thanh toán</Option>
          <Option value="CLOSED">Đã hủy / hết hạn</Option>
        </Select>
      </div>

      {/* Table */}
      <Table
        loading={isLoading}
        dataSource={bookingData}
        columns={columns}
        rowKey="id"
        pagination={false}
        locale={{ emptyText: <Empty description="Không có booking nào" /> }}
        scroll={{ y: 420 }}
      />

      <Space className="mt-3">
        <Button disabled={page === 0 || isLoading} onClick={() => setPage(value => value - 1)}>Trang trước</Button>
        <span>Trang {page + 1}</span>
        <Button disabled={!hasNext || isLoading} onClick={() => setPage(value => value + 1)}>Trang sau</Button>
      </Space>

      {/* Modal: Booking */}
      <Modal
        open={openedModal === 'booking'}
        onCancel={closeModal}
        footer={null}
        title={
          <span>
            <UserOutlined /> Chi tiết booking
          </span>
        }
      >
        {selectedBooking && (
          <>
            <Descriptions bordered column={1} size="small" className="mb-4">
              <Descriptions.Item label="Mã booking">{selectedBooking.id}</Descriptions.Item>

              <Descriptions.Item label="Ngày đặt">
                {formatDatetime(String(selectedBooking.createdAt))}
              </Descriptions.Item>

              <Descriptions.Item label="Danh sách khách hàng">
                {currentDetails ? (selectedBooking.listOfCustomers ? renderCustomerList(selectedBooking.listOfCustomers) : 'Chưa tải được hành khách') : <Spin size="small" />}
              </Descriptions.Item>

              <Descriptions.Item label="Trạng thái">
                {renderStatus(String(selectedBooking.status))}
              </Descriptions.Item>
              {selectedBooking.paymentDeadline && <Descriptions.Item label="Hạn thanh toán">
                {formatDatetime(selectedBooking.paymentDeadline)}
              </Descriptions.Item>}
            </Descriptions>

            {showTripPreparation && openedModal === 'booking' && <TripPreparation
              bookingId={Number(selectedBooking.id)} departure={selectedBooking.tourDeparture} onViewChanges={() => {
                setChangeBookingId(Number(selectedBooking.id));
                closeModal();
                requestAnimationFrame(() => document.getElementById('doi-lich')?.scrollIntoView({ block: 'start' }));
              }} />}
            {currentDetails?.incomplete && <Alert type="info" className="!my-2" message="Một số thông tin chưa tải được." />}
            {paymentStateMessage && <p className="!my-3 text-sm" role="status">{paymentStateMessage}</p>}
            <div className="flex flex-wrap justify-end gap-2">
              <Button loading={isLoading || currentPaymentState === undefined} onClick={() => {
                setPaymentCheck(value => value + 1);
                void fetchAllData();
              }}>Cập nhật trạng thái</Button>
              {selectedBooking.invoice && <Button onClick={() => setOpenedModal('invoice')}>Xem hóa đơn</Button>}
              {canResumePayment(selectedBooking) && <Button type="primary" onClick={goToPayment}>Tiếp tục thanh toán</Button>}
              {(selectedBooking.reservationStatus === 'EXPIRED' || currentPaymentState === 'DEADLINE_PASSED') && selectedBooking.tourDeparture && (
                <Link className="ant-btn ant-btn-primary" to={tourScheduleLink(selectedBooking.tourDeparture.tourId)}>
                  Chọn lại ngày khởi hành
                </Link>
              )}
            </div>
          </>
        )}
      </Modal>

      {/* Modal: Invoice */}
      <Modal
        open={openedModal === 'invoice'}
        onCancel={closeModal}
        footer={null}
        title={
          <span>
            <FileTextOutlined /> Chi tiết hóa đơn
          </span>
        }
      >
        {!currentDetails ? <Spin /> : !selectedBooking?.invoice ? (
          <>
            <Empty
              description={
                selectedBooking && canResumePayment(selectedBooking)
                  ? 'Chưa thanh toán. Vui lòng tiếp tục thanh toán để hoàn tất đặt tour.'
                  : ['CANCELLED', 'EXPIRED'].includes(selectedBooking?.status ?? '')
                    ? 'Booking đã hủy hoặc hết hạn nên không có hóa đơn thanh toán.'
                    : 'Chưa có hóa đơn thanh toán cho booking này.'
              }
            />
            {selectedBooking && canResumePayment(selectedBooking) && (
              <Button type="primary" onClick={goToPayment}>Tiếp tục thanh toán</Button>
            )}
          </>
        ) : (
          <Descriptions bordered column={1} size="small" className="mb-4">
            <Descriptions.Item label="Mã hóa đơn">{selectedBooking.invoice.id}</Descriptions.Item>

            <Descriptions.Item label="Trạng thái">
              <Tag color={selectedBooking.invoice.status === 'PAID' ? 'green' : selectedBooking.invoice.status === 'REFUNDED' ? 'blue' : 'default'}>
                {selectedBooking.invoice.status === 'PAID' ? 'Đã thanh toán'
                  : selectedBooking.invoice.status === 'REFUNDED' ? 'Đã hoàn tiền'
                    : selectedBooking.invoice.status || 'Không xác định'}
              </Tag>
            </Descriptions.Item>

            <Descriptions.Item label="Ngày tạo">
              {formatDatetime(String(selectedBooking.invoice.dayOfPay))}
            </Descriptions.Item>

            <Descriptions.Item label="Danh sách khách hàng">
              {currentDetails ? (selectedBooking.listOfCustomers ? renderCustomerList(selectedBooking.listOfCustomers) : 'Chưa tải được hành khách') : <Spin size="small" />}
            </Descriptions.Item>

            <Descriptions.Item label="Tổng tiền hóa đơn">
              {formatCurrencyVND(Number(selectedBooking.invoice.totalBookingTourExpense))}
            </Descriptions.Item>

            <Descriptions.Item label="Phương thức thanh toán">
              {paymentMethodLabel(selectedBooking.invoice.paymentMethodId)}
            </Descriptions.Item>
          </Descriptions>
        )}

        <div className="text-right">
          <Button onClick={closeModal}>Đóng</Button>
        </div>
      </Modal>
    </div>
  );
}
