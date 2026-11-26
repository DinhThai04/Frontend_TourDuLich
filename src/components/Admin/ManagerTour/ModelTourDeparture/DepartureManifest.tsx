import { Alert, Button, Drawer, Empty, Input, InputNumber, Popconfirm, Select, Space, Spin, Typography } from 'antd';
import { useCallback, useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { AdminStatus } from '@/components/Admin/Shared/AdminStatus';
import { AdminTable } from '@/components/Admin/Shared/AdminTable';
import { formatAdminDatetime } from '@/components/Admin/Shared/adminDate';
import { departureManifest, type Attendance, type Manifest, type ManifestPassenger } from '@/services/departureManifest';
import type { ApiResponse } from '@/types/comment';
import type { ITourDeparture } from '@/types/Tour';
import { errorMessage } from '@/utils/errors';
import { useHasPermission } from '@/config/useHasPermission';

const phaseLabel: Record<Manifest['phase'], string> = {
  SCHEDULED: 'Chờ mở điểm danh',
  BOARDING: 'Đang điểm danh',
  IN_PROGRESS: 'Đang diễn ra',
  AWAITING_CLOSEOUT: 'Chờ chốt chuyến',
  COMPLETED: 'Đã hoàn thành',
  CANCELLED: 'Đã hủy',
  SUSPENDED: 'Tạm dừng',
};

const attendanceLabel: Record<Attendance, string> = {
  EXPECTED: 'Chờ điểm danh',
  BOARDED: 'Đã lên xe',
  NO_SHOW: 'Vắng mặt',
  RETURNED: 'Đã trở về',
};

export default function DepartureManifest({ departure, onClose }: { departure: ITourDeparture; onClose: () => void }) {
  const id = Number(departure.id);
  const [manifest, setManifest] = useState<Manifest>();
  const [error, setError] = useState('');
  const [note, setNote] = useState('');
  const isAdmin = useHasPermission({ code: 'SGU_SUPER_ADMIN' });
  const [guide, setGuide] = useState<number | null>(null);
  const [busy, setBusy] = useState(false);

  const load = useCallback(async (signal?: AbortSignal) => {
    setBusy(true);
    setError('');
    try {
      const response = await departureManifest.get(id, signal);
      if (response.code !== 1000 || !response.result) throw new Error(response.message || 'Chưa tải được danh sách.');
      if (!signal?.aborted) {
        setManifest(response.result);
        setGuide(response.result.guideAccountId ?? null);
      }
    } catch (failure) {
      if (!signal?.aborted) setError(errorMessage(failure, 'Chưa tải được danh sách.'));
    } finally {
      if (!signal?.aborted) setBusy(false);
    }
  }, [id]);

  useEffect(() => {
    const controller = new AbortController();
    void load(controller.signal);
    return () => controller.abort();
  }, [load]);

  async function save(action: () => Promise<ApiResponse<Manifest>>) {
    setBusy(true);
    setError('');
    try {
      const response = await action();
      if (response.code !== 1000 || !response.result) throw new Error(response.message || 'Chưa lưu được thay đổi.');
      setManifest(response.result);
      setGuide(response.result.guideAccountId ?? null);
    } catch (failure) {
      setError(errorMessage(failure, 'Chưa lưu được thay đổi. Hãy tải lại danh sách và kiểm tra trạng thái chuyến.'));
    } finally {
      setBusy(false);
    }
  }

  const phase = manifest?.phase;
  const canMark = phase === 'BOARDING' || phase === 'IN_PROGRESS' || phase === 'AWAITING_CLOSEOUT';
  const canComplete = manifest?.phase === 'AWAITING_CLOSEOUT' && manifest.passengers.some(p => p.status === 'RETURNED')
    && manifest.passengers.every(p => p.status === 'RETURNED' || p.status === 'NO_SHOW');

  function options(status: Attendance) {
    const allowed: Attendance[] = [status, 'BOARDED'];
    if (phase !== 'BOARDING' && status !== 'RETURNED') allowed.push('NO_SHOW');
    if (phase !== 'BOARDING' && status === 'BOARDED') allowed.push('RETURNED');
    return [...new Set(allowed)].map(value => ({ value, label: attendanceLabel[value] }));
  }

  return <Drawer open width={760} title="Vận hành chuyến" onClose={onClose}
    extra={<Button onClick={() => void load()} disabled={busy}>Tải lại</Button>}>
    <Space direction="vertical" size="large" className="w-full">
      <div>
        <Space wrap>
          <Typography.Title level={4} className="!mb-0">{departure.tourCode || `Lịch #${id}`}</Typography.Title>
          {phase && <AdminStatus tone={phase === 'COMPLETED' ? 'success' : phase === 'AWAITING_CLOSEOUT' ? 'attention' : 'neutral'}>{phaseLabel[phase]}</AdminStatus>}
        </Space>
        <div className="mt-2"><Typography.Text type="secondary">
          {formatAdminDatetime(departure.departureDate)} → {formatAdminDatetime(departure.returnDate)}
        </Typography.Text></div>
      </div>
      {error && <Alert showIcon type="error" message={error} />}
      {!manifest && busy && <Spin />}
      {manifest && <>
        {isAdmin && <Space direction="vertical" className="w-full">
          <Typography.Text strong>Hướng dẫn viên phụ trách</Typography.Text>
          <Space wrap>
            <InputNumber aria-label="Mã tài khoản hướng dẫn viên" placeholder="Mã tài khoản" min={1} max={2147483647}
              precision={0} value={guide} onChange={setGuide} disabled={busy}
              className="min-w-36" />
            <Popconfirm title={`Cấp quyền xem danh sách và điểm danh cho tài khoản #${guide}?`}
              onConfirm={() => guide === null ? undefined : save(() => departureManifest.assign(id, guide))}>
              <Button disabled={busy || guide === null || guide === manifest.guideAccountId || phase === 'COMPLETED' || phase === 'CANCELLED'}>Phân công</Button>
            </Popconfirm>
            {manifest.guideAccountId && <Popconfirm title="Gỡ quyền vận hành của hướng dẫn viên?" onConfirm={() => save(() => departureManifest.assign(id, null))}>
              <Button disabled={busy}>Gỡ phân công</Button>
            </Popconfirm>}
            <Link to="/van-hanh-chuyen">Mở trang chuyến được phân công</Link>
          </Space>
        </Space>}
        <AdminTable<ManifestPassenger> rowKey="customerId" size="small" dataSource={manifest.passengers}
          pageScope="departure-manifest"
          locale={{ emptyText: <Empty image={Empty.PRESENTED_IMAGE_SIMPLE} description="Chưa có khách thuộc đơn đã xác nhận thanh toán." /> }}
          columns={[
            { title: 'Hành khách', dataIndex: 'name' },
            { title: 'Đơn đặt chỗ', render: (_, p) => isAdmin ? <Link to={`/admin/managerBooking?bookingId=${p.bookingId}`}>#{p.bookingId}</Link> : `#${p.bookingId}` },
            { title: 'Điểm danh', render: (_, p) => canMark ? <Select
              aria-label={`Điểm danh ${p.name}`} value={p.status} options={options(p.status)}
              disabled={busy || options(p.status).length === 1} className="min-w-32"
              onChange={status => void save(() => departureManifest.mark(id, p.customerId, status))}
            /> : <AdminStatus>{attendanceLabel[p.status]}</AdminStatus> },
          ]} />
        {phase === 'SCHEDULED' && <Alert showIcon type="info" message="Mở điểm danh 90 phút trước giờ khởi hành." />}
        {isAdmin && phase === 'AWAITING_CLOSEOUT' && <Space direction="vertical" className="w-full">
          {!canComplete && <Typography.Text type="secondary">
            Xác nhận khách đã trở về hoặc vắng mặt trên toàn bộ danh sách. Cần ít nhất một khách trở về để chốt chuyến.
          </Typography.Text>}
          <Input.TextArea aria-label="Ghi chú chốt chuyến" placeholder="Ghi chú chốt chuyến" value={note} maxLength={500}
            showCount onChange={event => setNote(event.target.value)} disabled={!canComplete || busy} />
          <Button type="primary" disabled={!canComplete || !note.trim() || busy}
            onClick={() => void save(() => departureManifest.complete(id, note.trim()))}>Chốt hoàn thành chuyến</Button>
        </Space>}
        {phase === 'COMPLETED' && <Alert showIcon type="success"
          message={`Đã chốt lúc ${formatAdminDatetime(manifest.completedAt ?? '')} · Quản trị viên #${manifest.completedBy}`}
          description={manifest.closeoutNote} />}
      </>}
    </Space>
  </Drawer>;
}
