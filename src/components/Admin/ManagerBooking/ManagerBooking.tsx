import React, { useEffect, useState } from 'react';
import { ProTable } from '@ant-design/pro-components';
import type { ProColumns } from '@ant-design/pro-components';
import type { BookingResponse, CustomerResponse } from '@/types/Booking';
import type { UserResponse } from '@/types/comment';
import type { ITourDeparture } from '@/types/Tour';
import type { InvoiceResponse } from '@/types/Invoice';

import bookingServices from '@/services/bookingServices';
import { sessionService } from '@/services/sessionServices';
import { getAllTourDeparture } from '@/services/tourServices';
import invoiceServices from '@/services/invoiceServices';
import { formatCurrencyVND } from '@/utils';
import { Tag, Modal } from 'antd';
import { Button } from 'antd/lib';

type BookingWithFullInfo = BookingResponse & {
  userName?: string;
  tourDeparture?: ITourDeparture | null;
  listOfCustomers?: CustomerResponse[];
  invoice?: InvoiceResponse | null;
};

const ManagerBooking: React.FC = () => {
  const [data, setData] = useState<BookingWithFullInfo[]>([]);
  const [loading, setLoading] = useState(false);

  const [detail, setDetail] = useState<BookingWithFullInfo | null>(null);
  const [modalOpen, setModalOpen] = useState(false);

  useEffect(() => {
    loadData();
  }, []);

  /** Load toàn bộ dữ liệu */
  const loadData = async () => {
    setLoading(true);
    try {
      const [bookingRes, tourRes, customerRes, invoiceRes, userSession] = await Promise.all([
        bookingServices.getAll(),
        getAllTourDeparture(),
        bookingServices.getAllCustomers(),
        invoiceServices.getAll(),
        sessionService.getUser(),
      ]);

      if (!userSession) throw new Error('Current user not found');

      if (
        bookingRes.code === 1000 &&
        tourRes.code === 1000 &&
        customerRes.code === 1000 &&
        invoiceRes.code === 1000
      ) {
        const bookings: BookingResponse[] = bookingRes.result || [];
        const departures: ITourDeparture[] = tourRes.result || [];
        const customers: CustomerResponse[] = customerRes.result || [];
        const invoices: InvoiceResponse[] = invoiceRes.result || [];
        const user: UserResponse = userSession;

        const combined: BookingWithFullInfo[] = bookings.map((booking) => {
          const matchedDeparture = departures.find(
            (d) => String(d.id) === String(booking.tourDepartureId)
          );

          const matchedListCustomers = customers.filter(
            (c) => String(c.booking?.id) === String(booking.id)
          );

          const matchedInvoice = invoices.find(
            (inv) => String(inv.bookingId) === String(booking.id)
          );

          return {
            ...booking,
            userName: String(booking.accountId) === String(user.id) ? user.username : 'Unknown',
            tourDeparture: matchedDeparture || null,
            listOfCustomers: matchedListCustomers,
            invoice: matchedInvoice || null,
          };
        });
        console.log(combined);
        setData(combined);
      }
    } catch (err) {
      console.error('Error loading data:', err);
      setData([]);
    } finally {
      setLoading(false);
    }
  };

  /** Cột bảng */
  const columns: ProColumns<BookingWithFullInfo>[] = [
    { title: 'Mã đặt chỗ', dataIndex: 'id', width: 90 },
    { title: 'Tài khoản', dataIndex: 'userName', width: 120 },
    { title: 'Tour khởi hành', dataIndex: 'tourDepartureId', width: 120 },
    {
      title: 'Ngày đặt',
      dataIndex: 'createdAt',
      valueType: 'dateTime',
    },
    {
      title: 'Trạng thái',
      dataIndex: 'status',
      render: (_, row) =>
        row.status === 'CONFIRMED' ? (
          <Tag color="green">Xác nhận</Tag>
        ) : (
          <Tag color="red">Đã hủy</Tag>
        ),
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
      <ProTable<BookingWithFullInfo>
        headerTitle="Quản lý đặt tour"
        columns={columns}
        loading={loading}
        dataSource={data}
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
              <b>Ngày đặt:</b> {detail.createdAt}
            </p>

            <p>
              <b>Tour khởi hành:</b>
            </p>
            {detail.tourDeparture ? (
              <ul>
                <li>
                  <b>Mã tour:</b> {detail.tourDeparture.id}
                </li>
                <li>
                  <b>Ngày đi:</b> {detail.tourDeparture.departureDate}
                </li>
                <li>
                  <b>Ngày về:</b> {detail.tourDeparture.returnDate}
                </li>
              </ul>
            ) : (
              <i>Không có dữ liệu tour</i>
            )}

            <p>
              <b>Danh sách khách:</b>
            </p>
            {detail.listOfCustomers?.length ? (
              <ul>
                {detail.listOfCustomers.map((c) => (
                  <li key={c.id}>
                    {c.id} - {c.fullName} - {c.bookingType} - {c.status} - {c.dateOfBirth} -{' '}
                    {c.address}
                  </li>
                ))}
              </ul>
            ) : (
              <i>Không có khách</i>
            )}

            <p>
              <b>Hóa đơn:</b>
            </p>
            {detail.invoice ? (
              <>
                <p>Mã hóa đơn: {detail.invoice.id}</p>
                <p>Số tiền: {formatCurrencyVND(Number(detail.invoice.totalBookingTourExpense))}</p>
                <p>Ngày thanh toán: {detail.invoice.dayOfPay}</p>
                <p>
                  Trạng thái hóa đơn:{' '}
                  {detail.invoice.status === 'PAID' ? 'Đã thanh toán' : 'Chưa thanh toán'}
                </p>
              </>
            ) : (
              <i>Chưa tạo hóa đơn</i>
            )}

            <p>
              <b>Trạng thái đăng ký:</b>{' '}
              {detail.status === 'CONFIRMED' ? 'Đã xác nhận đặt tour' : 'Chưa đăng ký thành công'}
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
