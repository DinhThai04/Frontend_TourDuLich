import { errorMessage } from '@/utils/errors';
import BookingChangesPanel from './BookingChangesPanel';
import { useEffect, useMemo, useState, useCallback, useRef } from 'react';
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
  Empty,
} from 'antd';
import { useNavigate } from 'react-router-dom';
import dayjs from 'dayjs';

import { FileTextOutlined, UserOutlined } from '@ant-design/icons';

import bookingServices from '@/services/bookingServices';
import { getAllTourDeparture, getTourDepartureById } from '@/services/tourServices';
import invoiceServices from '@/services/invoiceServices';
import { sessionService } from '@/services/sessionServices';
import { formatDate, formatDatetime, formatCurrencyVND, isListCapped, toVietnamDate } from '@/utils';
import { passengerLabel } from '@/utils/booking';
import { settledRows } from '@/utils/settledRows';
import { paymentMethodLabel } from '@/utils/adminInvoices';

import type { BookingResponse, CustomerResponse } from '@/types/Booking';
import type { ITourDeparture } from '@/types/Tour';
import type { InvoiceResponse } from '@/types/Invoice';

const { RangePicker } = DatePicker;
const { Option } = Select;

/** The bulk departure list is capped; top up the caller's own bookings one by one without a request storm. */
const MAX_DEPARTURE_LOOKUPS = 50;

// Compare calendar days in Vietnam time; parsing naive backend timestamps as browser-local
// would shift the day for users outside UTC+7 and hide bookings from a picked date.
const VIETNAM_DAY = new Intl.DateTimeFormat('en-CA', {
  timeZone: 'Asia/Ho_Chi_Minh',
  year: 'numeric',
  month: '2-digit',
  day: '2-digit',
});
const vietnamDay = (value: string) => {
  const parsed = toVietnamDate(value);
  return parsed ? VIETNAM_DAY.format(parsed) : '';
};

type BookingWithFullInfo = BookingResponse & {
  userName?: string;
  tourDeparture?: ITourDeparture | null;
  listOfCustomers?: CustomerResponse[];
  invoice?: InvoiceResponse | null;
};

export default function History() {
  const navigate = useNavigate();

  /** STATE */
  const [filterState, setFilterState] = useState({
    searchBookingId: '',
    dateRange: null as [dayjs.Dayjs, dayjs.Dayjs] | null,
    bookingStatus: '',
  });

  const [bookingData, setBookingData] = useState<BookingWithFullInfo[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isCapped, setIsCapped] = useState(false);
  const [loadError, setLoadError] = useState<string | null>(null);

  const [selectedBooking, setSelectedBooking] = useState<BookingWithFullInfo | null>(null);
  const [openedModal, setOpenedModal] = useState<'booking' | 'invoice' | null>(null);

  /** ======================================================
   * FETCH DATA (dùng useCallback để tránh re-render không cần thiết)
   * ====================================================== */
  // Mount, the retry button, the change panel and a cancelled booking can all refresh at once, so only
  // the newest response may repaint; a slow earlier reply must not overwrite newer bookings.
  const fetchId = useRef(0);
  const fetchAllData = useCallback(async () => {
    const current = ++fetchId.current;
    try {
      setIsLoading(true);
      setLoadError(null);

      // This page is self-service. A staff account also holds the global read permissions, so
      // without mine=true it would receive the newest rows of everybody and then filter its own out.
      const [bookingRes, departureRes, customerRes, invoiceRes, userSessionRes] = await Promise.allSettled([
        bookingServices.getAll({ mine: true }),
        getAllTourDeparture(),
        bookingServices.getAllCustomers({ mine: true }),
        invoiceServices.getAll({ mine: true }),
        sessionService.getUser(),
      ]);

      const userSession = userSessionRes.status === 'fulfilled' ? userSessionRes.value : null;
      if (!userSession) throw new Error('Không tìm thấy người dùng!');

      // Only the booking list is essential; decorations degrade to empty instead of blanking history.
      if (bookingRes.status === 'rejected' || bookingRes.value.code !== 1000) {
        throw new Error('Lỗi API, không thể tải dữ liệu!');
      }

      const bookings: BookingResponse[] = bookingRes.value.result || [];
      const departures: ITourDeparture[] = settledRows(departureRes);
      const customers: CustomerResponse[] = settledRows(customerRes);
      const invoices: InvoiceResponse[] = settledRows(invoiceRes);

      const ownBookings = bookings.filter((item) => String(item.accountId) === String(userSession.id));
      const knownDepartureIds = new Set(departures.map((item) => String(item.id)));
      const missingDepartureIds = [
        ...new Set(ownBookings.map((item) => item.tourDepartureId).filter((id): id is string => !!id)),
      ].filter((id) => !knownDepartureIds.has(id));
      const lookups = missingDepartureIds.slice(0, MAX_DEPARTURE_LOOKUPS);
      if (lookups.length > 0) {
        const resolved = await Promise.allSettled(lookups.map((id) => getTourDepartureById(Number(id))));
        resolved.forEach((result) => {
          if (result.status === 'fulfilled' && result.value?.code === 1000 && result.value.result) {
            departures.push(result.value.result);
          }
        });
      }

      const merged: BookingWithFullInfo[] = bookings.map((booking) => ({
        ...booking,
        userName:
          String(booking.accountId) === String(userSession.id) ? userSession.username : 'Unknown',

        tourDeparture:
          departures.find((d) => String(d.id) === String(booking.tourDepartureId)) || null,

        listOfCustomers: customers.filter((c) => String(c.booking?.id) === String(booking.id)),

        invoice: invoices.find((inv) => String(inv.bookingId) === String(booking.id)) || null,
      }));

      const listOfBookingsByCurrentUser = merged.filter((item) => {
        return String(item.accountId) === String(userSession.id);
      });

      if (fetchId.current !== current) return;
      setBookingData(listOfBookingsByCurrentUser);
      // The list endpoints return at most LIST_PAGE_SIZE rows; warn instead of hiding older records.
      setIsCapped(
        isListCapped(bookings) ||
          isListCapped(customers) ||
          missingDepartureIds.length > MAX_DEPARTURE_LOOKUPS,
      );
    } catch (err: unknown) {
      if (fetchId.current !== current) return;
      const text = errorMessage(err, 'Lỗi tải dữ liệu!');
      setLoadError(text);
      message.error(text);
    } finally {
      if (fetchId.current === current) setIsLoading(false);
    }
  }, []);

  /** RUN FETCH */
  useEffect(() => {
    fetchAllData();
  }, [fetchAllData]);

  /** ======================================================
   * FILTER DATA
   * ====================================================== */
  const filteredRecords = useMemo(() => {
    const { searchBookingId, dateRange, bookingStatus } = filterState;

    return bookingData.filter((record) => {
      const matchesId = record.id.toString().includes(searchBookingId.trim());

      const matchesStatus = !bookingStatus || (bookingStatus === 'PAID'
        ? record.invoice?.status === 'PAID'
        : bookingStatus === 'UNPAID'
          ? ['PENDING_PAYMENT', 'CONFIRMED'].includes(record.status ?? '') && record.invoice?.status !== 'PAID'
          : bookingStatus === 'CLOSED'
            ? ['CANCELLED', 'EXPIRED', 'UNCONFIRMED'].includes(record.status ?? '')
            : record.status === bookingStatus);

      const matchesDate = dateRange
        ? (() => {
            const day = vietnamDay(String(record.createdAt));
            return !!day && day >= dateRange[0].format('YYYY-MM-DD') && day <= dateRange[1].format('YYYY-MM-DD');
          })()
        : true;

      return matchesId && matchesStatus && matchesDate;
    });
  }, [bookingData, filterState]);

  /** ======================================================
   * HELPERS
   * ====================================================== */
  // Mirrors the invoice page's entry conditions so the payment CTA never leads to a dead end.
  const canResumePayment = (record: BookingWithFullInfo) =>
    ['PENDING_PAYMENT', 'CONFIRMED'].includes(record.status ?? '') &&
    !!record.reservationStatus &&
    !['PAID', 'EXPIRED', 'CANCELLED'].includes(record.reservationStatus) &&
    record.invoice?.status !== 'PAID';

  // Mirrors BookingLifecycleService.cancel: paid bookings and closed holds must not offer "Hủy".
  const canCancel = (record: BookingWithFullInfo) =>
    ['PENDING_PAYMENT', 'CONFIRMED'].includes(record.status ?? '') &&
    record.reservationStatus !== 'PAID' &&
    !['CANCELLED', 'EXPIRED'].includes(record.reservationStatus ?? '') &&
    record.invoice?.status !== 'PAID';

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
      dataIndex: ['tourDeparture', 'tourCode'],
      key: 'tourCode',
      width: '15%',
      render: (tourCode: string | undefined) => tourCode || '-',
    },
    {
      title: 'Ngày khởi hành',
      dataIndex: ['tourDeparture', 'departureDate'],
      render: (d: string) => formatDatetime(d),
      width: '15%',
    },
    {
      title: 'Ngày kết thúc',
      dataIndex: ['tourDeparture', 'returnDate'],
      render: (d: string) => formatDatetime(d),
      width: '15%',
    },
    {
      title: 'Trạng thái',
      dataIndex: 'status',
      render: (status: string, record: BookingWithFullInfo) => (
        <>{record.reservationStatus === 'CHECKOUT' ? <Tag color="orange">Chờ thanh toán ngay</Tag>
          : record.reservationStatus === 'EXPIRED' ? <Tag color="red">Hết hạn thanh toán</Tag> : renderStatus(status)}{status === 'CONFIRMED' && (
          <Tag color={record.invoice?.status === 'PAID' ? 'green' : 'orange'}>
            {record.invoice?.status === 'PAID' ? 'Đã thanh toán' : 'Chưa thanh toán'}
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
    setSelectedBooking(record);
    setOpenedModal(type);
  };

  const closeModal = () => {
    setOpenedModal(null);
    setSelectedBooking(null);
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

      <BookingChangesPanel onChanged={() => void fetchAllData()} />
      {isCapped && (
        <div className="mb-3 rounded border border-amber-300 bg-amber-50 px-3 py-2 text-sm text-amber-800">
          Danh sách chỉ hiển thị tối đa 500 bản ghi gần nhất. Vui lòng liên hệ hỗ trợ nếu cần xem booking cũ hơn.
        </div>
      )}
      {loadError && (
        <div className="mb-3 flex items-center justify-between gap-3 rounded border border-red-300 bg-red-50 px-3 py-2 text-sm text-red-700">
          <span>{loadError}</span>
          <Button size="small" onClick={() => void fetchAllData()}>Thử lại</Button>
        </div>
      )}
      {/* Filters */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Input
          placeholder="Tìm theo mã booking"
          value={filterState.searchBookingId}
          onChange={(e) => setFilterState({ ...filterState, searchBookingId: e.target.value })}
        />

        <RangePicker
          value={filterState.dateRange}
          onChange={(range) => setFilterState({ ...filterState, dateRange: range?.[0] && range[1] ? [range[0], range[1]] : null })}
          className="w-full"
        />

        <Select
          placeholder="Chọn trạng thái"
          allowClear
          value={filterState.bookingStatus}
          onChange={(val) => setFilterState({ ...filterState, bookingStatus: val })}
        >
          <Option value="PAID">Đã thanh toán</Option>
          <Option value="UNPAID">Chưa thanh toán</Option>
          <Option value="CLOSED">Đã hủy / hết hạn</Option>
        </Select>
      </div>

      {/* Table */}
      <Table
        loading={isLoading}
        dataSource={filteredRecords}
        columns={columns}
        rowKey="id"
        pagination={{ pageSize: 8 }}
        locale={{ emptyText: <Empty description="Không có booking nào" /> }}
        scroll={{ y: 420 }}
      />

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
                {renderCustomerList(selectedBooking.listOfCustomers)}
              </Descriptions.Item>

              <Descriptions.Item label="Trạng thái">
                {renderStatus(String(selectedBooking.status))}
              </Descriptions.Item>
              {selectedBooking.paymentDeadline && <Descriptions.Item label="Hạn thanh toán">
                {formatDatetime(selectedBooking.paymentDeadline)}
              </Descriptions.Item>}
            </Descriptions>

            <div className="text-right">
              {canResumePayment(selectedBooking) ? (
                <Button type="primary" onClick={goToPayment}>
                  Thanh toán ngay
                </Button>
              ) : (
                <Button onClick={closeModal}>Đóng</Button>
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
        {!selectedBooking?.invoice ? (
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
              {renderCustomerList(selectedBooking.listOfCustomers)}
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
