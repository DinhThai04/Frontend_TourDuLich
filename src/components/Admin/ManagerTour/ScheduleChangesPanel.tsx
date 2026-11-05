import { useCallback, useEffect, useRef, useState } from 'react';
import { Alert, Button, Card, Checkbox, DatePicker, Form, Input, InputNumber, message, Modal, Select, Space, Table, Tag } from 'antd';
import dayjs from 'dayjs';
import type { Dayjs } from 'dayjs';
import { useHasPermission } from '@/config/useHasPermission';
import { ALL_PERMISSIONS } from '@/config/permissions';
import { getDepartureHistoryByTourId, getDepartureCapacity } from '@/services/tourServices';
import { bookingChanges, changeError } from '@/services/bookingChangeServices';
import type { ChangeRequest, ShopInput, ShopProposal } from '@/services/bookingChangeServices';
import type { ITourDeparture } from '@/types/Tour';
import { formatCurrencyVND, isListCapped, createClientKey } from '@/utils';

type ShopForm = Omit<ShopInput, 'clientKey' | 'expectedVersion' | 'departureAt' | 'returnAt' | 'responseDeadline'> & { departureAt: Dayjs; returnAt: Dayjs; responseDeadline: Dayjs };
type ActionForm = { note: string; amount: number; reference: string; completed: boolean };

const CHANGE_STATUS: Record<string, { color: string; label: string }> = {
  PENDING: { color: 'orange', label: 'Chờ phản hồi' },
  ACCEPTED: { color: 'blue', label: 'Khách đã đồng ý' },
  APPROVED: { color: 'green', label: 'Đã chuyển booking' },
  REJECTED: { color: 'red', label: 'Đã từ chối' },
  SUPPORT_REQUIRED: { color: 'gold', label: 'Cần hỗ trợ' },
  REFUNDED: { color: 'purple', label: 'Đã hoàn tiền' },
  CANCELLED_BY_SHOP: { color: 'default', label: 'Shop đã hủy' },
  SUPERSEDED: { color: 'default', label: 'Đã thay thế' },
  WITHDRAWN: { color: 'default', label: 'Đã kết thúc' },
};
const changeStatus = (status?: string | null) =>
  (status && CHANGE_STATUS[status]) || { color: 'default', label: status || 'Không xác định' };
const PROPOSAL_STATUS: Record<string, { color: string; label: string }> = {
  OPEN: { color: 'orange', label: 'Đang xử lý' },
  COMPLETED: { color: 'green', label: 'Đã hoàn tất' },
};
const proposalStatus = (status?: string | null) =>
  (status && PROPOSAL_STATUS[status]) || { color: 'default', label: status || 'Không xác định' };
export default function ScheduleChangesPanel({ tourId, onChanged }: { tourId: number; onChanged: () => void }) {
  const read = useHasPermission(ALL_PERMISSIONS.BOOKING_CHANGES.READ);
  const create = useHasPermission(ALL_PERMISSIONS.BOOKING_CHANGES.CREATE);
  const review = useHasPermission(ALL_PERMISSIONS.BOOKING_CHANGES.REVIEW);
  const refund = useHasPermission(ALL_PERMISSIONS.BOOKING_CHANGES.REFUND);
  const allowed = read || create || review || refund;
  const [rows, setRows] = useState<ChangeRequest[]>([]);
  const [proposals, setProposals] = useState<ShopProposal[]>([]);
  const [capped, setCapped] = useState(false);
  const [departures, setDepartures] = useState<ITourDeparture[]>([]);
  const [open, setOpen] = useState(false);
  const [busy, setBusy] = useState(false);
  const [key, setKey] = useState('');
  const [preview, setPreview] = useState<{ input: ShopInput; bookingCount: number; occupiedSeats: number } | null>(null);
  const [action, setAction] = useState<{ row: ChangeRequest; name: string } | null>(null);
  const [form] = Form.useForm<ShopForm>();
  const [actionForm] = Form.useForm<ActionForm>();
  const requestId = useRef(0);
  const refresh = useCallback(async () => {
    if (!allowed) return;
    const current = ++requestId.current;
    // Danh sách lịch phụ chỉ để chọn khi tạo sự cố; lỗi của nó không được chặn bảng chính.
    const [data, ds] = await Promise.allSettled([
      bookingChanges.admin(tourId),
      create ? getDepartureHistoryByTourId(tourId) : Promise.resolve(null),
    ]);
    // A response for another tour (or a superseded refresh) must not overwrite this table.
    if (current !== requestId.current) return;
    if (data.status === 'fulfilled') {
      setRows(data.value.requests);
      setProposals(data.value.proposals);
      setCapped(isListCapped(data.value.requests) || isListCapped(data.value.proposals));
    }
    if (ds.status === 'fulfilled' && ds.value?.code === 1000) setDepartures(ds.value.result);
    const failure = data.status === 'rejected' ? data.reason
      : ds.status === 'rejected' ? ds.reason : null;
    if (failure) message.error(changeError(failure));
  }, [tourId, allowed, create]);
  useEffect(() => {
    // Never keep showing the previous tour's requests while the new tour loads.
    requestId.current += 1;
    setRows([]);
    setProposals([]);
    setDepartures([]);
    setCapped(false);
    setAction(null);
    void refresh();
    return () => { requestId.current += 1; };
  }, [refresh]);
  async function prepare() {
    let values: ShopForm;
    try { values = await form.validateFields(); } catch { return; }
    setBusy(true);
    try {
      const summary = await getDepartureCapacity(values.sourceId);
      if (summary.code !== 1000) throw new Error('Không đọc được phiên bản lịch');
      const input: ShopInput = { ...values, clientKey: key, expectedVersion: summary.result.version, departureAt: values.departureAt.format('YYYY-MM-DDTHH:mm:ss'), returnAt: values.returnAt.format('YYYY-MM-DDTHH:mm:ss'), responseDeadline: values.responseDeadline.format('YYYY-MM-DDTHH:mm:ss') };
      const result = await bookingChanges.preview(input); setPreview({ input, ...result });
    } catch (e) { message.error(changeError(e), 8); } finally { setBusy(false); }
  }
  async function saveProposal() {
    if (!preview) return;
    setBusy(true);
    try { await bookingChanges.shop(preview.input); setOpen(false); await refresh(); onChanged(); message.success('Đã dừng chuyến cũ và gửi đề xuất. Chưa tự chuyển booking.'); }
    catch (e) { message.error(changeError(e), 8); } finally { setBusy(false); }
  }
  async function saveAction() {
    if (!action) return;
    let values: ActionForm;
    try { values = await actionForm.validateFields(); } catch { return; }
    setBusy(true);
    try {
      if (action.name === 'REFUND') await bookingChanges.refund(action.row, values.amount, values.reference, values.note, values.completed);
      else await bookingChanges.review(action.row, action.name, values.note);
      setAction(null); await refresh(); onChanged(); message.success('Đã xử lý và lưu nhật ký');
    } catch (e) { message.error(changeError(e), 8); } finally { setBusy(false); }
  }
  function choose(row: ChangeRequest, name: string) { setAction({ row, name }); actionForm.resetFields(); if (name === 'REFUND' && row.paid_amount) actionForm.setFieldValue('amount', Number(row.paid_amount)); }
  if (!allowed) return null;
  return <Card className="mt-4" title="Dời lịch và xử lý sự cố" extra={<Space><Button onClick={() => void refresh()}>Tải lại</Button>{create && <Button danger onClick={() => { form.resetFields(); setPreview(null); setKey(createClientKey()); setOpen(true); }}>Khai báo sự cố bắt buộc</Button>}</Space>}>
    <Alert type="info" showIcon message="Giữ nguyên lịch sử chuyến cũ. Chỉ chuyển booking đã đồng ý; không lấy im lặng làm đồng ý. Lịch thay thế được giữ riêng đến khi giải quyết hết khách ở chuyến cũ." />
    {capped && <Alert className="mt-3" type="warning" showIcon message="Danh sách dời lịch đã đạt giới hạn 500 bản ghi. Dữ liệu có thể chưa đầy đủ, hãy thu hẹp theo tour hoặc kiểm tra trực tiếp trước khi kết luận." />}
    <Table<ShopProposal> rowKey="id" size="small" dataSource={proposals} pagination={{ pageSize: 3 }} columns={[
      { title: 'Sự cố', render: (_, r) => `#${r.id} — lịch ${r.source_departure_id} → ${r.target_departure_id}` },
      { title: 'Hạn phản hồi', render: (_, r) => dayjs(r.response_deadline).format('HH:mm DD/MM/YYYY') },
      { title: 'Trạng thái', render: (_, r) => {
        const item = proposalStatus(r.status);
        return <Tag color={item.color}>{item.label}</Tag>;
      } },
      { title: 'Hoàn tất xử lý', render: (_, r) => create && r.status === 'OPEN' && <Button loading={busy} onClick={() => Modal.confirm({ title: 'Đóng chuyến cũ và mở bán lịch thay thế?', content: 'Chỉ thực hiện khi toàn bộ booking chuyến cũ đã được xử lý. Hệ thống sẽ kiểm tra lại trước khi mở.', onOk: async () => { setBusy(true); try { await bookingChanges.activate(r.id); await refresh(); onChanged(); } catch (e) { message.error(changeError(e)); throw e; } finally { setBusy(false); } } })}>Kiểm tra và mở lịch mới</Button> },
    ]} expandable={{ expandedRowRender: r => <><p>{r.reason}</p><p>Bằng chứng: {r.evidence}</p></> }} />
    <Table<ChangeRequest> rowKey="id" size="small" dataSource={rows} pagination={{ pageSize: 5 }} columns={[
      { title: 'Yêu cầu', render: (_, r) => `#${r.id} / Booking #${r.booking_id} / ${r.kind === 'SHOP' ? 'Shop đề xuất' : 'Khách yêu cầu'}` },
      { title: 'Liên hệ', render: (_, r) => <>{r.username}<br />{r.email}</> },
      { title: 'Lịch gốc → mới', render: (_, r) => `${dayjs(r.source_departure_at).format('HH:mm DD/MM/YYYY')} → ${dayjs(r.target_departure_at).format('HH:mm DD/MM/YYYY')}` },
      { title: 'Trạng thái', render: (_, r) => {
        const item = changeStatus(r.status);
        return <Tag color={item.color}>{item.label}</Tag>;
      } },
      { title: 'Xử lý', render: (_, r) => r.active_key != null && <Space wrap>
        {review && <>{(r.kind === 'CUSTOMER' && r.status === 'PENDING' || r.kind === 'SHOP' && r.status === 'ACCEPTED') && <Button onClick={() => choose(r, 'APPROVE')}>Duyệt chuyển</Button>}
          {r.kind === 'SHOP' && ['PENDING', 'SUPPORT_REQUIRED'].includes(r.status) && <Button onClick={() => choose(r, 'RECORD_CONSENT')}>Ghi nhận đồng ý ngoài web</Button>}
          {r.kind === 'SHOP' && <Button onClick={() => choose(r, 'RECORD_REFUND_REQUEST')}>Ghi nhận khách yêu cầu hoàn tiền</Button>}
          <Button onClick={() => choose(r, 'REJECT')}>{r.kind === 'SHOP' ? 'Chuyển hỗ trợ' : 'Từ chối'}</Button>
          {r.kind === 'SHOP' && <Button danger onClick={() => choose(r, 'CANCEL_UNPAID')}>Hủy nếu chưa thanh toán</Button>}</>}
        {refund && r.status === 'SUPPORT_REQUIRED' && Boolean(r.refund_requested) && <Button danger onClick={() => choose(r, 'REFUND')}>Ghi nhận hoàn tiền</Button>}
      </Space> },
    ]} expandable={{ expandedRowRender: r => <><p>{r.reason}</p>{r.refund_reference && <p>Hoàn tiền: {formatCurrencyVND(Number(r.refund_amount))} — {r.refund_reference}</p>}<ul>{r.events?.map((e, i) => <li key={i}>{dayjs(e.created_at).format('HH:mm DD/MM/YYYY')} — tài khoản #{e.actor_id} — {changeStatus(e.action).label}: {e.note}</li>)}</ul></> }} />
    <Modal title="Sự cố khiến chuyến cũ không thể khởi hành" open={open} onCancel={() => setOpen(false)} footer={null} maskClosable={!busy} closable={!busy} width={760}>
      <Form form={form} layout="vertical" onValuesChange={() => setPreview(null)}>
        <Form.Item name="sourceId" label="Lịch cũ" rules={[{ required: true }]}><Select options={departures.map(d => ({ value: Number(d.id), label: `${d.tourCode} — ${dayjs(d.departureDate).format('HH:mm DD/MM/YYYY')}` }))} /></Form.Item>
        <Form.Item name="reasonCode" label="Nguyên nhân bắt buộc" rules={[{ required: true }]}><Select options={[{ value: 'NATURAL_DISASTER', label: 'Thiên tai' }, { value: 'OFFICIAL_SAFETY_RESTRICTION', label: 'Hạn chế an toàn từ cơ quan có thẩm quyền' }, { value: 'UNAVOIDABLE_TRANSPORT_DISRUPTION', label: 'Gián đoạn vận chuyển bất khả kháng' }]} /></Form.Item>
        <Form.Item name="reason" label="Mô tả sự cố và tác động tới chuyến cũ" rules={[{ required: true, min: 20 }]}><Input.TextArea maxLength={1000} /></Form.Item>
        <Form.Item name="evidence" label="Bằng chứng / số văn bản / nguồn thông báo đã kiểm chứng" rules={[{ required: true, min: 10 }]}><Input.TextArea maxLength={1000} /></Form.Item>
        <Space wrap><Form.Item name="departureAt" label="Giờ đi mới (giờ Việt Nam)" rules={[{ required: true }]}><DatePicker showTime format="HH:mm DD/MM/YYYY" onChange={value => { const source = departures.find(d => Number(d.id) === form.getFieldValue('sourceId')); if (value && source) form.setFieldValue('returnAt', value.add(dayjs(source.returnDate).diff(dayjs(source.departureDate)), 'millisecond')); }} /></Form.Item><Form.Item name="returnAt" label="Giờ về mới, giữ thời lượng cũ" rules={[{ required: true }]}><DatePicker showTime format="HH:mm DD/MM/YYYY" /></Form.Item></Space>
        <Form.Item name="responseDeadline" label="Hạn phản hồi trước cả hai giờ khởi hành" rules={[{ required: true }]}><DatePicker showTime format="HH:mm DD/MM/YYYY" /></Form.Item>
        <Form.Item name="capacity" label="Sức chứa lịch thay thế đã được xác nhận" rules={[{ required: true }]}><InputNumber min={1} max={32767} precision={0} /></Form.Item>
        <Form.Item name="originalCannotDepart" valuePropName="checked" rules={[{ validator: (_, v) => v ? Promise.resolve() : Promise.reject(new Error('Cần xác nhận điều kiện bắt buộc')) }]}><Checkbox>Tôi xác nhận chuyến cũ không thể khởi hành, bằng chứng đã được kiểm tra và lịch thay thế có thể phục vụ.</Checkbox></Form.Item>
        <Space><Button loading={busy} onClick={() => void prepare()}>Kiểm tra ảnh hưởng</Button>{preview && <Button danger loading={busy} onClick={() => void saveProposal()}>Xác nhận dừng lịch cũ và gửi đề xuất</Button>}</Space>
        {preview && <Alert className="mt-3" type="warning" message={`${preview.bookingCount} booking bị ảnh hưởng; ${preview.occupiedSeats} chỗ đã chiếm. Chưa có thay đổi dữ liệu cho đến khi xác nhận.`} />}
      </Form>
    </Modal>
    <Modal title={`Booking #${action?.row.booking_id} — ${action?.name || ''}`} open={!!action} onCancel={() => setAction(null)} onOk={() => void saveAction()} confirmLoading={busy} maskClosable={!busy} closable={!busy} cancelButtonProps={{ disabled: busy }}>
      <Form form={actionForm} layout="vertical">
        {action?.name === 'RECORD_REFUND_REQUEST' && <Alert type="warning" message="Cần ghi rõ bằng chứng khách đã yêu cầu hoàn tiền qua kênh hỗ trợ. Đây chưa phải xác nhận đã hoàn tiền." />}
        {action?.name === 'RECORD_CONSENT' && <Alert type="warning" message="Chỉ ghi nhận sau khi khách đã đồng ý thực tế với đúng lịch đề xuất. Cần nêu kênh liên hệ, thời điểm và bằng chứng xác nhận. Không dùng việc khách chưa phản hồi." />}
        {action?.name === 'REFUND' && <><Alert type="warning" message="Màn hình này ghi nhận hoàn tiền đã thực hiện thủ công, không gọi API ngân hàng. Chứng từ thu tiền gốc được giữ nguyên." />
          <Form.Item name="amount" label="Số tiền hoàn toàn bộ (phải khớp chứng từ)" rules={[{ required: true }]}><InputNumber min={1} precision={0} /></Form.Item>
          <Form.Item name="reference" label="Mã giao dịch / bằng chứng hoàn tiền thực tế" rules={[{ required: true, whitespace: true }]}><Input maxLength={191} /></Form.Item>
          <Form.Item name="completed" valuePropName="checked" rules={[{ validator: (_, v) => v ? Promise.resolve() : Promise.reject(new Error('Chỉ lưu khi đã hoàn tiền thực tế')) }]}><Checkbox>Đã hoàn tiền thực tế và kiểm tra bằng chứng</Checkbox></Form.Item></>}
        <Form.Item name="note" label="Lý do / bằng chứng xử lý" rules={[{ required: true, whitespace: true, min: 10 }]}><Input.TextArea rows={4} maxLength={1000} /></Form.Item>
      </Form>
    </Modal>
  </Card>;
}
