import React, { useState } from 'react';
import { ProTable } from '@ant-design/pro-components';
import type { ProColumns } from '@ant-design/pro-components';
import type { BookingResponse, CustomerResponse } from '@/types/Booking';
import type { ITourDeparture } from '@/types/Tour';
import type { InvoiceResponse } from '@/types/Invoice';

import bookingServices from '@/services/bookingServices';
import { getUserDisplayNames } from '@/services/userServices';
import { getAllTourDeparture, getTourDepartureById } from '@/services/tourServices';
import invoiceServices from '@/services/invoiceServices';
import { formatCurrencyVND, formatDate, formatDatetime, isListCapped } from '@/utils';
import { passengerLabel } from '@/utils/booking';
import { settledRows } from '@/utils/settledRows';
import { useApiQuery } from '@/hooks';
import { Alert, Tag, Modal, Button, message } from 'antd';

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
  const [detail, setDetail] = useState<BookingWithFullInfo | null>(null);
  const [modalOpen, setModalOpen] = useState(false);

  /** Load toàn bộ dữ liệu; nguồn phụ lỗi thì chỉ thiếu thông tin trang trí, không làm trắng bảng. */
  const { data, loading, error: loadError } = useApiQuery(
    async () => {
      const [bookingRes, tourRes, customerRes, invoiceRes] = await Promise.allSettled([
        bookingServices.getAll(),
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
    { onError: (msg) => message.error(msg) },
  );
  const rows = data?.rows ?? [];

  /** Cột bảng */
  const columns: ProColumns<BookingWithFullInfo>[] = [
    { title: 'Mã đặt chỗ', dataIndex: 'id', width: 90 },
    { title: 'Tài khoản', dataIndex: 'userName', width: 120 },
    {
      title: 'Tour khởi hành',
      dataIndex: 'tourDepartureId',
      width: 140,
      render: (_, row) =>
        row.tourDeparture?.departureDate
          ? formatDate(row.tourDeparture.departureDate)
          : `#${row.tourDepartureId}`,
    },
    {
      title: 'Ngày đặt',
      dataIndex: 'createdAt',
      render: (val) => (val ? formatDatetime(String(val)) : '—'),
    },
    {
      title: 'Trạng thái',
      dataIndex: 'status',
      render: (_, row) => {
        const item = bookingStatus(row.status);
        return <Tag color={item.color}>{item.label}</Tag>;
      },
    },
    {
      title: 'Hành động',
      valueType: 'option',
      render: (_, record) => [
        <Button
          type="link"
          key="view"
          onClick={() => {
            setDetail(record);
            setModalOpen(true);
          }}
        >
          Xem chi tiết
        </Button>,
      ],
    },
  ];

  return (
    <>
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
      <ProTable<BookingWithFullInfo>
        headerTitle="Quản lý đặt tour"
        columns={columns}
        loading={loading}
        dataSource={rows}
        rowKey="id"
        search={false}
        pagination={{ pageSize: 10 }}
      />

      {/* Modal chi tiết Booking */}
      <Modal
        title={`Chi tiết đặt tour #${detail?.id ?? ''}`}
        open={modalOpen}
        onCancel={() => setModalOpen(false)}
        footer={null}
      >
        {detail ? (
          <div>
            <p>
              <b>Mã booking:</b> {detail.id}
            </p>
            <p>
              <b>Tài khoản:</b> {detail.userName}
            </p>
            <p>
              <b>Ngày đặt:</b> {detail.createdAt ? formatDatetime(detail.createdAt) : '—'}
            </p>

            <p>
              <b>Tour khởi hành:</b>
            </p>
            {detail.tourDeparture ? (
              <ul>
                <li>
                  <b>Mã lịch khởi hành:</b> {detail.tourDeparture.id}
                </li>
                <li>
                  <b>Ngày đi:</b>{' '}
                  {detail.tourDeparture.departureDate
                    ? formatDate(detail.tourDeparture.departureDate)
                    : '—'}
                </li>
                <li>
                  <b>Ngày về:</b>{' '}
                  {detail.tourDeparture.returnDate
                    ? formatDate(detail.tourDeparture.returnDate)
                    : '—'}
                </li>
              </ul>
            ) : (
              <i>Không có dữ liệu tour</i>
            )}

            <p>
              <b>Danh sách khách:</b>
            </p>
            {detail.listOfCustomers === undefined ? (
              <i>Không tải được dữ liệu khách.</i>
            ) : detail.listOfCustomers.length ? (
              <ul>
                {detail.listOfCustomers.map((c) => (
                  <li key={c.id}>
                    {c.id} - {c.fullName} - {passengerLabel(c.bookingType)} -{' '}
                    {(c.status && CUSTOMER_STATUS[c.status]) || c.status || '—'} -{' '}
                    {c.dateOfBirth ? formatDate(c.dateOfBirth) : '—'} - {c.address || '—'}
                  </li>
                ))}
              </ul>
            ) : (
              <i>Không có khách</i>
            )}

            <p>
              <b>Hóa đơn:</b>
            </p>
            {detail.invoiceLoadFailed ? (
              <i>Không tải được dữ liệu hóa đơn.</i>
            ) : detail.invoice ? (
              <>
                <p>Mã hóa đơn: {detail.invoice.id}</p>
                <p>Số tiền: {formatCurrencyVND(Number(detail.invoice.totalBookingTourExpense))}</p>
                <p>Ngày thanh toán: {detail.invoice.dayOfPay ? formatDatetime(detail.invoice.dayOfPay) : '—'}</p>
                <p>
                  Trạng thái hóa đơn:{' '}
                  {detail.invoice.status === 'PAID'
                    ? 'Đã thanh toán'
                    : detail.invoice.status === 'REFUNDED'
                      ? 'Đã hoàn tiền'
                      : 'Chưa thanh toán'}
                </p>
              </>
            ) : (
              <i>Chưa có hóa đơn, hoặc hóa đơn nằm ngoài dữ liệu được cấp.</i>
            )}

            <p>
              <b>Trạng thái đăng ký:</b> {bookingStatus(detail.status).label}
            </p>
          </div>
        ) : (
          <p>Không có dữ liệu</p>
        )}
      </Modal>
    </>
  );
};

export default ManagerBooking;
