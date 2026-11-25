import { errorMessage } from '@/utils/errors';
import StatusBadge, { resolveOrderBadgeStatus } from '../StatusBadge';
import { useEffect, useState, useCallback, useRef } from 'react';
import {
  Input,
  DatePicker,
  Select,
  Table,
  Modal,
  Button,
  message,
  Empty,
  Space,
  Spin,
  Skeleton,
  Dropdown,
  Tooltip,
  QRCode,
} from 'antd';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import dayjs from 'dayjs';
import {
  CloseOutlined,
  EllipsisOutlined,
  InfoCircleOutlined,
  SearchOutlined,
  StarFilled,
} from '@ant-design/icons';
import bookingServices, { type BookingHistoryRow } from '@/services/bookingServices';
import { getTourDepartureById } from '@/services/tourServices';
import invoiceServices from '@/services/invoiceServices';
import { formatDate, formatCurrencyVND } from '@/utils';
import { passengerLabel } from '@/utils/booking';
import { paymentMethodLabel } from '@/utils/adminInvoices';
import { tourScheduleLink } from '@/utils/tourSchedule';
import { useAppSelector } from '@/store/hooks';
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
  totalAmount?: number;
  tourDeparture?: ITourDeparture | null;
  listOfCustomers?: CustomerResponse[];
  invoice?: InvoiceResponse | null;
};

function historyBooking(row: BookingHistoryRow & { totalAmount?: number }): BookingWithFullInfo {
  return {
    ...row.booking,
    tourCode: row.tourCode,
    tourTitle: row.tourTitle,
    departureDate: row.departureDate,
    returnDate: row.returnDate,
    invoiceStatus: row.invoiceStatus,
    totalAmount: row.totalAmount,
  };
}

function fmtShortDateTime(val?: string) {
  if (!val) return '';
  const d = dayjs(val);
  return d.isValid() ? d.format('HH:mm · DD/MM/YYYY') : '';
}

export default function History({ onOpenSupport }: { onOpenSupport?: () => void }) {
  const navigate = useNavigate();
  const { search, hash, pathname } = useLocation();
  const { user } = useAppSelector((s) => s.auth);
  const linkedBookingId = Number(new URLSearchParams(search).get('bookingId'));
  const consumedBookingLink = useRef<number | null>(null);

  const [filterState, setFilterState] = useState({
    searchBookingId: '',
    dateRange: null as [dayjs.Dayjs, dayjs.Dayjs] | null,
    bookingStatus: '',
  });
  const [searchDraft, setSearchDraft] = useState('');
  const [bookingData, setBookingData] = useState<BookingWithFullInfo[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [page, setPage] = useState(0);
  const [hasNext, setHasNext] = useState(false);
  const [focus, setFocus] = useState<{ id: number; booking?: BookingWithFullInfo; error?: boolean }>();
  const [details, setDetails] = useState<{ request: string; booking: BookingWithFullInfo }>();
  const [loadError, setLoadError] = useState<string | null>(null);
  const [selectedBookingId, setSelectedBookingId] = useState<string | null>(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [expandPassengers, setExpandPassengers] = useState(false);

  const bookingSummary =
    bookingData.find((r) => r.id === selectedBookingId) ??
    (String(focus?.id) === selectedBookingId ? focus?.booking : undefined);
  const detailKey = `${selectedBookingId}`;
  const currentDetails = details?.request === detailKey ? details : undefined;
  const selectedBooking = currentDetails?.booking ?? bookingSummary;

  const hasFilters = Boolean(
    filterState.searchBookingId || filterState.dateRange || filterState.bookingStatus,
  );

  useEffect(() => {
    if (!linkedBookingId) {
      consumedBookingLink.current = null;
      return;
    }
    if (consumedBookingLink.current === linkedBookingId) return;
    let active = true;
    void bookingServices
      .ownHistory({ bookingId: linkedBookingId })
      .then(({ code, result }) => {
        if (!active) return;
        const row = code === 1000 ? result.items[0] : undefined;
        if (!row) {
          setFocus({ id: linkedBookingId, error: true });
          return;
        }
        const booking = historyBooking(row as BookingHistoryRow & { totalAmount?: number });
        setFocus({ id: linkedBookingId, booking });
        consumedBookingLink.current = linkedBookingId;
        setSelectedBookingId(booking.id);
        setModalOpen(true);
      })
      .catch(() => {
        if (active) setFocus({ id: linkedBookingId, error: true });
      });
    return () => {
      active = false;
    };
  }, [linkedBookingId]);

  useEffect(() => {
    if (!bookingSummary?.id || !modalOpen) return;
    let active = true;
    const id = Number(bookingSummary.id);
    void Promise.allSettled([
      bookingServices.getById(id),
      bookingServices.getListOfCustomersByBookingId(id),
      invoiceServices.getByBookingId(id),
      bookingSummary.tourDepartureId
        ? getTourDepartureById(Number(bookingSummary.tourDepartureId))
        : Promise.resolve(null),
    ]).then(([booking, customers, invoice, departure]) => {
      if (!active) return;
      const first =
        booking.status === 'fulfilled' && booking.value.code === 1000 ? booking.value.result : undefined;
      const customerList =
        customers.status === 'fulfilled' && customers.value.code === 1000 ? customers.value.result : undefined;
      const invoiceRecord =
        invoice.status === 'fulfilled' && invoice.value.code === 1000 ? invoice.value.result : null;
      const departureRecord =
        departure.status === 'fulfilled' && departure.value?.code === 1000 ? departure.value.result : null;
      setDetails({
        request: detailKey,
        booking: {
          ...bookingSummary,
          ...first,
          listOfCustomers: customerList,
          invoice: invoiceRecord,
          tourDeparture: departureRecord,
          departureDate: bookingSummary.departureDate || departureRecord?.departureDate,
          returnDate: bookingSummary.returnDate || departureRecord?.returnDate,
          tourCode: bookingSummary.tourCode || departureRecord?.tourCode,
        },
      });
    });
    return () => {
      active = false;
    };
  }, [bookingSummary, detailKey, modalOpen]);

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
      setBookingData(result.items.map((r) => historyBooking(r as BookingHistoryRow & { totalAmount?: number })));
      setHasNext(result.hasNext);
      if (!result.items.length && page > 0) setPage((v) => v - 1);
    } catch (failure) {
      if (fetchId.current === current) {
        setLoadError(errorMessage(failure, 'Chưa tải được lịch sử đặt tour'));
      }
    } finally {
      if (fetchId.current === current) setIsLoading(false);
    }
  }, [filterState, page]);

  useEffect(() => {
    void fetchAllData();
    return () => {
      fetchId.current += 1;
    };
  }, [fetchAllData]);

  const openTicket = (record: BookingWithFullInfo) => {
    setSelectedBookingId(record.id);
    setExpandPassengers(false);
    setModalOpen(true);
  };

  const closeModal = () => {
    setModalOpen(false);
    setSelectedBookingId(null);
    if (linkedBookingId) {
      const params = new URLSearchParams(search);
      params.delete('bookingId');
      navigate({ pathname, search: params.toString(), hash }, { replace: true, preventScrollReset: true });
    }
  };

  const handleSearchSubmit = () => {
    const id = searchDraft.trim();
    if (id && (!/^\d{1,10}$/.test(id) || Number(id) < 1 || Number(id) > 2147483647)) {
      message.warning('Vui lòng nhập mã đơn dạng số.');
      return;
    }
    setPage(0);
    setFilterState((prev) => ({ ...prev, searchBookingId: id }));
  };

  const clearFilters = () => {
    setSearchDraft('');
    setPage(0);
    setFilterState({ searchBookingId: '', dateRange: null, bookingStatus: '' });
  };

  const columns = [
    {
      title: 'Mã đơn',
      dataIndex: 'id',
      key: 'id',
      render: (id: string) => <span className="font-semibold text-[#134E48]">#{id}</span>,
    },
    {
      title: 'Tour',
      key: 'tour',
      render: (_: unknown, record: BookingWithFullInfo) => (
        <div className="min-w-0 max-w-[260px]">
          <div className="truncate text-sm font-semibold text-[#1F2937]">
            {record.tourTitle || `Tour ${record.tourCode || `#${record.id}`}`}
          </div>
          {record.tourCode && <div className="text-xs text-[#6B7280]">{record.tourCode}</div>}
        </div>
      ),
    },
    {
      title: 'Ngày đi',
      dataIndex: 'departureDate',
      key: 'departureDate',
      render: (d: string | undefined) => (
        <span className="whitespace-nowrap text-sm text-[#1F2937]">
          {d ? formatDate(d) : 'Đang cập nhật'}
        </span>
      ),
    },
    {
      title: 'Tổng tiền',
      key: 'totalAmount',
      align: 'right' as const,
      render: (_: unknown, record: BookingWithFullInfo) => {
        const amt = record.invoice?.totalBookingTourExpense ?? record.totalAmount;
        return (
          <span className="whitespace-nowrap font-semibold tabular-nums text-[#134E48]">
            {amt != null ? formatCurrencyVND(Number(amt)) : ''}
          </span>
        );
      },
    },
    {
      title: 'Trạng thái',
      key: 'status',
      render: (_: unknown, record: BookingWithFullInfo) => (
        <StatusBadge
          status={resolveOrderBadgeStatus({
            status: record.status,
            reservationStatus: record.reservationStatus,
            invoiceStatus: record.invoice?.status ?? record.invoiceStatus,
            returnDate: record.returnDate,
          })}
        />
      ),
    },
    {
      title: 'Thao tác',
      key: 'action',
      align: 'right' as const,
      render: (_: unknown, record: BookingWithFullInfo) => {
        const badge = resolveOrderBadgeStatus({
          status: record.status,
          reservationStatus: record.reservationStatus,
          invoiceStatus: record.invoice?.status ?? record.invoiceStatus,
          returnDate: record.returnDate,
        });
        const isTicket = badge === 'PAID' || badge === 'COMPLETED';
        return (
          <Space size={6}>
            <Button
              size="small"
              onClick={() => openTicket(record)}
              className="!h-[32px] !rounded-[8px] !border-[#1F7A6E] !text-[#1F7A6E] hover:!bg-[#E6F4F1]"
            >
              {isTicket ? 'Xem vé' : 'Xem chi tiết'}
            </Button>
            {badge === 'PAID' && onOpenSupport && (
              <Dropdown
                trigger={['click']}
                menu={{
                  items: [
                    {
                      key: 'support',
                      label: 'Yêu cầu hỗ trợ',
                      onClick: () => onOpenSupport(),
                    },
                  ],
                }}
              >
                <Button
                  size="small"
                  aria-label="Thao tác khác"
                  icon={<EllipsisOutlined />}
                  className="!h-[32px] !w-[32px] !rounded-[8px]"
                />
              </Dropdown>
            )}
          </Space>
        );
      },
    },
  ];

  const ticketBadge = selectedBooking
    ? resolveOrderBadgeStatus({
        status: selectedBooking.status,
        reservationStatus: selectedBooking.reservationStatus,
        invoiceStatus: selectedBooking.invoice?.status ?? selectedBooking.invoiceStatus,
        returnDate: selectedBooking.returnDate,
      })
    : 'PENDING';

  const isClosed = ticketBadge === 'EXPIRED' || ticketBadge === 'CANCELLED';
  const isPaidOrDone = ticketBadge === 'PAID' || ticketBadge === 'COMPLETED';
  const customers = selectedBooking?.listOfCustomers ?? [];
  const visibleCustomers = expandPassengers ? customers : customers.slice(0, 4);

  return (
    <div className="rounded-[16px] border border-[#E5E7EB] bg-white p-6 shadow-[0_1px_2px_rgba(16,24,40,.04),0_8px_24px_rgba(16,24,40,.06)]">
      {/* Header */}
      <div className="mb-5 flex flex-wrap items-baseline justify-between gap-2">
        <div className="flex items-center gap-3">
          <h1 className="m-0 text-[22px] font-semibold leading-[28px] text-[#1F2937]">
            Đơn đặt chỗ của tôi
          </h1>
          {!isLoading && (
            <span className="rounded-full bg-[#E6F4F1] px-2.5 py-0.5 text-xs font-semibold text-[#134E48]">
              {bookingData.length} đơn
            </span>
          )}
        </div>
      </div>

      {loadError && (
        <div className="mb-4 flex items-center justify-between gap-3 rounded-[10px] border border-[#A7D7CF] bg-[#E6F4F1] px-4 py-3 text-sm text-[#134E48]">
          <span>{loadError}</span>
          <Button size="small" onClick={() => void fetchAllData()}>
            Thử lại
          </Button>
        </div>
      )}

      {/* Filter Bar: single row, 40px height, 12px gap */}
      <div className="mb-5 flex flex-wrap items-center gap-3">
        <Input
          allowClear
          prefix={<SearchOutlined className="text-[#6B7280]" />}
          placeholder="Nhập mã đơn rồi nhấn Enter"
          aria-label="Tìm theo mã đơn"
          value={searchDraft}
          onChange={(e) => {
            setSearchDraft(e.target.value);
            if (!e.target.value) {
              setPage(0);
              setFilterState((p) => ({ ...p, searchBookingId: '' }));
            }
          }}
          onPressEnter={handleSearchSubmit}
          className="!h-[40px] !w-full !rounded-[10px] sm:!w-[220px]"
        />
        <RangePicker
          value={filterState.dateRange}
          onChange={(range) => {
            setPage(0);
            setFilterState((p) => ({
              ...p,
              dateRange: range?.[0] && range[1] ? [range[0], range[1]] : null,
            }));
          }}
          className="!h-[40px] !w-full !rounded-[10px] sm:!w-[240px]"
        />
        <Select
          placeholder="Trạng thái"
          allowClear
          value={filterState.bookingStatus || undefined}
          onChange={(val) => {
            setPage(0);
            setFilterState((p) => ({ ...p, bookingStatus: val ?? '' }));
          }}
          className="!h-[40px] !w-full sm:!w-[175px]"
        >
          <Option value="PAID">Đã thanh toán</Option>
          <Option value="UNPAID">Chưa thanh toán</Option>
          <Option value="CLOSED">Đã hủy / hết hạn</Option>
        </Select>
        {hasFilters && (
          <button
            type="button"
            onClick={clearFilters}
            className="cursor-pointer border-0 bg-transparent text-sm font-medium text-[#1F7A6E] hover:underline"
          >
            Xóa lọc
          </button>
        )}
      </div>

      {/* Content: Skeleton -> Empty -> Desktop Table / Mobile Cards (NO scrollbars) */}
      {isLoading ? (
        <Skeleton active paragraph={{ rows: 5 }} />
      ) : bookingData.length === 0 ? (
        <Empty
          description={<span className="text-sm text-[#6B7280]">Bạn chưa có đơn đặt chỗ nào phù hợp.</span>}
          className="py-8"
        >
          <Button
            type="primary"
            className="!h-[40px] !rounded-[10px] !bg-[#1F7A6E]"
            onClick={() => navigate('/tours')}
          >
            Khám phá tour
          </Button>
        </Empty>
      ) : (
        <>
          <div className="hidden md:block">
            <Table
              dataSource={bookingData}
              columns={columns}
              rowKey="id"
              pagination={false}
              rowClassName="hover:bg-[#F8FAFA] transition-colors"
            />
          </div>

          {/* Mobile Card List (< 768px) */}
          <div className="flex flex-col gap-3 md:hidden">
            {bookingData.map((record) => {
              const badge = resolveOrderBadgeStatus({
                status: record.status,
                reservationStatus: record.reservationStatus,
                invoiceStatus: record.invoice?.status ?? record.invoiceStatus,
                returnDate: record.returnDate,
              });
              const amt = record.invoice?.totalBookingTourExpense ?? record.totalAmount;
              return (
                <div
                  key={record.id}
                  className="rounded-xl border border-[#E5E7EB] bg-[#F8FAFA] p-4 space-y-2.5"
                >
                  <div className="flex items-center justify-between gap-2">
                    <span className="font-semibold text-[#134E48]">#{record.id}</span>
                    <StatusBadge status={badge} />
                  </div>
                  <div className="text-sm font-semibold text-[#1F2937]">
                    {record.tourTitle || `Tour ${record.tourCode || ''}`}
                  </div>
                  <div className="flex items-center justify-between text-xs text-[#6B7280]">
                    <span>Ngày đi: {record.departureDate ? formatDate(record.departureDate) : 'Đang cập nhật'}</span>
                    {amt != null && (
                      <strong className="text-sm text-[#134E48]">{formatCurrencyVND(Number(amt))}</strong>
                    )}
                  </div>
                  <div className="pt-1">
                    <Button
                      block
                      size="small"
                      onClick={() => openTicket(record)}
                      className="!h-[36px] !rounded-[8px] !border-[#1F7A6E] !text-[#1F7A6E]"
                    >
                      {badge === 'PAID' || badge === 'COMPLETED' ? 'Xem vé' : 'Xem chi tiết'}
                    </Button>
                  </div>
                </div>
              );
            })}
          </div>

          {(page > 0 || hasNext) && (
            <div className="mt-5 flex items-center justify-between border-t border-[#E5E7EB] pt-4 text-sm text-[#6B7280]">
              <span>Trang {page + 1}</span>
              <Space>
                <Button disabled={page === 0} onClick={() => setPage((v) => v - 1)}>
                  Trang trước
                </Button>
                <Button disabled={!hasNext} onClick={() => setPage((v) => v + 1)}>
                  Trang sau
                </Button>
              </Space>
            </div>
          )}
        </>
      )}

      {/* E-Ticket Modal */}
      <Modal
        open={modalOpen}
        onCancel={closeModal}
        footer={null}
        closable={false}
        width={880}
        centered
        style={{ maxWidth: '94vw' }}
        styles={{
          content: { background: 'transparent', boxShadow: 'none', padding: 0 },
          mask: { backdropFilter: 'blur(3px)' },
        }}
      >
        {selectedBooking && (
          <div style={{ filter: 'drop-shadow(0 18px 40px rgba(16, 24, 40, 0.22))' }}>
            <div className="relative overflow-hidden rounded-[20px] bg-white">
              {/* Top & Bottom Semicircle Ticket Notches at 40% perforation (desktop) */}
              <span
                aria-hidden="true"
                className="pointer-events-none absolute -top-3 left-[40%] z-20 hidden h-6 w-6 -translate-x-1/2 rounded-full bg-black/45 md:block"
              />
              <span
                aria-hidden="true"
                className="pointer-events-none absolute -bottom-3 left-[40%] z-20 hidden h-6 w-6 -translate-x-1/2 rounded-full bg-black/45 md:block"
              />

              {/* Watermark for EXPIRED / CANCELLED */}
              {isClosed && (
                <div
                  aria-hidden="true"
                  className="pointer-events-none absolute inset-0 z-10 flex items-center justify-center overflow-hidden"
                >
                  <span className="-rotate-12 select-none text-6xl font-black tracking-[0.2em] text-[#1F2937] opacity-[0.07]">
                    {ticketBadge === 'EXPIRED' ? 'HẾT HẠN' : 'ĐÃ HỦY'}
                  </span>
                </div>
              )}

              {/* Ticket Header Strip */}
              <div
                style={{
                  background: isClosed
                    ? 'linear-gradient(90deg, #374151 0%, #4B5563 100%)'
                    : 'linear-gradient(90deg, #134E48 0%, #1F7A6E 100%)',
                }}
                className="flex flex-wrap items-center justify-between gap-3 px-6 py-4 text-white"
              >
                <div>
                  <div className="text-[11px] font-semibold uppercase tracking-[0.14em] text-white/80">
                    SGU TOUR · E-TICKET
                  </div>
                  <div className="mt-0.5 text-lg font-bold">Đơn đặt tour #{selectedBooking.id}</div>
                </div>
                <div className="flex items-center gap-3">
                  <StatusBadge status={ticketBadge} />
                  <button
                    type="button"
                    aria-label="Đóng cửa sổ"
                    onClick={closeModal}
                    className="flex h-8 w-8 cursor-pointer items-center justify-center rounded-full border-0 bg-white/15 text-white transition hover:bg-white/25"
                  >
                    <CloseOutlined />
                  </button>
                </div>
              </div>

              {/* Ticket Body: Left 40% | Right 60% */}
              <div className="grid grid-cols-1 md:grid-cols-[40%_60%]">
                {/* LEFT HALF: Passenger Info + QR */}
                <div className="flex flex-col justify-between p-6 md:border-r md:border-dashed md:border-[#D1D5DB]">
                  <div className="space-y-4">
                    <h3 className="m-0 text-sm font-semibold uppercase tracking-wide text-[#134E48]">
                      Thông tin hành khách
                    </h3>

                    <div className="space-y-1.5 rounded-xl bg-[#F8FAFA] p-3 text-xs text-[#1F2937]">
                      <div className="flex justify-between">
                        <span className="text-[#6B7280]">Mã đơn</span>
                        <span className="font-semibold">#{selectedBooking.id}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-[#6B7280]">Ngày đặt</span>
                        <span className="font-semibold">{fmtShortDateTime(String(selectedBooking.createdAt))}</span>
                      </div>
                      {(ticketBadge === 'PENDING' || ticketBadge === 'EXPIRED') && selectedBooking.paymentDeadline && (
                        <div className="flex justify-between">
                          <span className="text-[#6B7280]">Hạn thanh toán</span>
                          <span
                            className={
                              ticketBadge === 'EXPIRED'
                                ? 'font-medium text-[#6B7280]'
                                : 'font-semibold text-[#C2410C]'
                            }
                          >
                            {fmtShortDateTime(selectedBooking.paymentDeadline)}
                            {ticketBadge === 'EXPIRED' ? ' (đã quá hạn)' : ''}
                          </span>
                        </div>
                      )}
                    </div>

                    {user && (
                      <div className="text-xs text-[#6B7280]">
                        <div className="font-semibold text-[#1F2937]">Người liên hệ: {user.username}</div>
                        <div>
                          {[user.phone, user.email].filter(Boolean).join(' · ')}
                        </div>
                      </div>
                    )}

                    {/* Passenger List */}
                    <div>
                      {!currentDetails ? (
                        <Spin size="small" />
                      ) : customers.length === 0 ? (
                        <p className="text-xs text-[#6B7280]">Chưa có danh sách hành khách.</p>
                      ) : (
                        <div className="space-y-2">
                          {visibleCustomers.map((c) => {
                            const isMale = ['true', 'male', '1'].includes(String(c.gender).toLowerCase());
                            const letter = (c.fullName || 'K').trim().charAt(0).toUpperCase();
                            return (
                              <div key={c.id} className="flex items-center justify-between gap-2 text-xs">
                                <div className="flex min-w-0 items-center gap-2.5">
                                  <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-[#E6F4F1] text-xs font-bold text-[#134E48]">
                                    {letter}
                                  </span>
                                  <div className="min-w-0">
                                    <div className="truncate font-semibold text-[#1F2937]">{c.fullName}</div>
                                    <div className="text-[11px] text-[#6B7280]">
                                      {isMale ? 'Nam' : 'Nữ'}
                                      {c.dateOfBirth ? ` · ${formatDate(c.dateOfBirth)}` : ''}
                                    </div>
                                  </div>
                                </div>
                                <span className="shrink-0 rounded-full bg-[#F3F4F6] px-2 py-0.5 text-[11px] font-medium text-[#4B5563]">
                                  {passengerLabel(c.bookingType)}
                                </span>
                              </div>
                            );
                          })}
                          {customers.length > 4 && !expandPassengers && (
                            <button
                              type="button"
                              onClick={() => setExpandPassengers(true)}
                              className="cursor-pointer border-0 bg-transparent p-0 text-xs font-semibold text-[#1F7A6E] hover:underline"
                            >
                              +{customers.length - 4} hành khách khác
                            </button>
                          )}
                          <div className="border-t border-[#E5E7EB] pt-2 text-xs font-medium text-[#6B7280]">
                            Tổng {customers.length} hành khách
                          </div>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* QR Code only for Paid / Completed */}
                  {isPaidOrDone && (
                    <div className="mt-4 flex items-center gap-3 border-t border-[#E5E7EB] pt-4">
                      <QRCode
                        value={`SGU-TOUR|BOOKING:${selectedBooking.id}|CODE:${selectedBooking.tourCode || ''}`}
                        size={88}
                        bordered={false}
                      />
                      <div className="text-xs text-[#6B7280]">
                        <div className="font-semibold text-[#134E48]">Mã check-in điện tử</div>
                        <div>Xuất trình khi lên xe cùng SGU Tour.</div>
                      </div>
                    </div>
                  )}
                </div>

                {/* RIGHT HALF: Tour Info + Invoice + Actions */}
                <div className="flex flex-col justify-between bg-[#FBFDFD] p-6">
                  <div className="space-y-5">
                    {/* Tour Info */}
                    <div>
                      <h3 className="m-0 mb-2 text-sm font-semibold uppercase tracking-wide text-[#134E48]">
                        Thông tin chuyến đi
                      </h3>
                      <div className="text-lg font-bold leading-snug text-[#1F2937]">
                        {selectedBooking.tourTitle || `Tour ${selectedBooking.tourCode || ''}`}
                      </div>
                      {selectedBooking.tourCode && (
                        <div className="mt-0.5 text-xs text-[#6B7280]">Mã tour: {selectedBooking.tourCode}</div>
                      )}

                      <div className="mt-3 grid grid-cols-2 gap-3 rounded-xl bg-white p-3.5 text-xs border border-[#E5E7EB]">
                        {selectedBooking.departureDate && (
                          <div>
                            <div className="text-[#6B7280]">Ngày khởi hành</div>
                            <div className="mt-0.5 font-semibold text-[#1F2937]">
                              {fmtShortDateTime(selectedBooking.departureDate)}
                            </div>
                          </div>
                        )}
                        {selectedBooking.returnDate && (
                          <div>
                            <div className="text-[#6B7280]">Ngày kết thúc</div>
                            <div className="mt-0.5 font-semibold text-[#1F2937]">
                              {fmtShortDateTime(selectedBooking.returnDate)}
                            </div>
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Invoice Section */}
                    <div>
                      <h3 className="m-0 mb-2 text-sm font-semibold uppercase tracking-wide text-[#134E48]">
                        Hóa đơn thanh toán
                      </h3>
                      {!currentDetails ? (
                        <Spin size="small" />
                      ) : selectedBooking.invoice ? (
                        <div className="space-y-2 rounded-xl border border-[#E5E7EB] bg-white p-4 text-xs">
                          <div className="flex justify-between">
                            <span className="text-[#6B7280]">Mã hóa đơn</span>
                            <span className="font-semibold text-[#1F2937]">#{selectedBooking.invoice.id}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-[#6B7280]">Phương thức</span>
                            <span className="font-semibold text-[#1F2937]">
                              {paymentMethodLabel(selectedBooking.invoice.paymentMethodId)}
                            </span>
                          </div>
                          {selectedBooking.invoice.dayOfPay && (
                            <div className="flex justify-between">
                              <span className="text-[#6B7280]">Thời điểm thanh toán</span>
                              <span className="font-semibold text-[#1F2937]">
                                {fmtShortDateTime(String(selectedBooking.invoice.dayOfPay))}
                              </span>
                            </div>
                          )}
                          <div className="flex items-baseline justify-between border-t border-[#E5E7EB] pt-2.5">
                            <span className="text-sm font-semibold text-[#1F2937]">Tổng cộng</span>
                            <strong className="text-lg font-bold text-[#134E48]">
                              {formatCurrencyVND(Number(selectedBooking.invoice.totalBookingTourExpense))}
                            </strong>
                          </div>
                        </div>
                      ) : isClosed ? (
                        <div className="flex items-start gap-2.5 rounded-xl bg-[#F8FAFA] p-4 text-xs leading-relaxed text-[#4B5563] border border-[#E5E7EB]">
                          <InfoCircleOutlined className="mt-0.5 text-sm text-[#1F7A6E]" />
                          <div>
                            Đơn đã {ticketBadge === 'EXPIRED' ? 'hết hạn thanh toán' : 'bị hủy'}
                            {selectedBooking.paymentDeadline
                              ? ` lúc ${fmtShortDateTime(selectedBooking.paymentDeadline)}`
                              : ''}{' '}
                            nên không phát sinh hóa đơn.{' '}
                            {onOpenSupport && (
                              <button
                                type="button"
                                onClick={() => {
                                  closeModal();
                                  onOpenSupport();
                                }}
                                className="cursor-pointer border-0 bg-transparent p-0 font-semibold text-[#1F7A6E] hover:underline"
                              >
                                Liên hệ hỗ trợ
                              </button>
                            )}
                          </div>
                        </div>
                      ) : (
                        <div className="rounded-xl border border-[#E5E7EB] bg-white p-4 text-xs text-[#6B7280]">
                          Đơn đang chờ thanh toán.
                          {selectedBooking.totalAmount != null && (
                            <div className="mt-2 flex items-baseline justify-between border-t border-[#E5E7EB] pt-2">
                              <span className="text-sm font-semibold text-[#1F2937]">Tổng dự kiến</span>
                              <strong className="text-base font-bold text-[#134E48]">
                                {formatCurrencyVND(Number(selectedBooking.totalAmount))}
                              </strong>
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Ticket Footer Actions */}
                  <div className="mt-6 flex flex-wrap items-center justify-end gap-2.5 border-t border-[#E5E7EB] pt-4">
                    {ticketBadge === 'PENDING' && (
                      <Button
                        type="primary"
                        className="!h-[40px] !rounded-[10px] !bg-[#1F7A6E]"
                        onClick={() => navigate(`/invoice/booking/${selectedBooking.id}`)}
                      >
                        Thanh toán ngay
                      </Button>
                    )}

                    {ticketBadge === 'PAID' && (
                      <>
                        {onOpenSupport && (
                          <Button
                            className="!h-[40px] !rounded-[10px] !border-[#1F7A6E] !text-[#1F7A6E]"
                            onClick={() => {
                              closeModal();
                              onOpenSupport();
                            }}
                          >
                            Yêu cầu hỗ trợ
                          </Button>
                        )}
                        <Tooltip title="Bạn có thể đánh giá sau khi chuyến đi kết thúc">
                          <Button
                            disabled
                            icon={<StarFilled />}
                            className="!h-[40px] !rounded-[10px] !border-[#E5E7EB] !bg-[#E5E7EB] !text-[#9CA3AF]"
                          >
                            Đánh giá tour
                          </Button>
                        </Tooltip>
                      </>
                    )}

                    {ticketBadge === 'COMPLETED' && selectedBooking.tourDeparture?.tourId && (
                      <Button
                        type="primary"
                        icon={<StarFilled />}
                        className="!h-[40px] !rounded-[10px] !bg-[#1F7A6E]"
                        onClick={() => {
                          closeModal();
                          navigate(`/tours/detail/${selectedBooking.tourDeparture!.tourId}#danh-gia`);
                        }}
                      >
                        Đánh giá tour
                      </Button>
                    )}

                    {isClosed && selectedBooking.tourDeparture?.tourId && (
                      <Link
                        to={tourScheduleLink(selectedBooking.tourDeparture.tourId)}
                        className="inline-flex h-[40px] items-center rounded-[10px] bg-[#1F7A6E] px-4 text-sm font-semibold text-white no-underline transition hover:bg-[#176258]"
                      >
                        Đặt lại tour này
                      </Link>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}
