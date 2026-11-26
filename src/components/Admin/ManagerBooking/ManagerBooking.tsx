import BookingEmailHistory from './BookingEmailHistory';
import AdminLookup from '../Shared/AdminLookup';
import { adminDayKey } from '../Shared/adminDate';
import type { Dayjs } from 'dayjs';
import { formatAdminDatetime as formatDatetime } from '@/components/Admin/Shared/adminDate';
import { AdminProTable as ProTable } from '@/components/Admin/Shared/AdminTable';
import { AdminStatus } from '../Shared/AdminStatus';
import { adminPagination } from '../Shared/adminPagination';
import AdminPageHeader from '../Shared/AdminPageHeader';
import { Link, useSearchParams } from 'react-router-dom';
import React, { useState } from 'react';
import type { ProColumns } from '@ant-design/pro-components';
import type { BookingResponse, CustomerResponse } from '@/types/Booking';
import type { ITourDeparture } from '@/types/Tour';
import type { InvoiceResponse } from '@/types/Invoice';

import bookingServices from '@/services/bookingServices';
import { getUserDisplayNames } from '@/services/userServices';
import { getAllTourDeparture, getTourDepartureById, getAllTours } from '@/services/tourServices';
import invoiceServices from '@/services/invoiceServices';
import { formatCurrencyVND, formatDate, isListCapped } from '@/utils';
import { passengerLabel } from '@/utils/booking';
import { settledRows } from '@/utils/settledRows';
import { useApiQuery } from '@/hooks';
import { Alert, Tag, Drawer, Button, DatePicker, Select, Space, Descriptions, Empty, Tabs, message } from 'antd';
import { useHasPermission } from '@/config/useHasPermission';
import { ALL_PERMISSIONS as P } from '@/config/permissions';

type BookingWithFullInfo = BookingResponse & {
  userName?: string;
  tourDeparture?: ITourDeparture | null;
  listOfCustomers?: CustomerResponse[];
  invoice?: InvoiceResponse | null;
  invoiceLoadFailed?: boolean;
};

const BOOKING_STATUS: Record<string, { color: string; label: string }> = {
  CONFIRMED: { color: 'green', label: 'Đã xác nhận' },
  PENDING_PAYMENT: { color: 'orange', label: 'Chờ thanh toán' },
  UNCONFIRMED: { color: 'red', label: 'Đã hủy / chưa xác nhận' },
  PENDING: { color: 'orange', label: 'Chờ xác nhận' },
  HELD: { color: 'blue', label: 'Đang giữ chỗ' },
  CHECKOUT: { color: 'blue', label: 'Đang thanh toán' },
  PAID: { color: 'green', label: 'Đã thanh toán' },
  EXPIRED: { color: 'red', label: 'Hết hạn thanh toán' },
  CANCELLED: { color: 'red', label: 'Đã hủy' },
  COMPLETED: { color: 'green', label: 'Hoàn tất' },
};
const bookingStatus = (status?: string | null) =>
  (status && BOOKING_STATUS[status]) || { color: 'default', label: status || 'Không xác định' };

const CUSTOMER_STATUS: Record<string, string> = {
  BOOKED: 'Đã đặt',
  TRAVELING: 'Đang đi',
  COMPLETE: 'Hoàn tất',
};

/** The bulk departure list is capped; top up the referenced departures one by one without a request storm. */
const MAX_DEPARTURE_LOOKUPS = 50;

const ManagerBooking: React.FC = () => {
  const [params, setParams] = useSearchParams();
  const bookingId = params.get('bookingId');
  const departureFilter = Number(params.get('departureId')) || undefined;
  const [selectedBooking, setDetail] = useState<BookingWithFullInfo | null>(null);
  const [status, setStatus] = useState<string>();
  const [tourFilter, setTourFilter] = useState<number>();
  const [paymentFilter, setPaymentFilter] = useState<string>();
  const [range, setRange] = useState<[Dayjs | null, Dayjs | null] | null>(null);
  const canRetryEmail = useHasPermission({ code: 'SGU_SUPER_ADMIN' });
  const canSeeInvoice = useHasPermission(P.INVOICES.GET_ALL);
  const canSeeDeparture = useHasPermission(P.TOUR_DEPARTURES.GET_LIST);
  const canReconcile = useHasPermission(P.PAYMENT_RECONCILIATION.GET_LIST);
  const canSeeTours = useHasPermission(P.TOURS.GET_LIST);
  const { data: tours = [] } = useApiQuery(async () => {
    const response = await getAllTours();
    return response.code === 1000 ? response.result : [];
  }, { enabled: canSeeTours });
  const tourName = (row: BookingWithFullInfo) => tours.find(tour => Number(tour.id) === Number(row.tourDeparture?.tourId))?.tourTitle;

  /** Load toàn bộ dữ liệu; nguồn phụ lỗi thì chỉ thiếu thông tin trang trí, không làm trắng bảng. */
  const { data, loading, error: loadError } = useApiQuery(
    async () => {
      if (bookingId) {
        const id = Number(bookingId);
        if (!/^[0-9]{1,10}$/.test(bookingId) || id < 1 || id > 2147483647) throw new Error('Mã đơn không hợp lệ');
        const response = await bookingServices.getById(id);
        if (response.code !== 1000 || !response.result) throw new Error('Không tìm thấy đơn');
        const booking = response.result;
        const [departure, customers, invoice, names] = await Promise.allSettled([
          booking.tourDepartureId ? getTourDepartureById(Number(booking.tourDepartureId)) : Promise.resolve(null),
          bookingServices.getListOfCustomersByBookingId(id),
          invoiceServices.getByBookingId(id),
          getUserDisplayNames([booking.accountId]),
        ]);
        const row: BookingWithFullInfo = {
          ...booking,
          userName: (names.status === 'fulfilled' && names.value[String(booking.accountId)]) || `Tài khoản #${booking.accountId}`,
          tourDeparture: departure.status === 'fulfilled' && departure.value?.code === 1000 ? departure.value.result : null,
          listOfCustomers: customers.status === 'fulfilled' && customers.value.code === 1000 ? customers.value.result : undefined,
          invoice: invoice.status === 'fulfilled' && invoice.value.code === 1000 ? invoice.value.result : null,
          invoiceLoadFailed: invoice.status === 'rejected',
        };
        return { rows: [row], capped: false };
      }
      const [bookingRes, tourRes, customerRes, invoiceRes] = await Promise.allSettled([
        bookingServices.getAll({ departureId: departureFilter }),
        getAllTourDeparture(),
        bookingServices.getAllCustomers(),
        invoiceServices.getAll(),
      ]);

      if (bookingRes.status === 'rejected') {
        throw new Error('Không tải được danh sách đặt tour.');
      }

      const bookings: BookingResponse[] = settledRows(bookingRes);
      const departures: ITourDeparture[] = settledRows(tourRes);
      const customers: CustomerResponse[] = settledRows(customerRes);
      const invoices: InvoiceResponse[] = settledRows(invoiceRes);
      // A fulfilled-but-failed customer call is unknown data, not an empty passenger list.
      const customersUnknown =
        customerRes.status === 'rejected' ||
        (customerRes.status === 'fulfilled' && customerRes.value.code !== 1000);
      // Bookings can reference departures older than the bulk list's newest 500 rows.
      const knownDepartureIds = new Set(departures.map((d) => String(d.id)));
      const missingDepartureIds = [
        ...new Set(
          bookings
            .map((booking) => booking.tourDepartureId)
            .filter((id): id is string => !!id)
        ),
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
      // Names are decoration only; a failed lookup must not blank the booking table.
      let names: Record<string, string> = {};
      try {
        names = await getUserDisplayNames(bookings.map(booking => booking.accountId));
      } catch {
        names = {};
      }

      const rows = bookings.map((booking) => {
        const matchedDeparture = departures.find(
          (d) => String(d.id) === String(booking.tourDepartureId)
        );

        // A failed customer source is unknown, not "no passengers".
        const matchedListCustomers = customersUnknown
          ? undefined
          : customers.filter((c) => String(c.booking?.id) === String(booking.id));

        const matchedInvoice = invoices.find(
          (inv) => String(inv.bookingId) === String(booking.id)
        );

        return {
          ...booking,
          userName: names[String(booking.accountId)] || `Tài khoản #${booking.accountId}`,
          tourDeparture: matchedDeparture || null,
          listOfCustomers: matchedListCustomers,
          invoice: matchedInvoice || null,
          invoiceLoadFailed: invoiceRes.status === 'rejected',
        };
      });
      // A full server page means the table may be missing rows beyond the backend cap.
      const capped =
        isListCapped(bookings) ||
        isListCapped(invoices) ||
        isListCapped(customers) ||
        missingDepartureIds.length > MAX_DEPARTURE_LOOKUPS;
      return { rows, capped };
    },
    { deps: [bookingId, departureFilter], onError: (msg) => message.error(msg) },
  );
  const rows = loading || loadError ? [] : data?.rows ?? [];
  const detail = selectedBooking ?? (params.get('detail') === '1'
    ? rows.find(row => String(row.id) === bookingId) : null);
  function closeBooking() {
    setDetail(null);
    if (params.has('detail')) {
      const updated = new URLSearchParams(params);
      updated.delete('detail');
      setParams(updated, { replace: true });
    }
  }

  const lifecycle = (row: BookingWithFullInfo) => row.reservationStatus === 'EXPIRED' ? 'EXPIRED' : row.status;
  const scopedRows = rows.filter(row => {
    const day = adminDayKey(row.tourDeparture?.departureDate);
    return (!departureFilter || Number(row.tourDepartureId) === departureFilter) && (!tourFilter || Number(row.tourDeparture?.tourId) === tourFilter) &&
      (!paymentFilter || row.invoice?.status === paymentFilter) &&
      (!range?.[0] || day >= range[0].format('YYYY-MM-DD')) && (!range?.[1] || day <= range[1].format('YYYY-MM-DD'));
  });
  const statusOptions = [...new Set(scopedRows.map(lifecycle).filter(Boolean))];

  const columns: ProColumns<BookingWithFullInfo>[] = [
    { title: 'Đơn đặt chỗ', key: 'identity', render: (_, row) => <>
      <strong className="admin-booker-name">#{row.id} · {row.userName}</strong>
      <div className="text-xs text-slate-600">{row.createdAt ? formatDatetime(row.createdAt) : '—'}</div>
    </> },
    { title: 'Tour và lịch', key: 'departure', render: (_, row) => <>
      <strong>{tourName(row) || row.tourDeparture?.tourCode || 'Chưa rõ tour'}</strong>
      <div className="text-xs text-slate-600">{row.tourDeparture?.departureDate ? formatDatetime(row.tourDeparture.departureDate) : '—'}
        {row.listOfCustomers && ` · ${row.listOfCustomers.length} khách`}</div>
    </> },
    { title: 'Đặt chỗ', key: 'status', render: (_, row) => {
      const item = bookingStatus(lifecycle(row));
      return <AdminStatus tone={item.color === 'green' ? 'success' : item.color === 'orange' ? 'warning' : lifecycle(row) === 'EXPIRED' ? 'neutral' : item.color === 'red' ? 'danger' : 'info'}>{item.label}</AdminStatus>;
    } },
    { title: 'Thanh toán', key: 'payment', align: 'right', render: (_, row) => row.invoice ? <>
      <strong className="admin-money">{formatCurrencyVND(Number(row.invoice.totalBookingTourExpense))}</strong>
      {row.invoice.status === 'REFUNDED' && <div><AdminStatus tone="info">Đã hoàn tiền</AdminStatus></div>}
    </> : '—' },

    { title: 'Thao tác', key: 'actions', width: 110,
      render: (_, row) => <Button size="small" onClick={() => setDetail(row)}>Chi tiết</Button> },
  ];

  return (
    <div className="admin-dashboard">
      <AdminPageHeader title="Quản lý đặt chỗ" description="Tra cứu hồ sơ và theo dõi trạng thái giữ chỗ, thanh toán và khởi hành." />
      {loadError && (
        <Alert type="error" showIcon style={{ marginBottom: 16 }} message={loadError} />
      )}
      {data?.capped && (
        <Alert
          type="warning"
          showIcon
          style={{ marginBottom: 16 }}
          message="Danh sách đã đạt giới hạn 500 bản ghi mỗi nguồn. Dữ liệu có thể chưa đầy đủ, hãy thu hẹp phạm vi hoặc kiểm tra trực tiếp trước khi kết luận."
        />
      )}
      <Tabs activeKey={status ?? 'ALL'} onChange={key => setStatus(key === 'ALL' ? undefined : key)}
        items={[{ key: 'ALL', label: `Tất cả (${scopedRows.length})` }, ...statusOptions.map(key => ({
          key: key!, label: `${bookingStatus(key).label} (${scopedRows.filter(row => lifecycle(row) === key).length})`,
        }))]} />
      {departureFilter && <Alert type="info" message={`Đặt chỗ của lịch #${departureFilter}`}
        action={<Button onClick={() => { const next = new URLSearchParams(params); next.delete('departureId'); setParams(next); }}>Bỏ lọc lịch</Button>} />}
      <ProTable<BookingWithFullInfo> filterKey={JSON.stringify([status, tourFilter, paymentFilter, range, departureFilter])}

        headerTitle="Hồ sơ đặt tour"
        className="admin-data-table"
        locale={{ emptyText: <Empty image={Empty.PRESENTED_IMAGE_SIMPLE} description={bookingId || status ? 'Không có đơn khớp bộ lọc' : 'Chưa có đơn đặt tour'} /> }}
        size="small"
        scroll={{ x: 720 }}
        columns={columns}
        loading={loading}
        dataSource={status ? scopedRows.filter(row => lifecycle(row) === status) : scopedRows}
        rowKey="id"
        search={false}
        toolBarRender={() => [<Space key="lookup" wrap>
          <AdminLookup value={bookingId ?? ''} maxLength={10} placeholder="Nhập mã đơn"
            onLookup={id => { if (!id || /^[1-9][0-9]{0,9}$/.test(id) && Number(id) <= 2147483647) setParams(id ? { bookingId: id } : {}, { replace: true }); }} />
          <Select aria-label="Tour" showSearch optionFilterProp="label" allowClear placeholder="Tour" value={tourFilter} onChange={setTourFilter}
            options={tours.map(tour => ({ value: Number(tour.id), label: tour.tourTitle }))} />
          <DatePicker.RangePicker aria-label="Ngày khởi hành" format="DD/MM/YYYY" value={range} onChange={setRange} />
          <Select aria-label="Thanh toán" allowClear placeholder="Thanh toán" value={paymentFilter} onChange={setPaymentFilter}
            options={[{ value: 'PAID', label: 'Đã thanh toán' }, { value: 'REFUNDED', label: 'Đã hoàn tiền' }]} />
          {(bookingId || tourFilter || range || paymentFilter || status) && <Button onClick={() => {
            setParams({}); setTourFilter(undefined); setRange(null); setPaymentFilter(undefined); setStatus(undefined);
          }}>Xóa lọc</Button>}
        </Space>]}
        pagination={adminPagination('đơn')}
      />

      <Drawer width={640} className="admin-record-drawer" title={`Hồ sơ đặt chỗ #${detail?.id ?? ''}`}
        open={!!detail} onClose={closeBooking} destroyOnHidden>
        {detail && <div className="admin-dossier">
          <div className="admin-case-hero">
            <h2>{tourName(detail) || detail.tourDeparture?.tourCode || 'Chưa rõ tour'}</h2>
            <div className="admin-case-facts">
              <div><small>Đặt chỗ</small><Tag color={bookingStatus(detail.status).color}>{bookingStatus(detail.status).label}</Tag></div>
              <div><small>Giữ chỗ</small><strong>{detail.reservationStatus ? bookingStatus(detail.reservationStatus).label : '—'}</strong></div>
              <div><small>Thanh toán</small><strong>{detail.invoice?.status === 'PAID' ? 'Đã thanh toán' : detail.invoice?.status === 'REFUNDED' ? 'Đã hoàn tiền' : detail.invoice ? 'Chưa thanh toán' : detail.invoiceLoadFailed ? 'Chưa xác minh' : 'Chưa có hóa đơn'}</strong></div>
            </div>
          </div>
          <nav aria-label="Hồ sơ liên quan" className="admin-related-links">
            {canSeeDeparture && detail.tourDepartureId && <Link to={`/admin/managerTour/tourDeparture?departureId=${detail.tourDepartureId}`}>Mở lịch khởi hành</Link>}
            {canSeeInvoice && detail.invoice && <Link to={`/admin/managerInvoice?bookingId=${detail.id}`}>Mở hóa đơn #{detail.invoice.id}</Link>}
            {canReconcile && <Link to={`/admin/paymentReconciliation?bookingId=${detail.id}`}>Tra giao dịch để đối soát</Link>}
          </nav>
          <Tabs items={[{ key: 'overview', label: 'Tổng quan', children: <section className="admin-dossier-pair">
            <Descriptions title="Thông tin đặt chỗ" size="small" column={1} items={[
              { key: 'user', label: 'Tài khoản', children: detail.userName || '—' },
              { key: 'created', label: 'Ngày đặt', children: detail.createdAt ? formatDatetime(detail.createdAt) : '—' },
              ...(detail.paymentDeadline ? [{ key: 'deadline', label: 'Hạn thanh toán', children: formatDatetime(detail.paymentDeadline) }] : []),
            ]} />
            <Descriptions title="Lịch khởi hành" size="small" column={1} items={[
              { key: 'id', label: 'Mã lịch', children: detail.tourDepartureId ? `#${detail.tourDepartureId}` : '—' },
              { key: 'out', label: 'Ngày đi', children: detail.tourDeparture?.departureDate ? formatDatetime(detail.tourDeparture.departureDate) : '—' },
              { key: 'back', label: 'Ngày về', children: detail.tourDeparture?.returnDate ? formatDatetime(detail.tourDeparture.returnDate) : '—' },
            ]} />
          </section> }, { key: 'passengers', label: 'Hành khách', children: <section className="admin-dossier-section">
            <h3>Hành khách {detail.listOfCustomers && <Tag>{detail.listOfCustomers.length}</Tag>}</h3>
            {detail.listOfCustomers === undefined ? <Alert type="warning" message="Chưa tải được dữ liệu khách." /> :
              detail.listOfCustomers.length ? <ul className="admin-passenger-list">
                {detail.listOfCustomers.map((customer, index) => <li key={customer.id ?? index}>
                  <div><strong>{customer.fullName}</strong><div>{customer.dateOfBirth ? formatDate(customer.dateOfBirth) : '—'} · {customer.address || '—'}</div></div>
                  <div>{passengerLabel(customer.bookingType)} · {(customer.status && CUSTOMER_STATUS[customer.status]) || customer.status || '—'}</div>
                </li>)}
              </ul> : <Empty image={Empty.PRESENTED_IMAGE_SIMPLE} description="Chưa có hành khách" />}
          </section> }, { key: 'payment', label: 'Thanh toán', children: <section className="admin-dossier-section">
            <h3>Chứng từ thanh toán</h3>
            {detail.invoiceLoadFailed ? <Alert type="warning" message="Chưa tải được dữ liệu hóa đơn." /> : detail.invoice ?
              <Descriptions size="small" column={1} items={[
                { key: 'id', label: 'Mã hóa đơn', children: `#${detail.invoice.id}` },
                { key: 'amount', label: 'Số tiền', children: <strong>{formatCurrencyVND(Number(detail.invoice.totalBookingTourExpense))}</strong> },
                { key: 'paid', label: 'Ngày thanh toán', children: detail.invoice.dayOfPay ? formatDatetime(detail.invoice.dayOfPay) : '—' },
              ]} /> : <p>Chưa có hóa đơn trong dữ liệu được cấp.</p>}
          </section> }, { key: 'email', label: 'Email', children: <BookingEmailHistory key={detail.id} canRetry={canRetryEmail} bookingId={Number(detail.id)} /> }]} />
        </div>}
      </Drawer>
    </div>
  );
};

export default ManagerBooking;
