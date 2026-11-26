import { adminDayKey } from '../Shared/adminDate';
import type { Dayjs } from 'dayjs';
import { formatAdminDatetime as formatDatetime } from '@/components/Admin/Shared/adminDate';
import { AdminProTable as ProTable } from '@/components/Admin/Shared/AdminTable';
import { AdminStatus } from '../Shared/AdminStatus';
import { adminPagination } from '../Shared/adminPagination';
import AdminPageHeader from '../Shared/AdminPageHeader';
import { adminInvoiceRows, paymentMethodLabel } from '@/utils/adminInvoices';
import React, { useState } from 'react';
import type { ProColumns } from '@ant-design/pro-components';
import { Alert, Tag, Drawer, Descriptions, Button, DatePicker, Empty, Input, Select, Skeleton, Space, Typography } from 'antd';
import { Link, useSearchParams } from 'react-router-dom';
import api from '@/api/axios';
import type { ApiResponse } from '@/types/comment';

import bookingServices from '@/services/bookingServices';
import invoiceServices from '@/services/invoiceServices';
import { getUserDisplayNames } from '@/services/userServices';
import { getAllTourDeparture, getAllTours, getTourDepartureById } from '@/services/tourServices';
import { formatCurrencyVND, formatDate, isListCapped } from '@/utils';
import type { BookingResponse, CustomerResponse } from '@/types/Booking';
import type { InvoiceResponse } from '@/types/Invoice';
import type { ITourDeparture } from '@/types/Tour';
import { settledRows } from '@/utils/settledRows';
import { useApiQuery } from '@/hooks';
import { ALL_PERMISSIONS } from '@/config/permissions';
import { useHasPermission } from '@/config/useHasPermission';

type BookingWithInvoice = BookingResponse & {
  userName?: string;
  tourDeparture?: ITourDeparture | null;
  tourName?: string | null;
  listOfCustomers?: CustomerResponse[];
  invoice?: InvoiceResponse | null;
  invoiceAmount?: number;
  invoiceStatus?: string | null;
  paymentMethod?: string | null;
};

type InvoiceTransaction = { provider: string; reference: string; provider_reference?: string; status: string };
const invoiceStatusLabel = (status?: string | null) => status === 'REFUNDED' ? 'Đã hoàn tiền' : status === 'PAID' ? 'Đã thanh toán' : 'Chưa thanh toán';

function InvoiceTransactions({ bookingId, canReconcile }: { bookingId: string; canReconcile: boolean }) {
  const { data, loading, error } = useApiQuery(async () => {
    const response: ApiResponse<InvoiceTransaction[]> = await api.get(`/booking/operations/invoice-transactions/${encodeURIComponent(bookingId)}`);
    if (response.code !== 1000) throw new Error(response.message || 'Chưa tải được giao dịch');
    return response.result;
  }, { deps: [bookingId] });
  if (loading) return <Skeleton active paragraph={{ rows: 1 }} />;
  if (error) return <Alert type="error" message={error} showIcon />;
  if (!data?.length) return <p className="text-slate-600">Hóa đơn này chưa có mã giao dịch cổng thanh toán trong dữ liệu.</p>;
  return <div className="grid gap-3">{data.map(transaction => <div key={`${transaction.provider}-${transaction.reference}`} className="admin-transaction">
    <strong>{transaction.provider}</strong> <Tag>{invoiceStatusLabel(transaction.status)}</Tag>
    <Descriptions size="small" column={1} items={[
      { key: 'merchant', label: 'Mã giao dịch hệ thống', children: <Typography.Text className="break-all" copyable>{transaction.reference}</Typography.Text> },
      { key: 'provider', label: 'Mã phía cổng thanh toán', children: transaction.provider_reference
        ? <Typography.Text copyable>{transaction.provider_reference}</Typography.Text> : '—' },
    ]} />
    {canReconcile && <Link to={`/admin/paymentReconciliation?txnRef=${encodeURIComponent(transaction.reference)}`}><Button size="small">Mở hồ sơ đối soát</Button></Link>}
  </div>)}</div>;
}

/** The bulk departure list is capped; top up the referenced departures one by one without a request storm. */
const MAX_DEPARTURE_LOOKUPS = 50;

const ManagerInvoice: React.FC = () => {
  const [selectedBooking, setSelectedBooking] = useState<BookingWithInvoice | null>(null);
  const [params, setParams] = useSearchParams();
  const focusedBooking = params.get('bookingId');
  const [keyword, setKeyword] = useState('');
  const [status, setStatus] = useState<string>();
  const [method, setMethod] = useState<string>();
  const [range, setRange] = useState<[Dayjs | null, Dayjs | null] | null>(null);
  const canReconcile = useHasPermission(ALL_PERMISSIONS.PAYMENT_RECONCILIATION.GET_LIST);
  const canSeeBooking = useHasPermission(ALL_PERMISSIONS.BOOKINGS.GET_ALL);

  // QUYỀN
  const canList = useHasPermission(ALL_PERMISSIONS.INVOICES.GET_ALL); // xem danh sách booking
  // const canCreate = useHasPermission(ALL_PERMISSIONS.BOOKINGS.CREATE); // (để dành, nếu sau này tạo booking từ admin)

  const showModal = (record: BookingWithInvoice) => {
    if (!canList) return; // không có quyền xem chi tiết thì thôi
    setSelectedBooking(record);
  };

  const handleModalClose = () => {
    setSelectedBooking(null);
  };

  // ============================
  // Load All Data
  // ============================
  const { data, loading, error: loadError } = useApiQuery(
    async () => {
      const [bookingRes, invoiceRes, departureRes, customerRes, tourRes] = await Promise.allSettled([
        bookingServices.getAll(),
        invoiceServices.getAll(),
        getAllTourDeparture(),
        bookingServices.getAllCustomers(),
        getAllTours(),
      ]);

      // Rows are built from invoices; a failed invoice source must surface, not render as "no data".
      if (invoiceRes.status === 'rejected') {
        throw new Error('Không tải được danh sách hóa đơn. Vui lòng thử lại sau.');
      }

      const bookings = settledRows(bookingRes);
      const invoices = settledRows(invoiceRes);
      const departures = settledRows(departureRes);
      const tours = settledRows(tourRes);
      const invoicedBookingIds = new Set(invoices.map((invoice) => String(invoice.bookingId)));
      // Only invoiced bookings are shown, so only their departures need a fallback lookup.
      const knownDepartureIds = new Set(departures.map((departure) => String(departure.id)));
      const missingDepartureIds = [
        ...new Set(
          bookings
            .filter((booking) => invoicedBookingIds.has(String(booking.id)))
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
      // A failed customer list is unknown, not zero; the modal then shows "—".
      const customers = customerRes.status === 'fulfilled' && customerRes.value.code === 1000
        ? customerRes.value.result ?? []
        : null;
      // Names are decoration only; a failed lookup must not blank the invoice table.
      let names: Record<string, string> = {};
      try {
        names = await getUserDisplayNames(invoices.map((invoice) => invoice.accountId));
      } catch {
        names = {};
      }

      const rows = adminInvoiceRows(bookings, invoices, departures, tours, customers, names);
      // A full server page means the table may be missing rows beyond the backend cap.
      const capped =
        isListCapped(bookings) ||
        isListCapped(invoices) ||
        isListCapped(customers) ||
        missingDepartureIds.length > MAX_DEPARTURE_LOOKUPS;
      return { rows, capped };
    },
    { enabled: canList },
  );
  const rows = (data?.rows ?? []).filter(row => {
    const term = keyword.trim().replace(/^#/, '').toLowerCase();
    const day = adminDayKey(row.invoice?.dayOfPay);
    return (!method || String(row.paymentMethod) === method)
      && (!range?.[0] || day >= range[0].format('YYYY-MM-DD')) && (!range?.[1] || day <= range[1].format('YYYY-MM-DD'))
      && (!focusedBooking || String(row.id) === focusedBooking) && (!status || row.invoiceStatus === status) && (!term || [
      row.id, row.invoice?.id, row.userName, row.tourName,
    ].some(value => String(value ?? '').toLowerCase().includes(term)));
  });

  // ============================
  // Table Columns
  // ============================
  const columns: ProColumns<BookingWithInvoice>[] = [
    { title: 'Chứng từ', key: 'invoice', render: (_, row) => <>
      <strong className="admin-record-id">HĐ #{row.invoice?.id}</strong>
      <div className="text-xs text-slate-600">Đơn #{row.id}</div>
    </> },
    { title: 'Khách và tour', key: 'customer', render: (_, row) => <>
      <strong>{row.userName}</strong><div className="text-xs text-slate-600">{row.tourName || '—'}</div>
    </> },
    { title: 'Số tiền', key: 'paid', align: 'right', render: (_, row) => <>
      <strong className="admin-money">{row.invoiceAmount != null ? formatCurrencyVND(row.invoiceAmount) : '—'}</strong>
      <div className="text-xs text-slate-600">{row.paymentMethod ? paymentMethodLabel(row.paymentMethod) : '—'}</div>
    </> },
    { title: 'Thời điểm thu', key: 'time', render: (_, row) => row.invoice?.dayOfPay ? formatDatetime(row.invoice.dayOfPay) : '—' },
    { title: 'Trạng thái', key: 'state', render: (_, row) =>
      <AdminStatus tone={row.invoiceStatus === 'REFUNDED' ? 'info' : 'success'}>{invoiceStatusLabel(row.invoiceStatus)}</AdminStatus> },
    { title: 'Thao tác', key: 'actions', width: 108, render: (_, row) =>
      canList && <Button size="small" onClick={() => showModal(row)} className="admin-row-detail">Chi tiết</Button> },
  ];

  // Không có quyền xem danh sách
  if (!canList) {
    return <div>Bạn không có quyền xem danh sách đặt chỗ &amp; hóa đơn.</div>;
  }

  return (
    <div className="admin-dashboard">
      <AdminPageHeader title="Quản lý hóa đơn" description="Tra cứu chứng từ, khoản thanh toán và mã giao dịch trên cổng." />
      {loadError && (
        <Alert type="error" showIcon message={loadError} style={{ marginBottom: 16 }} />
      )}
      {focusedBooking && <Alert showIcon message={`Chứng từ của đơn #${focusedBooking}`}
        action={<Button size="small" onClick={() => setParams({})}>Xem tất cả hóa đơn</Button>} />}
      {data?.capped && (
        <Alert
          type="warning"
          showIcon
          style={{ marginBottom: 16 }}
          message="Danh sách đã đạt giới hạn 500 bản ghi mỗi nguồn. Dữ liệu có thể chưa đầy đủ, hãy thu hẹp phạm vi hoặc kiểm tra trực tiếp trước khi kết luận."
        />
      )}
      <div className="admin-metric-strip">
        <div><span>Số hóa đơn trong bộ lọc</span><strong>{rows.length}</strong></div>
        <div><span>Tổng thu trong bộ lọc</span><strong>{formatCurrencyVND(rows.filter(row => row.invoiceStatus === 'PAID').reduce((sum, row) => sum + (row.invoiceAmount ?? 0), 0))}</strong></div>
      </div>
      <ProTable<BookingWithInvoice> filterKey={JSON.stringify([keyword, status, method, range])}

        headerTitle="Chứng từ thanh toán"
        className="admin-data-table"
        locale={{ emptyText: <Empty image={Empty.PRESENTED_IMAGE_SIMPLE} description={keyword || status || focusedBooking ? 'Không có hóa đơn khớp bộ lọc' : 'Chưa có hóa đơn'} /> }}
        size="small"
        scroll={{ x: 720 }}
        columns={columns}
        loading={loading}
        dataSource={rows}
        rowKey={row => String(row.invoice?.id ?? row.id)}
        search={false}
        pagination={adminPagination('hóa đơn')}
        toolBarRender={() => [<Space key="filters" wrap>
          <Input aria-label="Tìm hóa đơn" placeholder="Mã hóa đơn, mã đơn, tên khách…" allowClear value={keyword}
            onChange={event => setKeyword(event.target.value)} />
          <Select aria-label="Trạng thái hóa đơn" allowClear placeholder="Trạng thái" value={status}
            onChange={setStatus} options={[{ value: 'PAID', label: 'Đã thanh toán' }, { value: 'REFUNDED', label: 'Đã hoàn tiền' }]} />
          <DatePicker.RangePicker aria-label="Ngày thanh toán" format="DD/MM/YYYY" value={range} onChange={setRange} />
          <Select aria-label="Phương thức thanh toán" placeholder="Phương thức" allowClear value={method} onChange={setMethod}
            options={[...new Set((data?.rows ?? []).map(row => row.paymentMethod).filter(Boolean))].map(value => ({
              value: String(value), label: paymentMethodLabel(String(value)),
            }))} />
          {(keyword || status || method || range || focusedBooking) && <Button onClick={() => {
            setKeyword(''); setStatus(undefined); setMethod(undefined); setRange(null); setParams({});
          }}>Xóa lọc</Button>}
        </Space>]}
      />

      <Drawer title={`Hóa đơn #${selectedBooking?.invoice?.id ?? ''}`} open={!!selectedBooking}
        onClose={handleModalClose} width={640} className="admin-record-drawer" destroyOnHidden
        extra={canSeeBooking && selectedBooking && <Link to={`/admin/managerBooking?bookingId=${selectedBooking.id}`}>Mở đơn #{selectedBooking.id}</Link>}>
        {selectedBooking && <div className="admin-dossier">
          <div className="admin-financial-hero">
            <div><span>Tổng tiền</span><strong>{selectedBooking.invoiceAmount == null ? '—' : formatCurrencyVND(selectedBooking.invoiceAmount)}</strong></div>
            <Tag color={selectedBooking.invoiceStatus === 'REFUNDED' ? 'blue' : 'green'}>{invoiceStatusLabel(selectedBooking.invoiceStatus)}</Tag>
          </div>
          <Descriptions title="Thông tin chứng từ" size="small" column={1} items={[
            { key: 'booking', label: 'Mã đặt chỗ', children: `#${selectedBooking.id}` },
            { key: 'user', label: 'Tài khoản', children: selectedBooking.userName },
            { key: 'tour', label: 'Tour', children: selectedBooking.tourName || '—' },
            { key: 'departure', label: 'Khởi hành', children: selectedBooking.tourDeparture?.departureDate ? formatDate(selectedBooking.tourDeparture.departureDate) : '—' },
            { key: 'paid', label: 'Thời điểm thu', children: selectedBooking.invoice?.dayOfPay ? formatDatetime(selectedBooking.invoice.dayOfPay) : '—' },
            { key: 'method', label: 'Phương thức', children: selectedBooking.paymentMethod ? paymentMethodLabel(selectedBooking.paymentMethod) : '—' },
          ]} />
          <section className="admin-dossier-section"><h3>Giao dịch thanh toán</h3>
            {selectedBooking.invoice?.bookingId ? <InvoiceTransactions bookingId={String(selectedBooking.invoice.bookingId)} canReconcile={canReconcile} /> : <p>Chưa có mã đặt chỗ để tra cứu.</p>}
          </section>
        </div>}
      </Drawer>
    </div>
  );
};

export default ManagerInvoice;
