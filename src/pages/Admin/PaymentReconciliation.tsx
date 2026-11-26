import AdminPagination from '@/components/Admin/Shared/AdminPagination';
import { useAdminPagination } from '@/components/Admin/Shared/useAdminPagination';
import AdminPageHeader from '@/components/Admin/Shared/AdminPageHeader';
import { ReloadOutlined } from '@ant-design/icons';
import { formatAdminDatetime } from '@/components/Admin/Shared/adminDate';
import AdminLookup from '@/components/Admin/Shared/AdminLookup';
import { AdminStatus } from '@/components/Admin/Shared/AdminStatus';
import { AdminTable as Table } from '@/components/Admin/Shared/AdminTable';
import { useCallback, useEffect, useRef, useState } from 'react';
import { Alert, Button, Card, Checkbox, DatePicker, Descriptions, Drawer, Empty, Form, Input, Radio, Modal, Skeleton, Space, Tabs, Typography, Tooltip, message } from 'antd';
import type { ColumnsType } from 'antd/es/table';
import type { Dayjs } from 'dayjs';
import { reconciliationServices, type ReconciliationAction, type ReconciliationEvent, type ReconciliationRow } from '@/services/reconciliationServices';
import { ALL_PERMISSIONS as P } from '@/config/permissions';
import { useHasPermission } from '@/config/useHasPermission';
import { errorMessage } from '@/utils/errors';
import { formatCurrencyVND, formatDatetime, parseDate } from '@/utils';
import { Link, useSearchParams } from 'react-router-dom';

const labels: Record<ReconciliationAction, string> = {
  UNPAID_CONFIRMED: 'Xác nhận chưa thu tiền',
  PAYMENT_FOUND: 'Xác nhận đã thu tiền',
  REFUND_RECORDED: 'Ghi nhận khoản hoàn đã thực hiện',
};
const statuses: Record<string, string> = {
  PENDING: 'Chờ kết quả', CLOSED_UNPAID: 'Đã đóng · chưa thu', REFUNDED: 'Đã ghi nhận hoàn tiền',
  PAID: 'Đã thanh toán', FAILED: 'Không thành công',
};
const providers: Record<string, string> = { VNPAY: 'VNPay', MOMO: 'MoMo' };
const reasons: Record<string, string> = {
  MANUAL_PAYMENT_FOUND: 'Đã phát hiện khoản thu khi đối chiếu',
  LATE_PAYMENT_AFTER_MANUAL_UNPAID: 'Xác nhận thu tiền đến sau khi hồ sơ đã đóng',
  BOOKING_CANCELLED_OR_EXPIRED: 'Đơn đã hủy hoặc hết hạn', ANOTHER_PAYMENT_EXISTS: 'Đơn đã có khoản thanh toán khác',
  RESERVATION_NO_LONGER_VALID: 'Giữ chỗ không còn hiệu lực', DEPARTURE_CHANGED: 'Lịch khởi hành đã đổi',
  DEPARTURE_SUSPENDED: 'Chuyến đi đang tạm dừng', TOUR_ALREADY_DEPARTED: 'Chuyến đi đã khởi hành',
  INSUFFICIENT_SEATS: 'Không đủ chỗ', PROVIDER_TIME_OUTSIDE_CHECKOUT: 'Thu tiền ngoài hạn thanh toán',
  BOOKING_OWNER_CHANGED: 'Tài khoản của đơn đã thay đổi',
};
type Values = { action: ReconciliationAction; reference: string; note: string; confirmed: boolean; providerPaidAt?: Dayjs };

function statusTag(row: ReconciliationRow) {
  if (row.case_status === 'OPEN') return <AdminStatus tone="warning">Chờ xử lý khoản thu</AdminStatus>;
  if (row.case_status === 'REFUNDED') return <AdminStatus tone="success">Đã ghi nhận hoàn tiền</AdminStatus>;
  return <AdminStatus tone={row.status === 'PENDING' ? 'warning' : row.status === 'PAID' ? 'success' : 'neutral'}>
    {statuses[row.status] || row.status}
  </AdminStatus>;
}

function actionable(row: ReconciliationRow) {
  const expires = parseDate(row.expires_at);
  return (row.case_status === 'OPEN' && row.status !== 'PAID') || (row.status === 'PENDING' && !row.case_status && !!expires && Number(expires) <= Date.now());
}

export default function PaymentReconciliation() {
  const [params, setParams] = useSearchParams();
  const focusedRef = params.get('txnRef') || undefined;
  const bookingParam = params.get('bookingId');
  const focusedBooking = bookingParam && /^[1-9][0-9]{0,9}$/.test(bookingParam) && Number(bookingParam) <= 2147483647
    ? Number(bookingParam) : undefined;
  const focused = !!focusedBooking || !!focusedRef;
  const canResolve = useHasPermission(P.PAYMENT_RECONCILIATION.RESOLVE);
  const canHistory = useHasPermission(P.PAYMENT_RECONCILIATION.HISTORY);
  const canSeeBooking = useHasPermission(P.BOOKINGS.GET_ALL);
  const canSeeInvoices = useHasPermission(P.INVOICES.GET_ALL);
  const [rows, setRows] = useState<ReconciliationRow[]>([]);
  const { page, size, mode, change, tableRef } = useAdminPagination();
  const [view, setView] = useState('ACTIONABLE');
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState('');
  const [selected, setSelected] = useState<ReconciliationRow>();
  const [tab, setTab] = useState('details');
  const [events, setEvents] = useState<ReconciliationEvent[]>();
  const [historyError, setHistoryError] = useState('');
  const [saving, setSaving] = useState(false);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [form] = Form.useForm<Values>();
  const action = Form.useWatch('action', form);
  const loadId = useRef(0);
  const historyId = useRef(0);
  const savingRef = useRef(false);

  const load = useCallback(async () => {
    const request = ++loadId.current;
    setLoading(true);
    setLoadError('');
    try {
      const response = await reconciliationServices.list(page - 1, focused ? 'ALL' : view, { txnRef: focusedRef, bookingId: focusedBooking, size });
      if (response.code !== 1000) throw new Error(response.message || 'Chưa tải được hồ sơ');
      if (request === loadId.current) {
        setRows(response.result.items);
        setTotal(response.result.total ?? (page - 1) * size + response.result.items.length + Number(response.result.hasNext));
      }
    } catch (error) {
      if (request === loadId.current) {
        setRows([]);
        setTotal(0);
        setLoadError(errorMessage(error));
      }
    } finally {
      if (request === loadId.current) setLoading(false);
    }
  }, [page, size, view, focused, focusedRef, focusedBooking]);

  useEffect(() => {
    void load();
    return () => { loadId.current += 1; };
  }, [load]);

  const selectedRef = selected?.txn_ref;
  useEffect(() => {
    if (tab !== 'history' || !selectedRef || !canHistory) return;
    const request = ++historyId.current;
    setEvents(undefined);
    setHistoryError('');
    void reconciliationServices.history(selectedRef).then(response => {
      if (response.code !== 1000) throw new Error(response.message || 'Chưa tải được lịch sử');
      if (request === historyId.current) setEvents(response.result);
    }).catch(error => {
      if (request === historyId.current) setHistoryError(errorMessage(error));
    });
    return () => { historyId.current += 1; };
  }, [tab, selectedRef, canHistory]);

  function open(row: ReconciliationRow) {
    form.resetFields();
    setEvents(undefined);
    setSelected(row);
    setTab('details');
  }

  async function submit(values: Values) {
    if (!selected || !canResolve || !actionable(selected) || savingRef.current) return;
    savingRef.current = true;
    setSaving(true);
    try {
      const { action, reference, note, providerPaidAt, confirmed } = values;
      const response = await reconciliationServices.resolve(selected.txn_ref, {
        action, reference: reference.trim(), note: note.trim(), confirmed, amountVnd: Number(selected.amount_vnd),
        providerPaidAt: action === 'PAYMENT_FOUND' ? providerPaidAt?.format('YYYY-MM-DDTHH:mm:ss') : undefined,
      });
      if (response.code !== 1000) throw new Error(response.message || 'Chưa ghi nhận được kết quả');
      message.success('Đã lưu kết quả vào lịch sử đối soát');
      form.resetFields();
      setSelected(current => current && ({
        ...current, status: response.result.status || current.status,
        case_status: action === 'REFUND_RECORDED' ? 'REFUNDED' : action === 'PAYMENT_FOUND' ? 'OPEN' : null,
      }));
      setConfirmOpen(false);
      setTab(canHistory ? 'history' : 'details');
      await load();
    } catch (error) {
      message.error(errorMessage(error));
    } finally {
      savingRef.current = false;
      setSaving(false);
    }
  }

  const mayRecord = !!selected && canResolve && actionable(selected);
  const columns: ColumnsType<ReconciliationRow> = [
    { title: 'Hồ sơ', key: 'reference', render: (_, row) => <>
      <Button type="link" className="!h-auto !p-0 font-semibold" disabled={loading} onClick={() => open(row)}>Đơn #{row.booking_id} · {providers[row.provider] || row.provider}</Button>
      <div className="text-xs text-slate-600"><Typography.Text title={row.txn_ref} copyable={{ text: row.txn_ref }}>…{row.txn_ref.slice(-12)}</Typography.Text></div>
    </> },
    { title: 'Khách hàng', key: 'customer', render: (_, row) => <><strong>{row.username || '—'}</strong><div className="text-xs text-slate-600">{row.email}</div></> },
    { title: 'Số tiền', align: 'right', dataIndex: 'amount_vnd', render: value => <strong>{formatCurrencyVND(Number(value))}</strong> },
    { title: 'Trạng thái', render: (_, row) => <>{statusTag(row)}{row.reason && <div className="mt-1 text-xs text-slate-600">{reasons[row.reason] || row.reason}</div>}</> },
    { title: 'Hết hạn', dataIndex: 'expires_at', render: value => value ? formatAdminDatetime(String(value)) : '—' },
    { title: 'Thao tác', width: 100, render: (_, row) => <Button size="small" disabled={loading} onClick={() => open(row)}>Chi tiết</Button> },
  ];
  return <div className="admin-dashboard">
    <AdminPageHeader title="Đối soát thanh toán" description="Tra cứu các lần thanh toán của đơn, đối chiếu chứng từ và lưu kết quả xử lý." />
    <Card title="Hồ sơ VNPay và MoMo">
      <div ref={tableRef} className="grid gap-4">
        {!focused && <Tabs activeKey={view} onChange={value => { change(1); setView(value); }} items={[
          { key: 'ACTIONABLE', label: 'Cần xử lý' }, { key: 'HISTORY', label: 'Đã ghi nhận' },
        ]} />}
        <Space wrap>
          <AdminLookup value={focusedRef ?? (focusedBooking ? String(focusedBooking) : '')}
            onLookup={value => {
              if (value && !/^[A-Za-z0-9_-]{1,32}$/.test(value.replace(/^#/, ''))) return;
              const id = value.replace(/^#/, '');
              const scope: Record<string, string> = !value ? {} : /^[1-9][0-9]{0,9}$/.test(id) && Number(id) <= 2147483647 ? { bookingId: id } : { txnRef: value };
              setParams({ ...scope, size: String(mode) }, { replace: true });
            }} placeholder="Mã đơn hoặc mã giao dịch" />
          <Tooltip title="Làm mới"><Button aria-label="Làm mới" icon={<ReloadOutlined />} loading={loading} onClick={() => void load()} /></Tooltip>
        </Space>
        {focused && <Alert showIcon type="info" message={focusedRef ? `Kết quả cho giao dịch ${focusedRef}` : `Các lần thanh toán của đơn #${focusedBooking}`}
          action={<Button size="small" onClick={() => { setParams({ size: String(mode) }); }}>Bỏ tra cứu</Button>} />}
        {loadError && <Alert type="error" showIcon message={loadError} />}
        <Table rowKey={row => `${row.provider}-${row.txn_ref}`} size="small" dataSource={rows} columns={columns}
          loading={loading} scroll={{ x: 730 }} pagination={false} locale={{
            emptyText: loadError ? 'Chưa tải được hồ sơ' : focused ? 'Không tìm thấy giao dịch theo bộ lọc' : 'Danh sách này hiện trống',
          }} />
        {!loadError && <AdminPagination mode={mode} page={page} size={size} total={total} onChange={change} />}
      </div>
    </Card>
    <Drawer width={640} title={`Hồ sơ đối soát · Đơn #${selected?.booking_id ?? ''}`} open={!!selected}
      onClose={() => { if (!savingRef.current) setSelected(undefined); }} destroyOnHidden maskClosable={!saving}
      footer={mayRecord && <Button type="primary" onClick={() => setConfirmOpen(true)}>Ghi nhận kết quả</Button>}>
      {selected && <>
        <div className="admin-detail-summary">
          <div><span>{providers[selected.provider] || selected.provider}</span><strong>{formatCurrencyVND(Number(selected.amount_vnd))}</strong></div>
          {statusTag(selected)}
        </div>
        <Tabs activeKey={tab} onChange={setTab} items={[
          { key: 'details', label: 'Chứng từ', children: <div className="grid gap-4">
            <Descriptions size="small" column={1} items={[
              { key: 'ref', label: 'Mã giao dịch hệ thống', children: <Typography.Text className="break-all" copyable>{selected.txn_ref}</Typography.Text> },
              { key: 'external', label: 'Mã phía cổng', children: (selected.transaction_no || selected.provider_trans_id)
                ? <Typography.Text copyable>{String(selected.transaction_no || selected.provider_trans_id)}</Typography.Text> : 'Chưa ghi nhận' },
              { key: 'customer', label: 'Khách hàng', children: [selected.username, selected.email].filter(Boolean).join(' · ') || '—' },
              { key: 'start', label: 'Tạo giao dịch', children: selected.created_at ? formatAdminDatetime(selected.created_at) : '—' },
              { key: 'expiry', label: 'Hết hạn', children: selected.expires_at ? formatAdminDatetime(selected.expires_at) : '—' },
              { key: 'payment', label: 'Thời điểm đã thu', children: selected.provider_paid_at ? formatAdminDatetime(selected.provider_paid_at) : 'Chưa ghi nhận' },
              { key: 'reason', label: 'Lý do cần đối chiếu', children: selected.reason ? reasons[selected.reason] || selected.reason : '—' },
            ]} />
            <Space wrap>
              {canSeeBooking && <Link to={`/admin/managerBooking?bookingId=${selected.booking_id}`}>Xem đơn</Link>}
              {canSeeInvoices && <Link to={`/admin/managerInvoice?bookingId=${selected.booking_id}`}>Tra hóa đơn của đơn</Link>}
            </Space>
            {mayRecord && <Alert showIcon message="Tra chứng từ trên cổng thanh toán, so khớp mã, số tiền và thời điểm trước khi ghi nhận." />}
          </div> },
          ...(canHistory ? [{ key: 'history', label: 'Lịch sử', children: historyError
            ? <Alert type="error" showIcon message={historyError} />
            : !events ? <Skeleton active paragraph={{ rows: 2 }} />
              : !events.length ? <Empty image={Empty.PRESENTED_IMAGE_SIMPLE} description="Hồ sơ chưa có kết quả được ghi nhận" />
                : <div className="grid gap-3">{events.map(event => <div className="admin-detail-panel" key={event.id}>
                  <strong>{labels[event.action] || event.action}</strong>
                  <p className="mb-1 text-xs text-slate-600">{formatDatetime(event.created_at)} · {event.actor_name || `#${event.actor_id}`} · {formatCurrencyVND(Number(event.amount_vnd))}</p>
                  <Typography.Text copyable>{event.reference}</Typography.Text>
                  <p className="mb-0 mt-2">{event.note}</p>
                </div>)}</div> }] : []),
        ]} />
      </>}
    </Drawer>
    {selected && <Modal title="Ghi nhận kết quả đối soát" open={confirmOpen} width={560} centered
      maskClosable={false} closable={!saving} keyboard={!saving}
      onCancel={() => { if (!savingRef.current) setConfirmOpen(false); }}
      onOk={() => form.submit()} confirmLoading={saving} okText="Lưu kết quả" cancelText="Hủy">
      {action === 'REFUND_RECORDED' && <Alert showIcon type="info"
        message="Chỉ ghi nhận sau khi đã đối chiếu khoản hoàn thực hiện bên ngoài hệ thống."
        description="Thao tác này lưu chứng từ và cập nhật hồ sơ. Hệ thống không gửi lệnh chuyển tiền tới ngân hàng hoặc cổng thanh toán." />}
      <p>Đơn #{selected.booking_id} · <strong>{formatCurrencyVND(Number(selected.amount_vnd))}</strong></p>
      <Form form={form} layout="vertical" onFinish={submit} disabled={saving}>
            <Form.Item name="action" label="Kết quả kiểm tra" rules={[{ required: true, message: 'Chọn kết quả theo chứng từ' }]}>
              <Radio.Group className="flex flex-wrap gap-2" options={(selected.case_status === 'OPEN'
                ? ['REFUND_RECORDED'] : ['UNPAID_CONFIRMED', 'PAYMENT_FOUND']).map(value => ({ value, label: labels[value as ReconciliationAction] }))} />
            </Form.Item>
            {action === 'PAYMENT_FOUND' && <Form.Item name="providerPaidAt" label="Ngày giờ thu tiền (giờ Việt Nam)" rules={[{ required: true }]}>
              <DatePicker showTime format="DD/MM/YYYY HH:mm" className="w-full" />
            </Form.Item>}
            <Form.Item name="reference" label={action === 'REFUND_RECORDED' ? 'Mã chứng từ hoàn tiền' : 'Mã chứng từ đối chiếu'}
              rules={[{ required: true }, { pattern: /^[A-Za-z0-9._:/-]{3,100}$/, message: 'Mã chứng từ cần 3–100 ký tự hợp lệ' }]}>
              <Input maxLength={100} />
            </Form.Item>
            <Form.Item name="note" label="Ghi chú" rules={[{ required: true, whitespace: true, max: 1000 }]}><Input.TextArea rows={3} maxLength={1000} /></Form.Item>
            <Form.Item name="confirmed" valuePropName="checked" rules={[{ validator: (_, value) => value === true
              ? Promise.resolve() : Promise.reject(new Error('Cần xác nhận chứng từ')) }]}>
              <Checkbox>{action === 'REFUND_RECORDED' ? 'Khoản hoàn đã thực hiện trên cổng thanh toán.' : 'Tôi đã đối chiếu chứng từ với cổng thanh toán.'}</Checkbox>
            </Form.Item>
          </Form>
    </Modal>}
  </div>;
}
