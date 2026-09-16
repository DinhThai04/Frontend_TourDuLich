import { useEffect, useMemo, useState, useCallback } from 'react';
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
import isBetween from 'dayjs/plugin/isBetween';
dayjs.extend(isBetween);

import { FileTextOutlined, UserOutlined } from '@ant-design/icons';

import bookingServices from '@/services/bookingServices';
import { getAllTourDeparture } from '@/services/tourServices';
import invoiceServices from '@/services/invoiceServices';
import { sessionService } from '@/services/sessionServices';
import { formatDatetime, formatCurrencyVND } from '@/utils';

import type { BookingResponse, CustomerResponse } from '@/types/Booking';
import type { ITourDeparture } from '@/types/Tour';
import type { InvoiceResponse } from '@/types/Invoice';
// import type { UserResponse } from "@/types/comment";

const { RangePicker } = DatePicker;
const { Option } = Select;

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

  const [selectedBooking, setSelectedBooking] = useState<BookingWithFullInfo | null>(null);
  const [openedModal, setOpenedModal] = useState<'booking' | 'invoice' | null>(null);

  /** ======================================================
   * FETCH DATA (dùng useCallback để tránh re-render không cần thiết)
   * ====================================================== */
  const fetchAllData = useCallback(async () => {
    try {
      setIsLoading(true);

      const [bookingRes, departureRes, customerRes, invoiceRes, userSession] = await Promise.all([
        bookingServices.getAll(),
        getAllTourDeparture(),
        bookingServices.getAllCustomers(),
        invoiceServices.getAll(),
        sessionService.getUser(),
      ]);

      if (!userSession) throw new Error('Không tìm thấy người dùng!');

      const success =
        bookingRes.code === 1000 &&
        departureRes.code === 1000 &&
        customerRes.code === 1000 &&
        invoiceRes.code === 1000;

      if (!success) throw new Error('Lỗi API, không thể tải dữ liệu!');

      const bookings: BookingResponse[] = bookingRes.result || [];
      const departures: ITourDeparture[] = departureRes.result || [];
      const customers: CustomerResponse[] = customerRes.result || [];
      const invoices: InvoiceResponse[] = invoiceRes.result || [];

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

      console.log(listOfBookingsByCurrentUser);
      setBookingData(listOfBookingsByCurrentUser);
    } catch (err: any) {
      message.error(err.message || 'Lỗi tải dữ liệu!');
    } finally {
      setIsLoading(false);
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

      const matchesStatus = bookingStatus ? record.status === bookingStatus : true;

      const matchesDate = dateRange
        ? dayjs(record.createdAt).isBetween(
            dateRange[0].startOf('day'),
            dateRange[1].endOf('day'),
            'day',
            '[]'
          )
        : true;

      return matchesId && matchesStatus && matchesDate;
    });
  }, [bookingData, filterState]);

  /** ======================================================
   * HELPERS
   * ====================================================== */
  const renderStatus = (status: string) => {
    const STATUS_MAP: Record<string, { color: string; label: string }> = {
      CONFIRMED: { color: 'green', label: 'Đã đặt tour' },
      UNCONFIRMED: { color: 'red', label: 'Đã hủy' },
    };

    const item = STATUS_MAP[status] || { color: 'blue', label: status };
    return <Tag color={item.color}>{item.label}</Tag>;
  };

  const renderCustomerList = (customers?: CustomerResponse[]) => {
    if (!customers || customers.length === 0) return <i>Không có khách hàng</i>;

    return (
      <div className="space-y-1">
        {customers.map((c) => (
          <div key={c.id}>
            • <b>{c.fullName}</b> ({String(c.gender) === 'true' ? 'Nam' : 'Nữ'}) — {c.dateOfBirth} —{' '}
            {c.bookingType}
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
      render: renderStatus,
      width: '15%',
    },
    {
      title: 'Thao tác',
      key: 'action',
      width: '15%',
      render: (_: any, record: BookingResponse) => (
        <>
          <Button type="link" onClick={() => openModal('booking', record)}>
            Chi tiết
          </Button>
          <Button type="link" onClick={() => openModal('invoice', record)}>
            Hóa đơn
          </Button>
          <Button type="link" danger onClick={() => handleDeleteBooking(Number(record.id))}>
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
          const res = await bookingServices.updateStatus(id);

          if (res?.code === 1000) {
            message.success('Hủy booking thành công!');
            fetchAllData(); // refresh list
          } else {
            message.error('Không thể hủy booking!');
          }
        } catch (err) {
          message.error('Lỗi khi hủy booking!');
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

      {/* Filters */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Input
          placeholder="Tìm theo mã booking"
          value={filterState.searchBookingId}
          onChange={(e) => setFilterState({ ...filterState, searchBookingId: e.target.value })}
        />

        <RangePicker
          value={filterState.dateRange}
          onChange={(range) => setFilterState({ ...filterState, dateRange: range as any })}
          className="w-full"
        />

        <Select
          placeholder="Chọn trạng thái"
          allowClear
          value={filterState.bookingStatus}
          onChange={(val) => setFilterState({ ...filterState, bookingStatus: val })}
        >
          <Option value="CONFIRMED">Đã thanh toán</Option>
          <Option value="UNCONFIRMED">Chưa thanh toán</Option>
          <Option value="CANCELLED">Đã hủy</Option>
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
            </Descriptions>

            <div className="text-right">
              {selectedBooking.status === 'UNCONFIRMED' ? (
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
        {selectedBooking?.invoice?.status !== 'PAID' ? (
          <Empty description="Chưa có hóa đơn cho booking này." />
        ) : (
          <Descriptions bordered column={1} size="small" className="mb-4">
            <Descriptions.Item label="Mã hóa đơn">{selectedBooking.invoice.id}</Descriptions.Item>

            <Descriptions.Item label="Ngày tạo">
              {formatDatetime(String(selectedBooking.invoice.dayOfPay))}
            </Descriptions.Item>

            <Descriptions.Item label="Danh sách khách hàng">
              {renderCustomerList(selectedBooking.listOfCustomers)}
            </Descriptions.Item>

            <Descriptions.Item label="Tổng số tiền đã thanh toán">
              {formatCurrencyVND(Number(selectedBooking.invoice.totalBookingTourExpense))}
            </Descriptions.Item>

            <Descriptions.Item label="Phương thức thanh toán">
              {String(selectedBooking.invoice.paymentMethodId) === '1' ? 'VNPAY' : 'Tiền mặt'}
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
