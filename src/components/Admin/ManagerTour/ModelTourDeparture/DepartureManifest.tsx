import { PhoneOutlined, EnvironmentOutlined } from '@ant-design/icons';
import { assignDepartureVehicle, getAllVehicles, getTourById } from '@/services/tourServices';
import AdminPickupAssignment from './AdminPickupAssignment';
import { TripProgress, TripReportPanel } from './TripWorkflow';
import { getTourGuideDirectory, type GuideOption } from '@/services/userServices';
import { Alert, Button, Checkbox, DatePicker, Drawer, Modal, Empty, Input, Popconfirm, Select, Space, Spin, Tabs, Tag, Typography } from 'antd';
import { useCallback, useEffect, useState } from 'react';
import type { Dayjs } from 'dayjs';
import { Link } from 'react-router-dom';
import { AdminStatus } from '@/components/Admin/Shared/AdminStatus';
import { AdminTable } from '@/components/Admin/Shared/AdminTable';
import { formatAdminDatetime } from '@/components/Admin/Shared/adminDate';
import { departureManifest, hasBoarded, tripPhaseLabel, type Attendance, type Manifest, type ManifestPassenger, type TripReport } from '@/services/departureManifest';
import type { ApiResponse } from '@/types/api';
import { useApiQuery } from '@/hooks';
import type { ITourDeparture } from '@/types/Tour';
import { errorMessage } from '@/utils/errors';
import { useHasPermission } from '@/config/useHasPermission';

const attendanceLabel: Record<Attendance, string> = {
  EXPECTED: 'Chờ điểm danh',
  BOARDED: 'Đã lên xe',
  NO_SHOW: 'Vắng mặt',
  RETURNED: 'Đã trở về',
  SEPARATED: 'Tách đoàn',
  UNVERIFIED_RETURN: 'Chưa xác minh trở về',
};

export default function DepartureManifest({ departure, onClose, inline = false, tourTitle, initialPickupBookingId }: {
  departure: ITourDeparture; onClose: () => void; inline?: boolean; tourTitle?: string; initialPickupBookingId?: number;
}) {
  const [loadedTitle, setLoadedTitle] = useState<string>();
  useEffect(() => {
    if (tourTitle || !departure.tourId) return;
    const controller = new AbortController();
    void getTourById(departure.tourId, controller.signal).then(response => {
      if (!controller.signal.aborted && response.code === 1000) setLoadedTitle(response.result?.tourTitle);
    }).catch(() => {});
    return () => controller.abort();
  }, [departure.tourId, tourTitle]);
  const id = Number(departure.id);
  const [manifest, setManifest] = useState<Manifest>();
  const [error, setError] = useState('');
  const [note, setNote] = useState('');
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [actualTime, setActualTime] = useState<Dayjs | null>(null);
  const [confirmReason, setConfirmReason] = useState('');
  const confirmLate = Date.now() >= new Date(`${departure.departureDate.slice(0, 19)}+07:00`).getTime() + 15 * 60_000
    || Date.now() >= new Date(`${departure.returnDate.slice(0, 19)}+07:00`).getTime();
  const isAdmin = useHasPermission({ code: 'SGU_SUPER_ADMIN' });
  const [pickupBookingId, setPickupBookingId] = useState(isAdmin ? initialPickupBookingId : undefined);
  const [assignedVehicle, setAssignedVehicle] = useState(departure.operatingVehicleId ?? null);
  const [vehicle, setVehicle] = useState(departure.operatingVehicleId ?? null);
  const { data: vehicleOptions = [], loading: vehicleLoading, error: vehicleError } = useApiQuery(async () => {
    const response = await getAllVehicles();
    if (response.code !== 1000) throw new Error(response.message);
    return response.result.filter(option => (option.capacity ?? 0) > 0);
  }, { enabled: isAdmin });
  async function saveVehicle() {
    setBusy(true);
    setError('');
    try {
      const response = await assignDepartureVehicle(id, vehicle);
      if (response.code !== 1000) throw new Error(response.message);
      setAssignedVehicle(response.result.operatingVehicleId ?? null);
    } catch (failure) {
      setError(errorMessage(failure, 'Chưa lưu được phân công xe.'));
    } finally {
      setBusy(false);
    }
  }
  const [guide, setGuide] = useState<number | null>(null);
  const [busy, setBusy] = useState(false);

  const [statusFilter, setStatusFilter] = useState<'all' | 'boarded' | 'RETURNED' | 'NO_SHOW'>('all');
  const [passengerQuery, setPassengerQuery] = useState('');
  const [guideQuery, setGuideQuery] = useState('');
  const [guideOptions, setGuideOptions] = useState<GuideOption[]>([]);
  const [conflicts, setConflicts] = useState<Record<number, number>>({});
  const [guideError, setGuideError] = useState('');
  const assignedGuide = manifest?.guideAccountId;
  useEffect(() => {
    if (!isAdmin) return;
    const controller = new AbortController();
    const timer = window.setTimeout(async () => {
      try {
        const response = await getTourGuideDirectory(guideQuery, assignedGuide, controller.signal);
        if (response.code !== 1000) throw new Error(response.message || 'Chưa tải được hướng dẫn viên.');
        if (!controller.signal.aborted) {
          setGuideOptions(previous => {
            const selected = previous.find(item => item.id === guide);
            return selected && !response.result.some(item => item.id === selected.id) ? [selected, ...response.result] : response.result;
          });
          const ids = response.result.map(item => item.id);
          const conflictsResponse = ids.length ? await departureManifest.guideConflicts(id, ids, controller.signal) : null;
          if (conflictsResponse && conflictsResponse.code !== 1000) throw new Error('Chưa kiểm tra được lịch hướng dẫn viên.');
          if (!controller.signal.aborted) {
            setConflicts(conflictsResponse?.result ?? {});
            setGuideError('');
          }
        }
      } catch (failure) {
        if (!controller.signal.aborted) setGuideError(errorMessage(failure, 'Chưa tải được hướng dẫn viên.'));
      }
    }, 230);
    return () => { window.clearTimeout(timer); controller.abort(); };
  }, [id, isAdmin, guideQuery, assignedGuide, guide]);

  const [report, setReport] = useState<TripReport | null>();
  const [reportError, setReportError] = useState('');
  const [phones, setPhones] = useState<Record<number, string>>({});
  const [contactError, setContactError] = useState('');
  const [pickupFilter, setPickupFilter] = useState<string>();
  const [exception, setException] = useState<{ passenger: ManifestPassenger; status: Attendance; note: string }>();
  const [overrideClose, setOverrideClose] = useState(false);
  const [overrideAssign, setOverrideAssign] = useState(false);
  const selectedConflict = guide == null ? undefined : conflicts[guide];
  const [overrideReason, setOverrideReason] = useState('');

  useEffect(() => {
    let active = true;
    departureManifest.report(id).then(response => {
      if (response.code !== 1000) throw new Error(response.message || 'Chưa tải được báo cáo.');
      if (active) setReport(response.result);
    }).catch(failure => { if (active) setReportError(errorMessage(failure, 'Chưa tải được báo cáo.')); });
    departureManifest.contacts(id).then(response => {
      if (response.code !== 1000) throw new Error(response.message || 'Chưa tải được liên hệ.');
      if (active) setPhones(response.result);
    }).catch(failure => { if (active) setContactError(errorMessage(failure, 'Chưa tải được liên hệ.')); });
    return () => { active = false; };
  }, [id]);

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
      return true;
    } catch (failure) {
      setError(errorMessage(failure, 'Chưa lưu được thay đổi. Hãy tải lại danh sách và kiểm tra trạng thái chuyến.'));
      return false;
    } finally {
      setBusy(false);
    }
  }

  const phase = manifest?.phase;
  const reportLocked = report?.status === 'SUBMITTED' || report?.status === 'APPROVED';
  const canMark = !reportLocked && (phase === 'BOARDING' || phase === 'IN_PROGRESS' || phase === 'AWAITING_CLOSEOUT');
  const terminal = manifest?.passengers.every(p => p.status !== 'EXPECTED' && p.status !== 'BOARDED');
  const canComplete = phase === 'AWAITING_CLOSEOUT' && terminal && (report?.status === 'APPROVED' || overrideClose);

  function renderAttendance(passenger: ManifestPassenger) {
    const state = passenger.status;
    const choices: Attendance[] = [state];
    if (state === 'EXPECTED') choices.push('BOARDED');
    if (phase !== 'BOARDING' && state === 'EXPECTED') choices.push('NO_SHOW');
    if (phase !== 'BOARDING' && state === 'BOARDED') choices.push('RETURNED', 'SEPARATED', 'UNVERIFIED_RETURN');
    if (isAdmin && phase !== 'BOARDING' && state !== 'EXPECTED') {
      choices.push('BOARDED', 'NO_SHOW');
      if (state !== 'NO_SHOW') choices.push('RETURNED', 'SEPARATED', 'UNVERIFIED_RETURN');
    }
    const options = [...new Set(choices)].map(value => ({ value, label: attendanceLabel[value] }));
    return canMark && options.length > 1 ? <Select
      aria-label={`Điểm danh ${passenger.name}`} value={state} options={options}
      disabled={busy} className="min-w-32"
      onChange={status => {
        if (status === 'SEPARATED' || status === 'UNVERIFIED_RETURN') {
          setException({ passenger, status, note: '' });
        } else {
          void save(() => departureManifest.mark(id, passenger.customerId, status));
        }
      }}
    /> : <AdminStatus>{attendanceLabel[state]}</AdminStatus>;
  }

  function quickAttendance(passenger: ManifestPassenger) {
    const state = passenger.status === 'EXPECTED' ? 'BOARDED'
      : passenger.status === 'BOARDED' && phase !== 'BOARDING' ? 'RETURNED' : null;
    if (!canMark || !state) return null;
    return <Button size="small" type="primary" style={{ backgroundColor: '#0f5132' }} disabled={busy}
      onClick={() => void save(() => departureManifest.mark(id, passenger.customerId, state))}>
      {state === 'BOARDED' ? 'Xác nhận lên xe' : 'Xác nhận trở về'}
    </Button>;
  }

  const passengerFilter = passengerQuery.trim().toLocaleLowerCase('vi');
  const allPassengers = manifest?.passengers ?? [];
  const pickupOptions = [...new Set(allPassengers.map(passenger => passenger.meetingPointName).filter((value): value is string => !!value))];
  const visiblePassengers = allPassengers.filter(passenger =>
    (!pickupFilter || pickupFilter === passenger.meetingPointName)
    && (statusFilter === 'all' || (statusFilter === 'boarded' ? hasBoarded(passenger) : passenger.status === statusFilter))
    && (passenger.name.toLocaleLowerCase('vi').includes(passengerFilter)
      || (/^#?[0-9]+$/.test(passengerFilter) && String(passenger.bookingId).includes(passengerFilter.replace(/^#/, '')))));
  function phoneLine(label: string, phone: string) {
    const number = phone.replace(/[^+0-9]/g, '');
    return <div className="flex flex-wrap items-center gap-2">
      <PhoneOutlined aria-hidden /><span>{label}</span>
      <Typography.Text copyable={{ text: phone, tooltips: ['Sao chép số', 'Đã sao chép'] }}>{phone}</Typography.Text>
      {number && <a className="guide-call-link" href={`tel:${number}`}>Gọi</a>}
    </div>;
  }

  function passengerDetails(passenger: ManifestPassenger) {
    const phone = phones[passenger.accountId];
    const guardianParts = passenger.guardianNote?.split(' · ');
    const guardianPhone = guardianParts?.length === 2 ? guardianParts[1] : undefined;
    return <div className="space-y-1.5 text-xs text-[#526670]">
      {passenger.meetingPointName && <div><EnvironmentOutlined /> {passenger.meetingPointName}{passenger.pickupTime && ` · ${passenger.pickupTime.slice(0, 5)}`}</div>}
      {passenger.pickupStatus === 'NEEDS_RECONFIRMATION' && <Tag color="orange">Điểm đón cần xác nhận lại</Tag>}
      {passenger.pickupStatus === 'MISSING' && <Tag color="orange">Chưa chọn điểm đón</Tag>}
      {isAdmin && !manifest?.actualDepartureAt && phase !== 'INCIDENT' && phase !== 'CANCELLED'
        && phase !== 'COMPLETED' && <Button type="link" size="small" className="!px-0"
          onClick={() => setPickupBookingId(passenger.bookingId)}>Xử lý điểm đón</Button>}
      {phone && phoneLine('Người đặt', phone)}
      {guardianPhone ? phoneLine(`Giám hộ · ${guardianParts?.[0]}`, guardianPhone) : passenger.guardianNote && <div>Giám hộ · {passenger.guardianNote}</div>}
      {passenger.note && <div className="whitespace-pre-wrap">{passenger.note}</div>}
    </div>;
  }

  const content = (
    <Space direction="vertical" size="large" className="w-full">
      <div>
        <Space wrap>
          <Typography.Title level={4} className="!mb-0 !text-[#14532d]">{tourTitle || loadedTitle || departure.tourCode || `Lịch #${id}`}</Typography.Title>
          {phase && <AdminStatus tone={phase === 'COMPLETED' ? 'success' : (phase === 'AWAITING_CLOSEOUT' || phase === 'OVERDUE_UNCONFIRMED' || phase === 'INCIDENT') ? 'attention' : 'neutral'}>{tripPhaseLabel[phase]}</AdminStatus>}
        </Space>
        <div className="mt-2">{(tourTitle || loadedTitle) && departure.tourCode && <Tag>{departure.tourCode}</Tag>}<Typography.Text type="secondary">
          {formatAdminDatetime(departure.departureDate)} → {formatAdminDatetime(departure.returnDate)}
        </Typography.Text></div>
      </div>
      {error && <Alert showIcon type="error" message={error} />}
      {!manifest && busy && <Spin />}
      {manifest?.actualDepartureAt && <Typography.Text type="secondary">
        Xuất phát thực tế {formatAdminDatetime(manifest.actualDepartureAt)}
      </Typography.Text>}
      {phase === 'OVERDUE_UNCONFIRMED' && <Alert showIcon type="warning"
        message="Chưa xác nhận xe đã xuất phát"
        action={<Space wrap>
          <Button type="primary" onClick={() => setConfirmOpen(true)}>Xác nhận xuất phát</Button>
          {isAdmin && <Link to={`/admin/tours/${departure.tourId}/departures?incidentDepartureId=${id}`}>Chuyển xử lý sự cố</Link>}
        </Space>} />}
      {phase === 'INCIDENT' && isAdmin && <Link to={`/admin/tours/${departure.tourId}/departures?incidentDepartureId=${id}`}>
        Mở hồ sơ xử lý sự cố
      </Link>}
      <Modal title="Xác nhận xuất phát" open={confirmOpen} okText="Xác nhận" cancelText="Hủy"
        confirmLoading={busy} onCancel={() => setConfirmOpen(false)}
        okButtonProps={{ disabled: (confirmLate || actualTime !== null) && (!actualTime || !confirmReason.trim()) }}
        onOk={async () => {
          await save(async () => {
            const response = await departureManifest.confirm(id, actualTime?.format('YYYY-MM-DDTHH:mm:ss'), confirmReason.trim() || undefined);
            if (response.code === 1000) {
              setConfirmOpen(false);
              setActualTime(null);
              setConfirmReason('');
            }
            return response;
          });
        }}>
        <Space direction="vertical" className="w-full">
          <Typography.Text>Xác nhận khi xe đã thực sự xuất phát. {confirmLate && 'Nhập giờ thực tế và lý do cập nhật muộn.'}</Typography.Text>
          <DatePicker aria-label="Giờ xuất phát thực tế (giờ Việt Nam)" placeholder="Giờ thực tế (giờ Việt Nam)"
            showTime format="DD/MM/YYYY HH:mm" value={actualTime} onChange={setActualTime} />
          {(confirmLate || actualTime) && <Input.TextArea aria-label="Lý do xác nhận muộn" placeholder="Lý do xác nhận muộn"
            maxLength={500} value={confirmReason} onChange={event => setConfirmReason(event.target.value)} />}
          {error && <Alert showIcon type="error" message={error} />}
        </Space>
      </Modal>
      {isAdmin && pickupBookingId != null && <AdminPickupAssignment key={pickupBookingId} bookingId={pickupBookingId}
        onClose={() => setPickupBookingId(undefined)} onSaved={() => void load()} />}
      {manifest && <>
        {isAdmin && <div className="rounded-lg border border-[#e2e8f0] bg-[#f8fafc] p-4">
          <Typography.Text strong>Xe phục vụ chuyến</Typography.Text>
          <div className="mt-2">
            <Space wrap>
              <Select aria-label="Xe phục vụ chuyến" allowClear value={vehicle ?? undefined}
                onChange={value => setVehicle(value ?? null)} loading={vehicleLoading} placeholder="Chọn xe"
                style={{ width: 'min(270px, 65vw)' }} options={vehicleOptions.map(option => ({
                  value: option.id, label: `${option.name} · ${option.capacity} chỗ`,
                }))} />
              <Button loading={busy} disabled={vehicle === assignedVehicle || phase === 'INCIDENT' || phase === 'COMPLETED'
                || phase === 'CANCELLED'} onClick={() => void saveVehicle()}>Lưu xe</Button>
            </Space>
          </div>
          {vehicleError && <Alert className="mt-2" type="warning" showIcon message={vehicleError} />}
          {(() => {
            const capacity = vehicleOptions.find(option => option.id === assignedVehicle)?.capacity;
            return capacity && manifest.passengers.length > capacity && <Alert className="mt-2" showIcon type="warning"
              message={`${manifest.passengers.length} khách đã thanh toán / ${capacity} chỗ trên xe`} />;
          })()}
        </div>}
        {isAdmin && <Space direction="vertical" className="w-full rounded-lg border border-[#e2e8f0] bg-[#f8fafc] p-4">
          <Typography.Text strong>Hướng dẫn viên phụ trách</Typography.Text>
          <Space wrap>
            <Select aria-label="Tìm hướng dẫn viên" placeholder="Tìm theo tên hoặc email"
              showSearch filterOption={false} onSearch={value => setGuideQuery(value.slice(0, 100))}
              value={guide ?? undefined} onChange={value => { setGuide(value); setOverrideAssign(false); setOverrideReason(''); }} disabled={busy}
              style={{ width: 'min(340px, 72vw)' }}
              optionRender={option => {
                const item = guideOptions.find(guide => guide.id === option.value);
                return item && <div className="flex flex-wrap items-center justify-between gap-2">
                  <span className="min-w-0"><strong>{item.name}</strong><span className="block break-all text-xs text-slate-600">{item.email}</span></span>
                  <Tag color={conflicts[item.id] ? 'orange' : 'green'}>
                    {conflicts[item.id] ? `Trùng lịch #${conflicts[item.id]}` : 'Sẵn sàng'}
                  </Tag>
                </div>;
              }}
              options={guideOptions.map(item => ({ value: item.id, label: `${item.name} · ${item.email}` }))} />
            <Popconfirm title={`Phân công ${guideOptions.find(item => item.id === guide)?.name ?? "hướng dẫn viên đã chọn"}?`}
              onConfirm={() => guide === null ? undefined : save(() => departureManifest.assign(id, guide, !!selectedConflict && overrideAssign, overrideReason.trim()))}>
              <Button disabled={busy || overrideAssign && !overrideReason.trim() || guide != null && !!conflicts[guide] && !overrideAssign || guide === null || guide === manifest.guideAccountId || phase === 'COMPLETED' || phase === 'CANCELLED'}>Phân công</Button>
            </Popconfirm>
            {manifest.guideAccountId && <Popconfirm title="Gỡ quyền vận hành của hướng dẫn viên?" onConfirm={() => save(() => departureManifest.assign(id, null))}>
              <Button disabled={busy}>Gỡ phân công</Button>
            </Popconfirm>}
          </Space>
          {selectedConflict && <Checkbox checked={overrideAssign} onChange={event => setOverrideAssign(event.target.checked)}>Cho phép trùng lịch có lý do</Checkbox>}
          {selectedConflict && overrideAssign && <Input required placeholder="Lý do phân công trùng lịch" maxLength={500} value={overrideReason}
            onChange={event => setOverrideReason(event.target.value)} />}
          {guideError && <Alert type="error" showIcon message={guideError} />}
        </Space>}
        <Tabs items={[
          { key: 'attendance', label: 'Điểm danh', children: <div className="space-y-3">
            {contactError && <Alert type="warning" showIcon message={contactError} />}
            {pickupOptions.length > 0 && <Select allowClear placeholder="Tất cả điểm đón" aria-label="Lọc theo điểm đón"
              options={pickupOptions.map(value => ({ value, label: value }))} value={pickupFilter}
              onChange={setPickupFilter} className="w-full" />}
        {inline && <Space wrap>
          {([
            ['all', `${manifest.passengers.length} hành khách`],
            ['boarded', `${manifest.passengers.filter(hasBoarded).length} đã lên xe`],
            ['RETURNED', `${manifest.passengers.filter(p => p.status === 'RETURNED').length} đã trở về`],
            ['NO_SHOW', `${manifest.passengers.filter(p => p.status === 'NO_SHOW').length} vắng mặt`],
          ] as const).map(([key, label]) => <Button key={key} size="small" shape="round"
            aria-pressed={statusFilter === key} type={statusFilter === key ? 'primary' : 'default'}
            style={statusFilter === key ? { background: '#0f5132' } : undefined}
            onClick={() => setStatusFilter(key)}>{label}</Button>)}
        </Space>}
        {inline ? <div className="space-y-3">
          <Input aria-label="Tìm hành khách" placeholder="Tìm tên hoặc mã đặt chỗ" maxLength={100}
            value={passengerQuery} onChange={event => setPassengerQuery(event.target.value)} allowClear />
          {visiblePassengers.length ? <ul className="m-0 grid list-none gap-2 p-0">
            {visiblePassengers.map(passenger => <li key={passenger.customerId}
              className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-[#DDE9E6] bg-white px-4 py-3">
              <div className="min-w-0 break-words">
                <div className="mb-2 flex flex-wrap items-center gap-2"><strong>{passenger.name}</strong><Tag>#{passenger.bookingId}</Tag></div>
                {passengerDetails(passenger)}
              </div>
              <div className="flex flex-wrap items-center gap-2">
                {canMark && (passenger.status === 'EXPECTED' || passenger.status === 'BOARDED') &&
                  <AdminStatus>{attendanceLabel[passenger.status]}</AdminStatus>}
                {quickAttendance(passenger)}
                {renderAttendance(passenger)}
              </div>
            </li>)}
          </ul> : <Empty image={Empty.PRESENTED_IMAGE_SIMPLE}
            description={passengerFilter || pickupFilter || statusFilter !== 'all' ? 'Không tìm thấy hành khách phù hợp.' : 'Chưa có khách đã xác nhận thanh toán.'} />}
        </div> : <AdminTable<ManifestPassenger> rowKey="customerId" size="small" dataSource={visiblePassengers}
          pageScope="departure-manifest"
          locale={{ emptyText: <Empty image={Empty.PRESENTED_IMAGE_SIMPLE} description="Chưa có khách thuộc đơn đã xác nhận thanh toán." /> }}
          columns={[
            { title: 'Hành khách', render: (_, passenger) => <><strong>{passenger.name}</strong>{passengerDetails(passenger)}</> },
            { title: 'Đơn đặt chỗ', render: (_, p) => isAdmin ? <Link to={`/admin/managerBooking?bookingId=${p.bookingId}`}>#{p.bookingId}</Link> : `#${p.bookingId}` },
            { title: 'Điểm danh', render: (_, p) => renderAttendance(p) },
          ]} />}
        {phase === 'SCHEDULED' && <Alert showIcon type="info" message="Mở điểm danh 90 phút trước giờ khởi hành." />}
            {exception && <Space direction="vertical" className="w-full">
              <Typography.Text strong>{attendanceLabel[exception.status]} · {exception.passenger.name}</Typography.Text>
              <Input.TextArea aria-label="Lý do và cách xử lý" value={exception.note} maxLength={500}
                onChange={event => setException({ ...exception, note: event.target.value })} />
              <Space>
                <Button onClick={() => setException(undefined)}>Hủy</Button>
                <Button type="primary" disabled={busy || !exception.note.trim()} onClick={() => {
                  void save(() => departureManifest.mark(id, exception.passenger.customerId, exception.status, exception.note.trim()))
                    .then(saved => { if (saved) setException(undefined); });
                }}>Ghi nhận ngoại lệ</Button>
              </Space>
            </Space>}
          </div> },
          { key: 'progress', label: 'Tiến độ lịch trình', children: <TripProgress id={id}
            editable={!isAdmin && !reportLocked && (phase === 'IN_PROGRESS' || phase === 'AWAITING_CLOSEOUT')} /> },
          { key: 'report', label: 'Báo cáo chuyến', children: reportError
            ? <Alert type="error" showIcon message={reportError} />
            : report === undefined ? <Spin /> : <TripReportPanel id={id} report={report}
              manifest={manifest} isAdmin={isAdmin} onReport={setReport} /> },
        ]} />
        {isAdmin && phase === 'AWAITING_CLOSEOUT' && <Space direction="vertical" className="w-full">
          {!terminal && <Typography.Text type="secondary">Xử lý toàn bộ hành khách trước khi chốt.</Typography.Text>}
          {report?.status !== 'APPROVED' && <Checkbox checked={overrideClose} disabled={!terminal}
            onChange={event => setOverrideClose(event.target.checked)}>Chốt ngoại lệ khi chưa có báo cáo đã duyệt</Checkbox>}
          <Input.TextArea aria-label="Ghi chú chốt chuyến" placeholder={overrideClose ? "Lý do chốt ngoại lệ" : "Ghi chú chốt chuyến"} value={note} maxLength={500}
            showCount onChange={event => setNote(event.target.value)} disabled={!canComplete || busy} />
          <Button type="primary" disabled={!canComplete || !note.trim() || busy}
            onClick={() => void save(() => departureManifest.complete(id, note.trim(), overrideClose))}>Chốt hoàn thành chuyến</Button>
        </Space>}
        {phase === 'COMPLETED' && <Alert showIcon type="success"
          message={`Đã chốt lúc ${formatAdminDatetime(manifest.completedAt ?? '')} · Quản trị viên #${manifest.completedBy}`}
          description={manifest.outcome === 'COMPLETED_NO_SHOW' ? `Cả đoàn vắng · ${manifest.closeoutNote ?? ''}`
            : manifest.outcome === 'COMPLETED_NO_PASSENGERS' ? `Chuyến không có khách · ${manifest.closeoutNote ?? ''}`
            : manifest.closeoutNote} />}
      </>}
    </Space>
  );
  const reload = <Button onClick={() => void load()} disabled={busy}>Tải lại</Button>;
  return inline ? <section className="space-y-4">
    <div className="flex flex-wrap justify-between gap-3">
      <Button onClick={onClose}>Về danh sách chuyến</Button>{reload}
    </div>
    {content}
  </section> : <Drawer open width={760} title="Vận hành chuyến" onClose={onClose} extra={reload}>
    {content}
  </Drawer>;
}
