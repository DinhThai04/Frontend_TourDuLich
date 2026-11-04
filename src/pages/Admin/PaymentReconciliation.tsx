import { useCallback, useEffect, useRef, useState } from 'react';
import { Alert, Button, Checkbox, DatePicker, Form, Input, InputNumber, Modal, Select, Space, Table, Tag, Typography, message } from 'antd';
import type { ColumnsType } from 'antd/es/table';
import type { Dayjs } from 'dayjs';
import { reconciliationServices, type ReconciliationAction, type ReconciliationEvent, type ReconciliationRow } from '@/services/reconciliationServices';
import { ALL_PERMISSIONS as P } from '@/config/permissions';
import { useHasPermission } from '@/config/useHasPermission';
import { errorMessage } from '@/utils/errors';
import { formatCurrencyVND, formatDatetime } from '@/utils';

const labels: Record<ReconciliationAction, string> = {
  UNPAID_CONFIRMED: 'Xác nhận chưa thu tiền', PAYMENT_FOUND: 'Phát hiện đã thu tiền, cần hỗ trợ/hoàn tiền', REFUND_RECORDED: 'Ghi nhận đã hoàn đủ tiền',
};
const transactionLabels: Record<string, string> = { PENDING: 'Chờ kết quả đối soát', CLOSED_UNPAID: 'Đã xác nhận chưa thu tiền', REFUNDED: 'Đã ghi nhận hoàn tiền', PAID: 'Đã thanh toán', FAILED: 'Không thành công' };
const providerLabels: Record<string, string> = { VNPAY: 'VNPay', MOMO: 'MoMo' };
const reasonLabels: Record<string, string> = {
  MANUAL_PAYMENT_FOUND: 'Phát hiện thu tiền qua đối chiếu thủ công', LATE_PAYMENT_AFTER_MANUAL_UNPAID: 'Nhận xác nhận thu tiền sau khi đã đóng là chưa thu tiền',
  BOOKING_CANCELLED_OR_EXPIRED: 'Booking đã hủy hoặc hết hạn', ANOTHER_PAYMENT_EXISTS: 'Booking đã có khoản thanh toán khác',
  RESERVATION_NO_LONGER_VALID: 'Giữ chỗ không còn hiệu lực', DEPARTURE_CHANGED: 'Lịch khởi hành đã đổi', DEPARTURE_SUSPENDED: 'Chuyến đi đang tạm dừng',
  TOUR_ALREADY_DEPARTED: 'Chuyến đi đã khởi hành', INSUFFICIENT_SEATS: 'Không còn đủ chỗ', PROVIDER_TIME_OUTSIDE_CHECKOUT: 'Giờ thu tiền ngoài hạn thanh toán', BOOKING_OWNER_CHANGED: 'Tài khoản của booking đã thay đổi',
};
type Values = { action: ReconciliationAction; reference: string; note: string; confirmed: boolean; providerPaidAt?: Dayjs };
export default function PaymentReconciliation() {
  const canResolve = useHasPermission(P.PAYMENT_RECONCILIATION.RESOLVE);
  const canHistory = useHasPermission(P.PAYMENT_RECONCILIATION.HISTORY);
  const [rows, setRows] = useState<ReconciliationRow[]>([]);
  const [page, setPage] = useState(0);
  const [view, setView] = useState('ACTIONABLE');
  const [hasNext, setHasNext] = useState(false);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [selected, setSelected] = useState<ReconciliationRow | null>(null);
  const [events, setEvents] = useState<ReconciliationEvent[] | null>(null);
  const [form] = Form.useForm<Values>();
  const action = Form.useWatch('action', form);
  // Chỉ phản hồi của lần tải mới nhất được ghi vào state, tránh dữ liệu cũ đè dữ liệu mới.
  const loadId = useRef(0);
  const historyId = useRef(0);
  const load = useCallback(async () => {
    const requestId = ++loadId.current;
    setLoading(true);
    try {
      const response = await reconciliationServices.list(page, view);
      if (requestId !== loadId.current) return;
      setRows(response.result.items); setHasNext(response.result.hasNext);
    } catch (error) {
      if (requestId === loadId.current) message.error(errorMessage(error));
    } finally {
      if (requestId === loadId.current) setLoading(false);
    }
  }, [page, view]);
  useEffect(() => { void load(); }, [load]);
  const open = (row: ReconciliationRow) => {
    form.resetFields(); form.setFieldsValue({ action: row.case_status === 'OPEN' ? 'REFUND_RECORDED' : 'UNPAID_CONFIRMED', confirmed: false }); setSelected(row);
  };
  const submit = async (values: Values) => {
    if (!selected) return;
    // Enter in a field and the button both submit; a second resolution is never wanted.
    if (saving) return;
    setSaving(true);
    try {
      await reconciliationServices.resolve(selected.txn_ref, { ...values, amountVnd: Number(selected.amount_vnd),
        providerPaidAt: values.providerPaidAt?.format('YYYY-MM-DDTHH:mm:ss') });
      message.success('Đã ghi nhận kết quả đối soát và lịch sử xử lý.'); setSelected(null); await load();
    } catch (error) { message.error(errorMessage(error)); }
    finally { setSaving(false); }
  };
  const showHistory = async (ref: string) => {
    const requestId = ++historyId.current;
    try { const response = await reconciliationServices.history(ref); if (requestId === historyId.current) setEvents(response.result); }
    catch (error) { if (requestId === historyId.current) message.error(errorMessage(error)); }
  };
  const closeHistory = () => { historyId.current += 1; setEvents(null); };
  const columns: ColumnsType<ReconciliationRow> = [
    { title: 'Giao dịch / booking', key: 'ref', render: (_, row) => <><Typography.Text copyable>{row.txn_ref}</Typography.Text><br />Booking #{row.booking_id}</> },
    { title: 'Cổng thanh toán', key: 'provider', render: (_, row) => providerLabels[row.provider] || row.provider },
    { title: 'Khách hàng', key: 'customer', render: (_, row) => <>{row.username}<br />{row.email}</> },
    { title: 'Số tiền', dataIndex: 'amount_vnd', render: value => formatCurrencyVND(Number(value)) },
    { title: 'Trạng thái', key: 'state', render: (_, row) => <><Tag>{transactionLabels[row.status] || row.status}</Tag>{row.case_status && <Tag color={row.case_status === 'OPEN' ? 'orange' : 'green'}>{row.case_status === 'OPEN' ? 'Cần xử lý' : 'Đã hoàn tiền'}</Tag>}<div>{row.reason ? reasonLabels[row.reason] || row.reason : ''}</div></> },
    { title: 'Hết hạn', dataIndex: 'expires_at', render: value => (value ? formatDatetime(String(value)) : '—') },
    { title: 'Thao tác', key: 'actions', render: (_, row) => <Space wrap>
      {canResolve && view === 'ACTIONABLE' && <Button onClick={() => open(row)}>Ghi nhận xử lý</Button>}
      {canHistory && <Button onClick={() => void showHistory(row.txn_ref)}>Lịch sử</Button>}
    </Space> },
  ];
  return <Space direction="vertical" style={{ width: '100%' }} size="middle">
    <Typography.Title level={3}>Đối soát thanh toán VNPay / MoMo</Typography.Title>
    <Alert type="info" showIcon message="Đối chiếu chứng từ trước khi xác nhận"
      description="Giao dịch quá hạn chưa có kết quả không đồng nghĩa chưa thu tiền. Màn hình này ghi nhận kết quả kiểm tra thủ công; không chuyển tiền, không gọi hoàn tiền ngân hàng và không tự xác nhận booking đã thanh toán." />
    <Space><Select value={view} onChange={value => { setPage(0); setView(value); }} style={{ width: 220 }} options={[{ value: 'ACTIONABLE', label: 'Cần xử lý' }, { value: 'HISTORY', label: 'Đã có lịch sử xử lý' }]} /><Button loading={loading} onClick={() => void load()}>Tải lại</Button></Space>
    <Table rowKey={(row) => `${row.provider}-${row.txn_ref}`} dataSource={rows} columns={columns} loading={loading} pagination={false} scroll={{ x: 1150 }} />
    <Space><Button disabled={page === 0 || loading} onClick={() => setPage(value => value - 1)}>Trang trước</Button><span>Trang {page + 1}</span><Button disabled={!hasNext || loading} onClick={() => setPage(value => value + 1)}>Trang sau</Button></Space>
    <Modal title="Ghi nhận kết quả đối soát" open={!!selected} onCancel={() => { if (!saving) setSelected(null); }} onOk={() => form.submit()} confirmLoading={saving} maskClosable={!saving}>
      <Alert type="warning" showIcon message="Chỉ xác nhận sau khi đã đối chiếu với ngân hàng/cổng thanh toán. Ghi nhận hoàn tiền yêu cầu khoản hoàn đã thực hiện bên ngoài hệ thống." style={{ marginBottom: 16 }} />
      <Form form={form} layout="vertical" onFinish={submit}>
        <Form.Item name="action" label="Kết quả" rules={[{ required: true }]}><Select options={(selected?.case_status === 'OPEN' ? ['REFUND_RECORDED'] : ['UNPAID_CONFIRMED', 'PAYMENT_FOUND']).map(value => ({ value, label: labels[value as ReconciliationAction] }))} /></Form.Item>
        <Form.Item label="Số tiền đối chiếu (VND)"><InputNumber value={Number(selected?.amount_vnd ?? 0)} disabled style={{ width: '100%' }} /></Form.Item>
        {action === 'PAYMENT_FOUND' && <Form.Item name="providerPaidAt" label="Ngày giờ đã thu tiền (giờ Việt Nam)" rules={[{ required: true }]}><DatePicker showTime format="DD/MM/YYYY HH:mm:ss" style={{ width: '100%' }} /></Form.Item>}
        <Form.Item name="reference" label={action === 'REFUND_RECORDED' ? 'Mã chứng từ hoàn tiền' : 'Tham chiếu chứng từ đối chiếu'} rules={[{ required: true }, { pattern: /^[A-Za-z0-9._:/-]{3,100}$/, message: 'Từ 3–100 ký tự: chữ không dấu, số, . _ : / -' }]}><Input maxLength={100} /></Form.Item>
        <Form.Item name="note" label="Ghi chú kết quả kiểm tra" rules={[{ required: true, whitespace: true }, { max: 1000 }]}><Input.TextArea maxLength={1000} rows={4} /></Form.Item>
        <Form.Item name="confirmed" valuePropName="checked" rules={[{ validator: (_, value) => value === true ? Promise.resolve() : Promise.reject(new Error('Cần xác nhận đã đối chiếu.')) }]}><Checkbox>Tôi đã kiểm tra chứng từ và chịu trách nhiệm về kết quả ghi nhận.</Checkbox></Form.Item>
      </Form>
    </Modal>
    <Modal title="Lịch sử đối soát" open={events !== null} onCancel={closeHistory} footer={<Button onClick={closeHistory}>Đóng</Button>} width={850}>
      <Table rowKey="id" dataSource={events ?? []} pagination={false} columns={[
        { title: 'Thời gian', dataIndex: 'created_at', render: value => (value ? formatDatetime(String(value)) : '—') }, { title: 'Người xử lý', key: 'actor', render: (_, row) => row.actor_name || `#${row.actor_id}` },
        { title: 'Kết quả', dataIndex: 'action', render: value => labels[value as ReconciliationAction] }, { title: 'Tham chiếu', dataIndex: 'reference' }, { title: 'Ghi chú', dataIndex: 'note' },
      ]} />
    </Modal>
  </Space>;
}
