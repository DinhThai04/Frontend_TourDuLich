import BookingTicketModal from './BookingTicketModal';
import type { HistoryBooking } from './historyBooking';
import { errorMessage } from '@/utils/errors';
import StatusBadge from '../StatusBadge';
import { resolveOrderBadgeStatus } from '../orderBadgeStatus';
import { useEffect, useState, useCallback, useRef } from 'react';
import {
  Input,
  DatePicker,
  Select,
  Table,
  Button,
  message,
  Empty,
  Space,
  Skeleton,
} from 'antd';
import { useLocation, useNavigate } from 'react-router-dom';
import dayjs from 'dayjs';
import {
  SearchOutlined,
} from '@ant-design/icons';
import bookingServices, { type BookingHistoryRow } from '@/services/bookingServices';
import { getTourDepartureById } from '@/services/tourServices';
import invoiceServices from '@/services/invoiceServices';
import { formatDate, formatCurrencyVND } from '@/utils';

const { RangePicker } = DatePicker;
const { Option } = Select;

function historyBooking(row: BookingHistoryRow & { totalAmount?: number }): HistoryBooking {
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

export default function History({ onOpenSupport }: { onOpenSupport?: (bookingId?: number) => void }) {
  const navigate = useNavigate();
  const { search, hash, pathname } = useLocation();
  const linkedBookingId = Number(new URLSearchParams(search).get('bookingId'));
  const consumedBookingLink = useRef<number | null>(null);

  const [filterState, setFilterState] = useState({
    searchBookingId: '',
    dateRange: null as [dayjs.Dayjs, dayjs.Dayjs] | null,
    bookingStatus: '',
  });
  const [searchDraft, setSearchDraft] = useState('');
  const [bookingData, setBookingData] = useState<HistoryBooking[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [page, setPage] = useState(0);
  const [hasNext, setHasNext] = useState(false);
  const [focus, setFocus] = useState<{ id: number; booking?: HistoryBooking; error?: boolean }>();
  const [details, setDetails] = useState<{ request: string; booking: HistoryBooking }>();
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

  const openTicket = (record: HistoryBooking) => {
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
      title: <span className="whitespace-nowrap">Mã đơn</span>,
      align: 'center' as const,
      dataIndex: 'id',
      key: 'id',
      render: (id: string) => <span className="font-semibold text-[#134E48]">#{id}</span>,
    },
    {
      title: 'Tour',
      align: 'center' as const,
      key: 'tour',
      render: (_: unknown, record: HistoryBooking) => (
        <div className="mx-auto min-w-0 max-w-[260px]">
          <div className="truncate text-sm font-semibold text-[#1F2937]">
            {record.tourTitle || `Tour ${record.tourCode || `#${record.id}`}`}
          </div>
          {record.tourCode && <div className="text-xs text-[#6B7280]">{record.tourCode}</div>}
        </div>
      ),
    },
    {
      title: 'Ngày đi',
      align: 'center' as const,
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
      align: 'center' as const,
      render: (_: unknown, record: HistoryBooking) => {
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
      align: 'center' as const,
      key: 'status',
      render: (_: unknown, record: HistoryBooking) => (
        <StatusBadge
          status={resolveOrderBadgeStatus({
            status: record.status,
            reservationStatus: record.reservationStatus,
            invoiceStatus: record.invoice?.status ?? record.invoiceStatus,
            tripCompleted: record.tripCompleted,
          })}
        />
      ),
    },
    {
      title: 'Thao tác',
      key: 'action',
      align: 'center' as const,
      render: (_: unknown, record: HistoryBooking) => {
        const badge = resolveOrderBadgeStatus({
          status: record.status,
          reservationStatus: record.reservationStatus,
          invoiceStatus: record.invoice?.status ?? record.invoiceStatus,
          tripCompleted: record.tripCompleted,
        });
        const isTicket = badge === 'PAID' || badge === 'COMPLETED';
        return (
          <Button
            size="small"
            onClick={() => openTicket(record)}
            className="!h-[32px] !rounded-[8px] !border-[#1F7A6E] !text-[#1F7A6E] hover:!bg-[#E6F4F1]"
          >
            {isTicket ? 'Xem vé' : 'Xem chi tiết'}
          </Button>
        );
      },
    },
  ];


  return (
    <div className="@container rounded-[16px] border border-[#E5E7EB] bg-white p-6 shadow-[0_1px_2px_rgba(16,24,40,.04),0_8px_24px_rgba(16,24,40,.06)]">
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
          <div className="hidden @min-[680px]:block">
            <Table
              dataSource={bookingData}
              columns={columns}
              rowKey="id"
              size="small"
              scroll={{ x: 'max-content' }}
              pagination={false}
              rowClassName="hover:bg-[#F8FAFA] transition-colors"
            />
          </div>

          <div className="flex flex-col gap-3 @min-[680px]:hidden">
            {bookingData.map((record) => {
              const badge = resolveOrderBadgeStatus({
                status: record.status,
                reservationStatus: record.reservationStatus,
                invoiceStatus: record.invoice?.status ?? record.invoiceStatus,
                tripCompleted: record.tripCompleted,
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

      <BookingTicketModal
        open={modalOpen}
        selectedBooking={selectedBooking}
        detailsLoaded={Boolean(currentDetails)}
        expandPassengers={expandPassengers}
        setExpandPassengers={setExpandPassengers}
        closeModal={closeModal}
        onOpenSupport={onOpenSupport}
      />
    </div>
  );
}
