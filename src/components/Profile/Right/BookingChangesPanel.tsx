import { useCallback, useEffect, useRef, useState } from 'react';
import { Alert, Button, Card, Form, Input, message, Modal, Select, Space, Table, Tag } from 'antd';
import dayjs from 'dayjs';
import { bookingChanges, changeError } from '@/services/bookingChangeServices';
import type { ChangeRequest, DepartureOption, EligibleBooking } from '@/services/bookingChangeServices';
import { formatCurrencyVND, createClientKey } from '@/utils';

const labels: Record<string, string> = { PENDING: 'Chờ phản hồi / xét duyệt', ACCEPTED: 'Đã đồng ý, chờ chuyển', APPROVED: 'Đã chuyển lịch', SUPPORT_REQUIRED: 'Cần hỗ trợ', REFUNDED: 'Đã ghi nhận hoàn tiền', REJECTED: 'Từ chối', SUPERSEDED: 'Đã thay thế', CANCELLED_BY_SHOP: 'Shop đã hủy', WITHDRAWN: 'Đã kết thúc' };
export default function BookingChangesPanel({ onChanged }: { onChanged: () => void }) {
  const [rows, setRows] = useState<ChangeRequest[]>([]);
  const [eligible, setEligible] = useState<EligibleBooking[]>([]);
  const [options, setOptions] = useState<DepartureOption[]>([]);
  const [mode, setMode] = useState<'new' | 'respond' | null>(null);
  const [selected, setSelected] = useState<ChangeRequest | null>(null);
  const [busy, setBusy] = useState(false);
  const [clientKey, setClientKey] = useState('');
  const [form] = Form.useForm<{ bookingId: number; targetId?: number; reason: string; action: string }>();
  const optionsSeq = useRef(0);
  const refresh = useCallback(async () => {
    // Hai nguồn dữ liệu độc lập: nguồn nào lỗi chỉ mất phần đó, không xóa bảng đang xem.
    const [changes, bookings] = await Promise.allSettled([bookingChanges.mine(), bookingChanges.eligible()]);
    if (changes.status === 'fulfilled') setRows(changes.value);
    if (bookings.status === 'fulfilled') setEligible(bookings.value);
    const failure = changes.status === 'rejected' ? changes.reason
      : bookings.status === 'rejected' ? bookings.reason : null;
    if (failure) message.error(changeError(failure));
  }, []);
  useEffect(() => { void refresh(); }, [refresh]);
  async function loadOptions(id: number) {
    // Đổi booking là đổi danh sách lịch; phản hồi của booking cũ đến sau phải bị bỏ,
    // nếu không người dùng chọn lịch của booking khác.
    const seq = ++optionsSeq.current;
    setBusy(true); setOptions([]); form.setFieldValue('targetId', undefined);
    try {
      const loaded = await bookingChanges.options(id);
      if (seq === optionsSeq.current) setOptions(loaded);
    } catch (e) { if (seq === optionsSeq.current) message.error(changeError(e)); }
    finally { if (seq === optionsSeq.current) setBusy(false); }
  }
  async function save() {
    let values: { bookingId: number; targetId?: number; reason: string; action: string };
    try { values = await form.validateFields(); } catch { return; }
    setBusy(true);
    try {
      if (mode === 'new') await bookingChanges.customer(values.bookingId, values.targetId!, values.reason, clientKey);
      else if (selected) await bookingChanges.respond(selected, values.action, values.reason || 'Khách lựa chọn trên tài khoản', values.targetId);
      setMode(null); message.success('Đã ghi nhận lựa chọn. Vui lòng xem trạng thái mới nhất.'); await refresh(); onChanged();
    } catch (e) { message.error(changeError(e), 8); } finally { setBusy(false); }
  }
  return <Card title="Dời lịch và hỗ trợ chuyến đi" className="mb-4" extra={<Space><Button onClick={() => void refresh()}>Tải lại</Button><Button onClick={() => { form.resetFields(); setOptions([]); setClientKey(createClientKey()); setMode('new'); }} disabled={!eligible.length}>Yêu cầu dời lịch</Button></Space>}>
    <Alert type="info" showIcon message="Khách đã thanh toán: gửi yêu cầu trước giờ đi ít nhất 72 giờ. Yêu cầu chờ duyệt chưa giữ chỗ ở lịch mới. Chỉ áp dụng cùng tour và không phát sinh chênh lệch tiền." />
    <Table<ChangeRequest> rowKey="id" size="small" dataSource={rows} pagination={{ pageSize: 4 }} columns={[
      { title: 'Booking / tour', render: (_, r) => `#${r.booking_id} — ${r.tour_title}` },
      { title: 'Lịch gốc → lịch mới', render: (_, r) => `${dayjs(r.source_departure_at).format('HH:mm DD/MM/YYYY')} → ${dayjs(r.target_departure_at).format('HH:mm DD/MM/YYYY')}` },
      { title: 'Trạng thái', render: (_, r) => <Tag>{labels[r.status] || r.status}</Tag> },
      { title: 'Phản hồi', render: (_, r) => r.kind === 'SHOP' && ['PENDING', 'SUPPORT_REQUIRED'].includes(r.status) && <Button onClick={() => { setSelected(r); form.resetFields(); form.setFieldValue('action', 'ACCEPT'); setMode('respond'); void loadOptions(r.booking_id); }}>Xem đề xuất</Button> },
    ]} expandable={{ expandedRowRender: r => <><p>{r.reason}</p>{r.refund_reference && <p>Shop đã ghi nhận hoàn: {formatCurrencyVND(Number(r.refund_amount))} — {r.refund_reference}. Vui lòng kiểm tra tài khoản nhận tiền.</p>}</> }} />
    <Modal title={mode === 'new' ? 'Gửi yêu cầu dời lịch' : 'Phản hồi đề xuất của shop'} open={mode !== null} onCancel={() => setMode(null)} onOk={() => void save()} confirmLoading={busy} maskClosable={!busy} closable={!busy} cancelButtonProps={{ disabled: busy }}>
      {mode === 'respond' && selected && <Alert type="warning" message={selected.reason} description={`Lịch đề xuất: ${dayjs(selected.target_departure_at).format('HH:mm DD/MM/YYYY')}. Hạn phản hồi trực tuyến: ${selected.response_deadline ? dayjs(selected.response_deadline).format('HH:mm DD/MM/YYYY') : 'liên hệ shop'}. Không phản hồi không được coi là đồng ý. Nếu quá hạn phản hồi, vui lòng liên hệ shop.`} />}
      <Form form={form} layout="vertical">
        {mode === 'new' && <Form.Item name="bookingId" label="Booking đã thanh toán đủ điều kiện" rules={[{ required: true }]}><Select onChange={id => void loadOptions(id)} options={eligible.map(b => ({ value: b.id, label: `#${b.id} — ${b.tour_title} — ${dayjs(b.departure_date).format('DD/MM/YYYY')}` }))} /></Form.Item>}
        {mode === 'respond' && <Form.Item name="action" label="Lựa chọn" rules={[{ required: true }]}><Select options={[{ value: 'ACCEPT', label: 'Đồng ý lịch đề xuất (hoặc chọn lịch khác bên dưới)' }, { value: 'SUPPORT', label: 'Tôi cần hỗ trợ / chưa đồng ý' }, { value: 'REFUND', label: 'Tôi yêu cầu hủy và hoàn tiền' }]} /></Form.Item>}
        <Form.Item name="targetId" label={mode === 'new' ? 'Lịch muốn chuyển' : 'Lịch khác (để trống để chọn lịch shop đề xuất)'} rules={mode === 'new' ? [{ required: true }] : []}><Select allowClear options={options.map(d => ({ value: d.id, label: `${dayjs(d.departure_date).format('HH:mm DD/MM/YYYY')} — còn ${d.available_seats} chỗ` }))} /></Form.Item>
        <Form.Item name="reason" label="Nội dung / yêu cầu hỗ trợ" rules={[{ required: true, whitespace: true }]}><Input.TextArea maxLength={1000} rows={3} /></Form.Item>
      </Form>
    </Modal>
  </Card>;
}
