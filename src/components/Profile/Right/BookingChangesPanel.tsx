import { useCallback, useEffect, useRef, useState } from 'react';
import { Button, Empty, Form, Input, message, Modal, Select, Skeleton, Space, Table, Tooltip } from 'antd';
import { InfoCircleOutlined, PlusOutlined, ReloadOutlined } from '@ant-design/icons';
import dayjs from 'dayjs';
import { bookingChanges, changeError } from '@/services/bookingChangeServices';
import type { ChangeRequest, DepartureOption, EligibleBooking } from '@/services/bookingChangeServices';
import { formatCurrencyVND, createClientKey } from '@/utils';

const STATUS_BADGE: Record<string, { bg: string; text: string; dot: string; label: string }> = {
  PENDING: { bg: '#FEF3C7', text: '#92400E', dot: '#F59E0B', label: 'Chờ xử lý' },
  ACCEPTED: { bg: '#E6F4F1', text: '#134E48', dot: '#1F7A6E', label: 'Đã đồng ý' },
  APPROVED: { bg: '#DCFCE7', text: '#166534', dot: '#16A34A', label: 'Đã duyệt' },
  SUPPORT_REQUIRED: { bg: '#FEF3C7', text: '#92400E', dot: '#F59E0B', label: 'Cần hỗ trợ' },
  REFUNDED: { bg: '#E6F4F1', text: '#134E48', dot: '#1F7A6E', label: 'Đã hoàn tiền' },
  REJECTED: { bg: '#FEE2E2', text: '#991B1B', dot: '#DC2626', label: 'Từ chối' },
  CANCELLED_BY_SHOP: { bg: '#FEE2E2', text: '#991B1B', dot: '#DC2626', label: 'Shop đã hủy' },
  WITHDRAWN: { bg: '#F3F4F6', text: '#4B5563', dot: '#9CA3AF', label: 'Đã kết thúc' },
};

export default function BookingChangesPanel({ onChanged, bookingId, onClearBooking }: {
  onChanged: () => void;
  bookingId?: number;
  onClearBooking: () => void;
}) {
  const [rows, setRows] = useState<ChangeRequest[]>([]);
  const [eligible, setEligible] = useState<EligibleBooking[]>([]);
  const [options, setOptions] = useState<DepartureOption[]>([]);
  const [loading, setLoading] = useState(true);
  const [mode, setMode] = useState<'new' | 'respond' | null>(null);
  const [selected, setSelected] = useState<ChangeRequest | null>(null);
  const [busy, setBusy] = useState(false);
  const [clientKey, setClientKey] = useState('');
  const [form] = Form.useForm<{ bookingId: number; requestType?: string; targetId?: number; reason: string; action: string }>();
  const requestType = Form.useWatch('requestType', form) || 'RESCHEDULE';
  const optionsSeq = useRef(0);
  const requestsSeq = useRef(0);

  const refresh = useCallback(async () => {
    const request = ++requestsSeq.current;
    setLoading(true);
    const [changes, bookings] = await Promise.allSettled([bookingChanges.mine(bookingId), bookingChanges.eligible()]);
    if (requestsSeq.current !== request) return;
    if (changes.status === 'fulfilled') setRows(changes.value);
    if (bookings.status === 'fulfilled') {
      setEligible(bookings.value.filter(b => dayjs(b.departure_date).isAfter(dayjs())));
    }
    const failure = changes.status === 'rejected' ? changes.reason
      : bookings.status === 'rejected' ? bookings.reason : null;
    if (failure) message.error(changeError(failure));
    setLoading(false);
  }, [bookingId]);

  useEffect(() => {
    void refresh();
    return () => { requestsSeq.current += 1; };
  }, [refresh]);

  async function loadOptions(id: number) {
    const seq = ++optionsSeq.current;
    setBusy(true);
    setOptions([]);
    form.setFieldValue('targetId', undefined);
    try {
      const loaded = await bookingChanges.options(id);
      if (seq === optionsSeq.current) setOptions(loaded);
    } catch (e) {
      if (seq === optionsSeq.current) message.error(changeError(e));
    } finally {
      if (seq === optionsSeq.current) setBusy(false);
    }
  }

  async function save() {
    let values: { bookingId: number; requestType?: string; targetId?: number; reason: string; action: string };
    try { values = await form.validateFields(); } catch { return; }
    setBusy(true);
    try {
      if (mode === 'new') {
        const prefix = values.requestType && values.requestType !== 'RESCHEDULE' ? `[${values.requestType}] ` : '';
        await bookingChanges.customer(values.bookingId, values.targetId || options[0]?.id || 0, `${prefix}${values.reason}`, clientKey);
      } else if (selected) {
        await bookingChanges.respond(selected, values.action, values.reason || 'Khách lựa chọn trên tài khoản', values.targetId);
      }
      setMode(null);
      message.success('Đã gửi yêu cầu thành công!');
      await refresh();
      onChanged();
    } catch (e) {
      message.error(changeError(e), 8);
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="rounded-[16px] border border-[#E5E7EB] bg-white p-6 shadow-[0_1px_2px_rgba(16,24,40,.04),0_8px_24px_rgba(16,24,40,.06)]">
      <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="m-0 text-[22px] font-semibold leading-[28px] text-[#1F2937]">Yêu cầu hỗ trợ</h1>
          <p className="mb-0 mt-1 text-sm text-[#6B7280]">Gửi yêu cầu dời lịch, cập nhật hành khách hoặc hỗ trợ cho các đơn đã thanh toán.</p>
        </div>
        <Space wrap>
          <Button
            icon={<ReloadOutlined />}
            onClick={() => void refresh()}
            className="!h-[40px] !rounded-[10px]"
          >
            Cập nhật
          </Button>
          <Tooltip title={!eligible.length ? 'Bạn chỉ có thể tạo yêu cầu khi có đơn đã thanh toán và chưa khởi hành' : undefined}>
            <Button
              type="primary"
              icon={<PlusOutlined />}
              disabled={!eligible.length}
              onClick={() => {
                form.resetFields();
                form.setFieldValue('requestType', 'RESCHEDULE');
                setOptions([]);
                setClientKey(createClientKey());
                setMode('new');
              }}
              className={
                eligible.length
                  ? '!h-[40px] !rounded-[10px] !bg-[#1F7A6E] hover:!bg-[#176258]'
                  : '!h-[40px] !rounded-[10px] !border-[#E5E7EB] !bg-[#E5E7EB] !text-[#9CA3AF]'
              }
            >
              Tạo yêu cầu
            </Button>
          </Tooltip>
        </Space>
      </div>

      {/* Teal Alert (no default blue) */}
      <div className="mb-5 flex items-start gap-2.5 rounded-[10px] border border-[#A7D7CF] bg-[#E6F4F1] px-4 py-3 text-sm text-[#134E48]">
        <InfoCircleOutlined className="mt-0.5 text-base text-[#1F7A6E]" />
        <span>Bạn chỉ có thể tạo yêu cầu hỗ trợ hoặc dời lịch cho đơn <strong>đã thanh toán</strong> và <strong>chưa hoàn thành</strong>.</span>
      </div>

      {bookingId && (
        <div className="mb-4 flex items-center gap-2">
          <span className="rounded-full bg-[#E6F4F1] px-3 py-1 text-xs font-semibold text-[#134E48]">Đơn #{bookingId}</span>
          <Button size="small" onClick={onClearBooking}>Xem tất cả</Button>
        </div>
      )}

      {loading ? (
        <Skeleton active paragraph={{ rows: 4 }} />
      ) : rows.length === 0 ? (
        <Empty
          className="py-8"
          description={
            <div className="space-y-1 text-sm text-[#6B7280]">
              <div>Chưa có yêu cầu hỗ trợ nào.</div>
              <div className="text-xs">Bạn chỉ có thể tạo yêu cầu cho đơn đã thanh toán và chưa hoàn thành.</div>
            </div>
          }
        />
      ) : (
        <Table<ChangeRequest>
          rowKey="id"
          size="middle"
          dataSource={rows}
          pagination={rows.length > 6 ? { pageSize: 6 } : false}
          columns={[
            {
              title: 'Đơn / Tour',
              render: (_, r) => (
                <div>
                  <span className="font-semibold text-[#134E48]">#{r.booking_id}</span>
                  <div className="text-xs text-[#6B7280]">{r.tour_title}</div>
                </div>
              ),
            },
            {
              title: 'Lịch gốc → Lịch mới',
              render: (_, r) => (
                <span className="text-xs text-[#1F2937]">
                  {dayjs(r.source_departure_at).format('DD/MM/YYYY')} → {dayjs(r.target_departure_at).format('DD/MM/YYYY')}
                </span>
              ),
            },
            {
              title: 'Trạng thái',
              render: (_, r) => {
                const st = STATUS_BADGE[r.status] || { bg: '#F3F4F6', text: '#4B5563', dot: '#9CA3AF', label: r.status };
                return (
                  <span style={{ backgroundColor: st.bg, color: st.text }} className="inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-medium">
                    <span style={{ backgroundColor: st.dot }} className="h-1.5 w-1.5 rounded-full" />
                    {st.label}
                  </span>
                );
              },
            },
            {
              title: 'Phản hồi',
              render: (_, r) => (
                <div className="max-w-[240px]">
                  <p className="m-0 line-clamp-2 text-xs text-[#4B5563]">{r.reason}</p>
                  {r.kind === 'SHOP' && ['PENDING', 'SUPPORT_REQUIRED'].includes(r.status) && (
                    <Button
                      size="small"
                      className="mt-1 !rounded-[8px] !border-[#1F7A6E] !text-[#1F7A6E]"
                      onClick={() => {
                        setSelected(r);
                        form.resetFields();
                        form.setFieldValue('action', 'ACCEPT');
                        setMode('respond');
                        void loadOptions(r.booking_id);
                      }}
                    >
                      Xem đề xuất
                    </Button>
                  )}
                  {r.refund_reference && (
                    <div className="mt-1 text-xs text-[#134E48]">
                      Hoàn {formatCurrencyVND(Number(r.refund_amount))} · {r.refund_reference}
                    </div>
                  )}
                </div>
              ),
            },
          ]}
        />
      )}

      <Modal
        title={mode === 'new' ? 'Tạo yêu cầu hỗ trợ' : 'Phản hồi đề xuất của SGU Tour'}
        open={mode !== null}
        onCancel={() => setMode(null)}
        onOk={() => void save()}
        okText="Gửi yêu cầu"
        cancelText="Hủy"
        confirmLoading={busy}
        maskClosable={!busy}
        closable={!busy}
      >
        <Form form={form} layout="vertical" className="mt-3">
          {mode === 'new' && (
            <>
              <Form.Item name="bookingId" label="Đơn đã thanh toán đủ điều kiện" rules={[{ required: true, message: 'Vui lòng chọn đơn' }]}>
                <Select
                  placeholder="Chọn đơn đặt chỗ"
                  onChange={(id) => void loadOptions(id)}
                  options={eligible.map((b) => ({
                    value: b.id,
                    label: `#${b.id} — ${b.tour_title} (${dayjs(b.departure_date).format('DD/MM/YYYY')})`,
                  }))}
                />
              </Form.Item>
              <Form.Item name="requestType" label="Loại yêu cầu" initialValue="RESCHEDULE">
                <Select
                  options={[
                    { value: 'RESCHEDULE', label: 'Dời lịch khởi hành' },
                    { value: 'PASSENGER_INFO', label: 'Thay đổi thông tin hành khách' },
                    { value: 'REFUND', label: 'Hủy và hoàn tiền' },
                    { value: 'OTHER', label: 'Yêu cầu khác' },
                  ]}
                />
              </Form.Item>
            </>
          )}
          {mode === 'respond' && (
            <Form.Item name="action" label="Lựa chọn" rules={[{ required: true }]}>
              <Select
                options={[
                  { value: 'ACCEPT', label: 'Đồng ý lịch đề xuất' },
                  { value: 'SUPPORT', label: 'Tôi cần hỗ trợ thêm' },
                  { value: 'REFUND', label: 'Yêu cầu hủy và hoàn tiền' },
                ]}
              />
            </Form.Item>
          )}
          {(mode === 'respond' || requestType === 'RESCHEDULE') && (
            <Form.Item
              name="targetId"
              label="Chọn lịch khởi hành mới"
              rules={mode === 'new' && requestType === 'RESCHEDULE' ? [{ required: true, message: 'Vui lòng chọn ngày mới' }] : []}
            >
              <Select
                allowClear
                placeholder="Chọn ngày còn chỗ"
                options={options.map((d) => ({
                  value: d.id,
                  label: `${dayjs(d.departure_date).format('HH:mm · DD/MM/YYYY')} — còn ${d.available_seats} chỗ`,
                }))}
              />
            </Form.Item>
          )}
          <Form.Item name="reason" label="Nội dung yêu cầu" rules={[{ required: true, whitespace: true, message: 'Vui lòng nhập nội dung' }]}>
            <Input.TextArea showCount maxLength={500} rows={3} placeholder="Mô tả chi tiết yêu cầu của bạn..." />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
}
