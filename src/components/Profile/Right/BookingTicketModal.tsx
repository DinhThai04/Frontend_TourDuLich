import BookingPickupOptions from './BookingPickupOptions';
import { Button, Modal, QRCode, Spin, Tooltip } from 'antd';
import { CloseOutlined, InfoCircleOutlined, StarFilled } from '@ant-design/icons';
import dayjs from 'dayjs';
import { Link, useNavigate } from 'react-router-dom';
import StatusBadge from '../StatusBadge';
import { resolveOrderBadgeStatus } from '../orderBadgeStatus';
import type { HistoryBooking } from './historyBooking';
import { useAppSelector } from '@/store/hooks';
import { formatCurrencyVND, formatDate } from '@/utils';
import { paymentMethodLabel } from '@/utils/adminInvoices';
import { passengerLabel } from '@/utils/booking';
import { tourScheduleLink } from '@/utils/tourSchedule';

interface BookingTicketModalProps {
  open: boolean;
  selectedBooking?: HistoryBooking;
  detailsLoaded: boolean;
  expandPassengers: boolean;
  setExpandPassengers: (open: boolean) => void;
  closeModal: () => void;
  onOpenSupport?: (bookingId?: number) => void;
}

function fmtShortDateTime(val?: string) {
  if (!val) return '';
  const d = dayjs(val);
  return d.isValid() ? d.format('HH:mm · DD/MM/YYYY') : '';
}

export default function BookingTicketModal({
  open, selectedBooking, detailsLoaded, expandPassengers, setExpandPassengers, closeModal, onOpenSupport,
}: BookingTicketModalProps) {
  const navigate = useNavigate();
  const { user } = useAppSelector(state => state.auth);
  const ticketBadge = selectedBooking
    ? resolveOrderBadgeStatus({
        status: selectedBooking.status,
        reservationStatus: selectedBooking.reservationStatus,
        invoiceStatus: selectedBooking.invoice?.status ?? selectedBooking.invoiceStatus,
        tripCompleted: selectedBooking.tripCompleted,
      })
    : 'PENDING';

  const isClosed = ticketBadge === 'EXPIRED' || ticketBadge === 'CANCELLED';
  const isPaidOrDone = ticketBadge === 'PAID' || ticketBadge === 'COMPLETED';
  const customers = selectedBooking?.listOfCustomers ?? [];
  const visibleCustomers = expandPassengers ? customers : customers.slice(0, 4);

  return (
  <Modal
    open={open}
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
          <span
            aria-hidden="true"
            className="pointer-events-none absolute -top-3 left-[40%] z-20 hidden h-6 w-6 -translate-x-1/2 rounded-full bg-black/45 md:block"
          />
          <span
            aria-hidden="true"
            className="pointer-events-none absolute -bottom-3 left-[40%] z-20 hidden h-6 w-6 -translate-x-1/2 rounded-full bg-black/45 md:block"
          />

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

          <div className="grid grid-cols-1 md:grid-cols-[40%_60%]">
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

                <div>
                  {!detailsLoaded ? (
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

            <div className="flex flex-col justify-between bg-[#FBFDFD] p-6">
              <div className="space-y-5">
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

                {ticketBadge === 'PAID' && detailsLoaded &&
                  <BookingPickupOptions key={selectedBooking.id} bookingId={Number(selectedBooking.id)} />}
                {ticketBadge === 'COMPLETED' && selectedBooking.pickup && (
                  <div className="rounded-xl border border-[#E5E7EB] bg-white p-3.5 text-xs">
                    <div className="font-semibold text-[#134E48]">Điểm tập trung đã xác nhận</div>
                    <div className="mt-1 text-[#1F2937]">{selectedBooking.pickup.address}</div>
                    {selectedBooking.pickup.landmark && <div>{selectedBooking.pickup.landmark}</div>}
                    {selectedBooking.pickup.arrivalTime && <div>Giờ có mặt {selectedBooking.pickup.arrivalTime.slice(0, 5)} (giờ Việt Nam)</div>}
                    {selectedBooking.pickup.directionsUrl && /^https:\/\//i.test(selectedBooking.pickup.directionsUrl)
                      && <a href={selectedBooking.pickup.directionsUrl} target="_blank" rel="noopener noreferrer">Xem chỉ đường</a>}
                  </div>
                )}

                <div>
                  <h3 className="m-0 mb-2 text-sm font-semibold uppercase tracking-wide text-[#134E48]">
                    Hóa đơn thanh toán
                  </h3>
                  {!detailsLoaded ? (
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
                          onOpenSupport(Number(selectedBooking.id));
                        }}
                      >
                        Yêu cầu hỗ trợ
                      </Button>
                    )}
                    <Tooltip title="Bạn có thể đánh giá sau khi SGU Tour xác nhận chuyến đi đã hoàn thành">
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
  );
}
