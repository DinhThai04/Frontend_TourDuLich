import { adminInvoiceRows, paymentMethodLabel } from '@/utils/adminInvoices';
import React, { useState } from 'react';
import { ProTable } from '@ant-design/pro-components';
import type { ProColumns } from '@ant-design/pro-components';
import { Alert, Tag, Modal, Descriptions, Button } from 'antd';

import bookingServices from '@/services/bookingServices';
import invoiceServices from '@/services/invoiceServices';
import { getUserDisplayNames } from '@/services/userServices';
import { getAllTourDeparture, getAllTours, getTourDepartureById } from '@/services/tourServices';
import { formatCurrencyVND, formatDate, formatDatetime, isListCapped } from '@/utils';
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

/** The bulk departure list is capped; top up the referenced departures one by one without a request storm. */
const MAX_DEPARTURE_LOOKUPS = 50;

const ManagerInvoice: React.FC = () => {
  const [selectedBooking, setSelectedBooking] = useState<BookingWithInvoice | null>(null);
  const [isModalVisible, setIsModalVisible] = useState(false);

  // QUYỀN
  const canList = useHasPermission(ALL_PERMISSIONS.INVOICES.GET_ALL); // xem danh sách booking
  const canView = useHasPermission(ALL_PERMISSIONS.INVOICES.GET_ALL); // xem chi tiết 1 booking
  // const canCreate = useHasPermission(ALL_PERMISSIONS.BOOKINGS.CREATE); // (để dành, nếu sau này tạo booking từ admin)

  const showModal = (record: BookingWithInvoice) => {
    if (!canView) return; // không có quyền xem chi tiết thì thôi
    setSelectedBooking(record);
    setIsModalVisible(true);
  };

  const handleModalClose = () => {
    setSelectedBooking(null);
    setIsModalVisible(false);
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
  const rows = data?.rows ?? [];

  // ============================
  // Table Columns
  // ============================
  const columns: ProColumns<BookingWithInvoice>[] = [
    {
      title: 'Mã hóa đơn',
      dataIndex: 'invoiceId',
      width: 100,
      render: (_, r) => r.invoice?.id ?? '-',
    },
    { title: 'Tên người dùng', dataIndex: 'userName' },
    { title: 'Mã đặt chỗ', dataIndex: 'id', width: 90 },
    {
      title: 'Phương thức thanh toán',
      dataIndex: 'paymentMethod',
      render: (val) => (val ? paymentMethodLabel(String(val)) : '-'),
    },
    {
      title: 'Tổng tiền',
      dataIndex: 'invoiceAmount',
      render: (val) => (val ? formatCurrencyVND(Number(val)) : '-'),
    },
    {
      title: 'Trạng thái thanh toán',
      dataIndex: 'invoiceStatus',
      render: (val) =>
        val === 'PAID' ? (
          <Tag color="green">Đã thanh toán</Tag>
        ) : val === 'REFUNDED' ? (
          <Tag color="blue">Đã hoàn tiền</Tag>
        ) : val === 'UNPAID' ? (
          <Tag color="orange">Chưa thanh toán</Tag>
        ) : (
          '-'
        ),
    },
    {
      title: 'Thao tác',
      key: 'actions',
      width: 110,
      render: (_, record) =>
        canView ? (
          <Button type="link" onClick={() => showModal(record)}>
            Xem chi tiết
          </Button>
        ) : null,
    },
  ];

  // Không có quyền xem danh sách
  if (!canList) {
    return <div>Bạn không có quyền xem danh sách đặt chỗ &amp; hóa đơn.</div>;
  }

  return (
    <>
      {loadError && (
        <Alert type="error" showIcon message={loadError} style={{ marginBottom: 16 }} />
      )}
      {data?.capped && (
        <Alert
          type="warning"
          showIcon
          style={{ marginBottom: 16 }}
          message="Danh sách đã đạt giới hạn 500 bản ghi mỗi nguồn. Dữ liệu có thể chưa đầy đủ, hãy thu hẹp phạm vi hoặc kiểm tra trực tiếp trước khi kết luận."
        />
      )}
      <ProTable<BookingWithInvoice>
        headerTitle="Quản lý đặt chỗ & hóa đơn"
        columns={columns}
        loading={loading}
        dataSource={rows}
        rowKey="id"
        search={false}
        pagination={{ pageSize: 10 }}
        toolBarRender={false}
      />

      <Modal
        title="Chi tiết hóa đơn"
        open={isModalVisible}
        onCancel={handleModalClose}
        footer={null}
        width={700}
      >
        {selectedBooking && (
          <Descriptions column={1} bordered>
            <Descriptions.Item label="Mã đặt chỗ">{selectedBooking.id}</Descriptions.Item>
            <Descriptions.Item label="Tên người dùng">{selectedBooking.userName}</Descriptions.Item>
            <Descriptions.Item label="Ngày đặt">
              {selectedBooking.createdAt ? formatDatetime(selectedBooking.createdAt) : '—'}
            </Descriptions.Item>
            <Descriptions.Item label="Mã lịch khởi hành">{selectedBooking.tourDepartureId ?? '—'}</Descriptions.Item>
            <Descriptions.Item label="Tên tour">{selectedBooking.tourName ?? '—'}</Descriptions.Item>
            <Descriptions.Item label="Ngày khởi hành">
              {selectedBooking.tourDeparture?.departureDate
                ? formatDate(selectedBooking.tourDeparture.departureDate)
                : '—'}
            </Descriptions.Item>
            <Descriptions.Item label="Số lượng khách">
              {selectedBooking.listOfCustomers ? selectedBooking.listOfCustomers.length : '—'}
            </Descriptions.Item>
            <Descriptions.Item label="Tổng tiền">
              {selectedBooking.invoiceAmount != null
                ? formatCurrencyVND(selectedBooking.invoiceAmount)
                : '—'}
            </Descriptions.Item>
            <Descriptions.Item label="Phương thức thanh toán">
              {selectedBooking.paymentMethod ? paymentMethodLabel(selectedBooking.paymentMethod) : '—'}
            </Descriptions.Item>
          </Descriptions>
        )}
      </Modal>
    </>
  );
};

export default ManagerInvoice;
