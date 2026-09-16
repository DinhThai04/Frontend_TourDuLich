import React, { useEffect, useState } from 'react';
import { ProTable } from '@ant-design/pro-components';
import type { ProColumns } from '@ant-design/pro-components';
import { Tag, Modal, Descriptions } from 'antd';

import bookingServices from '@/services/bookingServices';
import invoiceServices from '@/services/invoiceServices';
import { sessionService } from '@/services/sessionServices';
import { getAllTourDeparture } from '@/services/tourServices';
import { formatCurrencyVND } from '@/utils';
import type { BookingResponse, CustomerResponse } from '@/types/Booking';
import type { InvoiceResponse } from '@/types/Invoice';
import type { ITourDeparture } from '@/types/Tour';
import type { UserResponse } from '@/types/comment';
import { ALL_PERMISSIONS } from '@/config/permissions';
import { useHasPermission } from '@/config/useHasPermission';

type BookingWithInvoice = BookingResponse & {
  userName?: string;
  tourDeparture?: ITourDeparture | null;
  listOfCustomers?: CustomerResponse[];
  invoice?: InvoiceResponse | null;
  invoiceAmount?: number;
  invoiceStatus?: string | null;
  paymentMethod?: string | null;
};

const ManagerInvoice: React.FC = () => {
  const [data, setData] = useState<BookingWithInvoice[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedBooking, setSelectedBooking] = useState<BookingWithInvoice | null>(null);
  const [isModalVisible, setIsModalVisible] = useState(false);

  // QUYỀN
  const canList = useHasPermission(ALL_PERMISSIONS.BOOKINGS.GET_ALL); // xem danh sách booking
  const canView = useHasPermission(ALL_PERMISSIONS.BOOKINGS.GET_DETAIL); // xem chi tiết 1 booking
  // const canCreate = useHasPermission(ALL_PERMISSIONS.BOOKINGS.CREATE); // (để dành, nếu sau này tạo booking từ admin)
  // const canUpdate = useHasPermission(ALL_PERMISSIONS.BOOKINGS.UPDATE_STATUS); // (để dành, nếu sau này cập nhật trạng thái)

  const showModal = (record: BookingWithInvoice) => {
    if (!canView) return; // không có quyền xem chi tiết thì thôi
    setSelectedBooking(record);
    setIsModalVisible(true);
  };

  const handleModalClose = () => {
    setSelectedBooking(null);
    setIsModalVisible(false);
  };

  useEffect(() => {
    if (canList) {
      loadData();
    } else {
      // không có quyền list thì clear data
      setData([]);
    }
  }, [canList]);

  // ============================
  // Load All Data
  // ============================
  const loadData = async () => {
    setLoading(true);
    try {
      const [bookingRes, invoiceRes, departureRes, userSession] = await Promise.all([
        bookingServices.getAll(),
        invoiceServices.getAll(),
        getAllTourDeparture(),
        sessionService.getUser(),
      ]);

      if (!userSession) throw new Error('Current user not found');

      if (bookingRes.code !== 1000 || invoiceRes.code !== 1000 || departureRes.code !== 1000) {
        throw new Error('Lấy dữ liệu thất bại');
      }

      const bookings: BookingResponse[] = bookingRes.result ?? [];
      const invoices: InvoiceResponse[] = invoiceRes.result ?? [];
      const departures: ITourDeparture[] = departureRes.result ?? [];
      const user: UserResponse = userSession;

      const mapped: BookingWithInvoice[] = bookings.map((bk) => {
        const matchedInvoice = invoices.find((inv) => String(inv.bookingId) === String(bk.id));

        const matchedDeparture = departures.find(
          (dep) => String(dep.id) === String(bk.tourDepartureId)
        );

        return {
          ...bk,
          userName: String(bk.accountId) === String(user.id) ? user.username : 'Unknown',
          invoice: matchedInvoice || null,
          invoiceAmount: Number(matchedInvoice?.totalBookingTourExpense) ?? null,
          invoiceStatus: matchedInvoice?.status ?? null,
          paymentMethod: matchedInvoice?.paymentMethodId ?? null,
          tourDeparture: matchedDeparture || null,
          listOfCustomers: bk.listOfCustomers ?? [],
        };
      });

      // chỉ lấy hóa đơn đã thanh toán
      const combined = mapped.filter((item) => item.invoiceStatus === 'PAID');
      setData(combined);
    } catch (err) {
      console.error('Error loading data:', err);
      setData([]);
    } finally {
      setLoading(false);
    }
  };

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
      render: (val) => val ?? '-',
    },
    {
      title: 'Tổng tiền',
      dataIndex: 'invoiceAmount',
      render: (val) => (val ? `${val.toLocaleString()} đ` : '-'),
    },
    {
      title: 'Trạng thái thanh toán',
      dataIndex: 'invoiceStatus',
      render: (val) =>
        val === 'PAID' ? (
          <Tag color="green">Đã thanh toán</Tag>
        ) : val === 'UNPAID' ? (
          <Tag color="orange">Chưa thanh toán</Tag>
        ) : (
          '-'
        ),
    },
  ];

  // Không có quyền xem danh sách
  if (!canList) {
    return <div>Bạn không có quyền xem danh sách đặt chỗ &amp; hóa đơn.</div>;
  }

  return (
    <>
      <ProTable<BookingWithInvoice>
        headerTitle="Quản lý đặt chỗ & hóa đơn"
        columns={columns}
        loading={loading}
        dataSource={data}
        rowKey="id"
        search={false}
        pagination={{ pageSize: 10 }}
        toolBarRender={false}
        onRow={(record) =>
          canView
            ? {
                onClick: () => showModal(record),
              }
            : {}
        }
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
            <Descriptions.Item label="Ngày đặt">{selectedBooking.createdAt}</Descriptions.Item>
            <Descriptions.Item label="Mã tour">{selectedBooking.tourDepartureId}</Descriptions.Item>
            <Descriptions.Item label="Tên tour">
              {selectedBooking.tourDeparture?.id ?? '-'}
            </Descriptions.Item>
            <Descriptions.Item label="Ngày khởi hành">
              {selectedBooking.tourDeparture?.departureDate ?? '-'}
            </Descriptions.Item>
            <Descriptions.Item label="Số lượng khách">
              {selectedBooking.listOfCustomers?.length ?? 0}
            </Descriptions.Item>
            <Descriptions.Item label="Tổng tiền">
              {formatCurrencyVND(Number(selectedBooking.invoiceAmount))}
            </Descriptions.Item>
            <Descriptions.Item label="Phương thức thanh toán">
              {selectedBooking.paymentMethod === '1' ? 'VNPAY' : 'Tiền mặt'}
            </Descriptions.Item>
          </Descriptions>
        )}
      </Modal>
    </>
  );
};

export default ManagerInvoice;
