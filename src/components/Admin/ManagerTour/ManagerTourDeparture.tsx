import dayjs from 'dayjs';
import AdminPageHeader from '../Shared/AdminPageHeader';
import AdminLookup from '../Shared/AdminLookup';
import { AdminStatus } from '../Shared/AdminStatus';
import { adminDayKey, formatAdminDatetime } from '../Shared/adminDate';
import type { Dayjs } from 'dayjs';
import { AdminProTable as ProTable } from '@/components/Admin/Shared/AdminTable';
import ScheduleChangesPanel from './ScheduleChangesPanel';
import { useRef, useState } from 'react';
import { MoreOutlined, PlusOutlined, CalendarOutlined, TeamOutlined, EnvironmentOutlined } from '@ant-design/icons';
import { Button, Modal, message, Alert, DatePicker, Dropdown, Progress, Select, Space } from 'antd';
import { type ProColumns } from '@ant-design/pro-components';
import type { ITourDeparture } from '@/types/Tour';
import { addTourDeparture, getAllTourDeparture, getDepartureHistoryByTourId, updateTourDeparture, getDepartureCapacity, getAllTours, getTourDepartureById, openTourDeparture } from '@/services/tourServices';
import { useLocation, useNavigate, useParams } from 'react-router-dom';
import { useHasPermission } from '@/config/useHasPermission';
import { ALL_PERMISSIONS } from '@/config/permissions';
import { type DepartureCapacity, type capacityUpdate } from '@/utils/departureCapacity';
import { useApiQuery } from '@/hooks';
import { isDepartureSalesClosed } from '@/utils/tourSchedule';
import { formatCurrencyVND, isListCapped, parseDate, TOUR_LIST_CAP } from '@/utils';
import AddTourDeparture from './ModelTourDeparture/AddTourDeparture';
import EditTourDeparture from './ModelTourDeparture/EditTourDeparture';
import DepartureContext from './ModelTourDeparture/DepartureContext';
import DepartureManifest from './ModelTourDeparture/DepartureManifest';
import EditMeetingPoint from './ModelTourDeparture/EditMeetingPoint';
function errorText(error: unknown) {
  const body = error as { response?: { data?: { message?: string } } };
  return body?.response?.data?.message || (error instanceof Error ? error.message : 'Chưa cập nhật được lịch');
}
export default function ManagerTourDeparture() {
  const { tourId: routeTourId } = useParams();
  const location = useLocation();
  const navigate = useNavigate();
  const search = new URLSearchParams(location.search);
  const tourId = Number(routeTourId ?? search.get('tourId')) || null;
  const focusDepartureId = Number(search.get('departureId')) || null;
  const openOperation = search.get('operation') === '1';
  const pickupBookingId = Number(search.get('pickupBookingId')) || undefined;
  const incidentDepartureId = Number(search.get('incidentDepartureId')) || undefined;
  const focusRequestId = Number(search.get('requestId')) || undefined;
  const tourDeparturesPath = routeTourId ? `/admin/tours/${tourId}/departures` : tourId ? `/admin/managerTour/tourDeparture?tourId=${tourId}` : '/admin/departures';
  const [openAdd, setOpenAdd] = useState(false);
  const [formTour, setFormTour] = useState<number>();
  const [tourFilter, setTourFilter] = useState<number>();
  const [status, setStatus] = useState<string>();
  const [range, setRange] = useState<[Dayjs | null, Dayjs | null] | null>(() => search.get('upcoming') === '7' ? [dayjs(), dayjs().add(6, 'day')] : null);
  const [selected, setSelected] = useState<DepartureCapacity | null>(null);
  const [manifestDeparture, setManifestDeparture] = useState<ITourDeparture>();
  const canOperate = useHasPermission({ code: "SGU_SUPER_ADMIN" });
  const [meetingDeparture, setMeetingDeparture] = useState<ITourDeparture>();
  const [saving, setSaving] = useState(false);
  /** Later clicks reload the capacity panel; an older response must not overwrite the newer one. */
  const capacityRequest = useRef(0);
  const canSeeBookings = useHasPermission(ALL_PERMISSIONS.BOOKINGS.GET_ALL);
  const canCreate = useHasPermission(ALL_PERMISSIONS.TOUR_DEPARTURES.CREATE);
  const canUpdate = useHasPermission(ALL_PERMISSIONS.TOUR_DEPARTURES.UPDATE);
  const { data = [], error: loadError, loading, refresh } = useApiQuery(
    async () => {
      if (focusDepartureId) {
        const { code, result } = await getTourDepartureById(focusDepartureId);
        if (code !== 1000 || !result || (tourId !== null && Number(result.tourId) !== tourId)) throw new Error('Không tìm thấy lịch của tour này');
        return [result];
      }
      const result = tourId != null ? await getDepartureHistoryByTourId(tourId) : await getAllTourDeparture();
      if (result.code !== 1000) throw new Error(result.message || 'Chưa tải được lịch');
      return result.result;
    },
    { enabled: !focusRequestId, deps: [tourId, focusDepartureId, focusRequestId], onError: (msg) => message.error(msg) },
  );
  const { data: tours = [] } = useApiQuery(
    async () => {
      const result = await getAllTours();
      if (result.code !== 1000) throw new Error(result.message || 'Chưa tải được danh sách tour');
      return result.result;
    },
    { enabled: tourId == null, deps: [tourId], onError: (msg) => message.error(msg) },
  );
  async function create(values: { capacity: number; departureDate: string; returnDate: string }) {
    const selectedTourId = tourId ?? formTour;
    if (!selectedTourId) return false;
    try {
      const result = await addTourDeparture({ ...values, tourId: selectedTourId });
      if (result.code !== 1000) throw new Error('Chưa tạo được lịch');
      setOpenAdd(false); message.success('Đã tạo lịch nháp. Thêm điểm tập trung để mở bán.'); await refresh(); return true;
    } catch (error) { message.error(errorText(error)); return false; }
  }
  async function loadCapacity(id: number) {
    const request = ++capacityRequest.current;
    try {
      const result = await getDepartureCapacity(id);
      if (request === capacityRequest.current && result.code === 1000) setSelected(result.result);
    } catch (error) {
      if (request === capacityRequest.current) message.error(errorText(error));
    }
  }
  async function update(values: ReturnType<typeof capacityUpdate>) {
    try {
      const result = await updateTourDeparture(values);
      if (result.code !== 1000) throw new Error('Chưa cập nhật được lịch');
      capacityRequest.current += 1;
      setSelected(null); message.success('Đã cập nhật sức chứa/lịch'); await refresh(); return true;
    } catch (error) { message.error(errorText(error), 7); return false; }
  }
  const openedManifest = manifestDeparture ?? (openOperation && canOperate ? data.find(row => Number(row.id) === focusDepartureId) : undefined);
  const departureStatus = (row: ITourDeparture) => {
    if (row.operationalStatus === 'DRAFT') return 'Nháp';
    if (row.operationalStatus === 'CANCELLED') return 'Đã hủy';
    if (row.operationalStatus === 'SUSPENDED' || row.operationalStatus === 'REPLACEMENT_ONLY') return 'Tạm ẩn';
    const end = parseDate(row.returnDate), start = parseDate(row.departureDate);
    if (end && +end < Date.now()) return 'Qua giờ dự kiến về';
    if (start && +start <= Date.now()) return 'Đến giờ dự kiến đi';
    if (isDepartureSalesClosed(row)) return 'Đã đóng đặt';
    if (row.availableSeats <= 0) return 'Đã đầy';
    return row.capacity && row.availableSeats / row.capacity <= 0.2 ? 'Gần đầy' : 'Mở bán';
  };
  const statuses = ['Nháp', 'Mở bán', 'Gần đầy', 'Đã đầy', 'Đã đóng đặt', 'Đến giờ dự kiến đi', 'Qua giờ dự kiến về', 'Tạm ẩn', 'Đã hủy'];
  const visible = data.filter(row => {
    const date = adminDayKey(row.departureDate);
    return (!tourFilter || Number(row.tourId) === tourFilter) && (!status || departureStatus(row) === status) &&
      (!range?.[0] || date >= range[0].format('YYYY-MM-DD')) && (!range?.[1] || date <= range[1].format('YYYY-MM-DD'));
  });
  const columns: ProColumns<ITourDeparture>[] = [
    { title: tourId ? 'Mã lịch' : 'Tour / mã lịch', render: (_, row) => <>
      {!tourId && <strong>{tours.find(tour => Number(tour.id) === Number(row.tourId))?.tourTitle || `Tour #${row.tourId}`}</strong>}
      <div>{row.tourCode} · #{row.id}</div></> },
    { title: 'Khởi hành → Trở về', render: (_, row) => <>{formatAdminDatetime(row.departureDate)}<br />{formatAdminDatetime(row.returnDate)}</> },
    { title: 'Đã đặt / Tổng chỗ', render: (_, row) => row.capacity == null ? 'Chưa xác nhận' : <>
      <span>{Math.max(0, row.capacity - row.availableSeats)} / {row.capacity}</span>
      {row.capacity > 0 && <Progress size="small" percent={Math.max(0, Math.min(100, (row.capacity - row.availableSeats) / row.capacity * 100))} showInfo={false} />}
    </> },
    { title: 'Giá người lớn', align: 'right', responsive: ['lg'], render: (_, row) => row.tourPrice?.adultPrice == null ? '—' : formatCurrencyVND(row.tourPrice.adultPrice) },
    { title: 'Trạng thái', render: (_, row) => {
      const label = departureStatus(row);
      return <AdminStatus tone={label === 'Mở bán' ? 'success' : label === 'Gần đầy' ? 'attention' : label === 'Đã hủy' ? 'danger' : label === 'Đến giờ dự kiến đi' ? 'info' : 'neutral'}>{label}</AdminStatus>;
    } },
    { title: 'Thao tác', hideInTable: !canUpdate, render: (_, row) => canUpdate && <Space size={4}>
      {row.operationalStatus === 'DRAFT' && <Button type="primary" size="small" onClick={() => Modal.confirm({
        title: 'Mở bán lịch khởi hành?',
        content: 'Lịch cần có ít nhất một điểm tập trung với địa chỉ và giờ có mặt.',
        okText: 'Mở bán',
        onOk: async () => {
          try {
            const response = await openTourDeparture(Number(row.id));
            if (response.code !== 1000) throw new Error(response.message);
            message.success('Đã mở bán lịch khởi hành');
            await refresh();
          } catch (error) {
            message.error(errorText(error));
            throw error;
          }
        },
      })}>Mở bán</Button>}
      {canOperate && <Button type="link" size="small" onClick={() => setManifestDeparture(row)}>Vận hành</Button>}
      <Dropdown placement="bottomRight" rootClassName="admin-row-menu" getPopupContainer={trigger => trigger.ownerDocument.body} menu={{ items: [
      ...(canSeeBookings ? [{ key: 'bookings', icon: <TeamOutlined />, label: 'Xem đặt chỗ của lịch này', onClick: () => navigate(`/admin/managerBooking?departureId=${row.id}`) }] : []),
      { key: 'capacity', icon: <CalendarOutlined />, label: 'Sức chứa/lịch', onClick: () => void loadCapacity(Number(row.id)) },
      { key: 'meeting', icon: <EnvironmentOutlined />, label: 'Điểm tập trung', onClick: () => setMeetingDeparture(row) },
    ] }} trigger={['click']}><Button type="text" size="small" aria-label={`Thao tác lịch #${row.id}`} title="Thao tác lịch" icon={<MoreOutlined />} /></Dropdown></Space> },
  ];
  return <>
    {!routeTourId && <AdminPageHeader title={focusDepartureId ? `Lịch khởi hành #${focusDepartureId}` : 'Lịch khởi hành'} description="Theo dõi lịch, sức chứa và điểm tập trung." />}
    {loadError && <Alert type="error" showIcon className="mb-4" message={loadError} />}
    {openedManifest && <DepartureManifest key={openedManifest.id} departure={openedManifest} initialPickupBookingId={pickupBookingId}
      onClose={() => {
        setManifestDeparture(undefined);
        if (openOperation) {
          search.delete('operation');
          search.delete('pickupBookingId');
          navigate({ pathname: location.pathname, search: search.toString() }, { replace: true });
        }
      }} />}
    {meetingDeparture && <EditMeetingPoint key={meetingDeparture.id} departure={meetingDeparture} onClose={() => setMeetingDeparture(undefined)} />}
    {(focusDepartureId || focusRequestId) && <Alert showIcon className="!mb-4"
      message={focusRequestId ? `Đang xem yêu cầu dời lịch #${focusRequestId}` : `Đang xem lịch khởi hành #${focusDepartureId}`}
      action={<Button size="small" onClick={() => navigate(tourDeparturesPath)}>{tourId ? 'Xem tất cả lịch và yêu cầu của tour' : 'Quay lại danh sách'}</Button>} />}
    {isListCapped(tours, TOUR_LIST_CAP) && (
      <Alert
        type="warning"
        showIcon
        style={{ marginBottom: 16 }}
        message={`Danh sách chỉ tải ${TOUR_LIST_CAP} tour gần nhất nên tour cũ hơn không chọn được ở đây.`}
      />
    )}
    {!focusRequestId && <ProTable<ITourDeparture> filterKey={JSON.stringify([tourFilter, status, range])}
 columns={columns} rowKey="id" dataSource={loading || loadError ? [] : visible} loading={loading} search={false} headerTitle="Lịch khởi hành và sức chứa"
      options={{ reload: refresh }}
      toolBarRender={() => [<Space key="filters" wrap>
        <AdminLookup value={focusDepartureId ? String(focusDepartureId) : ''} maxLength={10} placeholder="Mã lịch khởi hành"
          onLookup={id => {
            if (!id || /^[1-9][0-9]{0,9}$/.test(id) && Number(id) <= 2147483647) navigate(id ? `${tourDeparturesPath}${tourDeparturesPath.includes('?') ? '&' : '?'}departureId=${id}` : tourDeparturesPath, { replace: true });
          }} />
        {!tourId && <Select aria-label="Tour" placeholder="Tất cả tour" showSearch optionFilterProp="label" allowClear
          value={tourFilter} onChange={setTourFilter} options={tours.map(tour => ({ value: Number(tour.id), label: tour.tourTitle }))} />}
        <DatePicker.RangePicker aria-label="Khoảng ngày" format="DD/MM/YYYY" value={range} onChange={setRange} />
        <Select aria-label="Trạng thái" allowClear placeholder="Trạng thái" value={status} onChange={setStatus} options={statuses.map(value => ({ value, label: value }))} />
        {canCreate && <Button type="primary" icon={<PlusOutlined />} onClick={() => { setFormTour(tourFilter); setOpenAdd(true); }}>Thêm lịch</Button>}
      </Space>]}
      pagination={focusDepartureId ? false : { pageSize: 5 }} />}
    <Modal centered
        title="Thêm lịch khởi hành" open={openAdd} onCancel={() => setOpenAdd(false)} closable={!saving} maskClosable={!saving} keyboard={!saving} footer={null} destroyOnHidden width={880}>
      {!tourId && <Select aria-label="Tour bắt buộc" placeholder="Chọn tour để thêm lịch" value={formTour}
        className="mb-4 w-full" showSearch optionFilterProp="label" onChange={setFormTour}
        options={tours.map(tour => ({ value: Number(tour.id), label: tour.tourTitle }))} />}
      {(tourId ?? formTour) && <div className="admin-detail-grid">
        <AddTourDeparture onSubmit={create} onSavingChange={setSaving} />
        <DepartureContext tourId={(tourId ?? formTour)!} />
      </div>}
    </Modal>
    <Modal centered
        title="Quản lý sức chứa/lịch" open={!!selected} onCancel={() => { capacityRequest.current += 1; setSelected(null); }} closable={!saving} maskClosable={!saving} keyboard={!saving} footer={null} destroyOnHidden width={960}>
      {selected && <div className="admin-detail-grid">
        <EditTourDeparture data={selected} onSubmit={update} onReload={() => loadCapacity(selected.id)} onSavingChange={setSaving} />
        {data.filter((departure) => Number(departure.id) === selected.id).map((departure) =>
          <DepartureContext key={departure.id} tourId={departure.tourId} departure={departure} />)}
      </div>}
    </Modal>
    {tourId && !focusDepartureId && <div className={focusRequestId ? undefined : "mt-5"}><ScheduleChangesPanel tourId={tourId} focusRequestId={focusRequestId} incidentDepartureId={incidentDepartureId}
      onChanged={() => { if (!focusRequestId) void refresh(); }} /></div>}
  </>;
}
