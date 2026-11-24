import ScheduleChangesPanel from './ScheduleChangesPanel';
import { useRef, useState } from 'react';
import { EditOutlined, PlusOutlined } from '@ant-design/icons';
import { Button, Modal, message, Alert, Input, Select } from 'antd';
import { ProTable, type ProColumns } from '@ant-design/pro-components';
import type { ITourDeparture } from '@/types/Tour';
import { addTourDeparture, getDepartureHistoryByTourId, updateTourDeparture, getDepartureCapacity, getAllTours, getTourDepartureById } from '@/services/tourServices';
import { useLocation, useNavigate } from 'react-router-dom';
import { useHasPermission } from '@/config/useHasPermission';
import { ALL_PERMISSIONS } from '@/config/permissions';
import { type DepartureCapacity, type capacityUpdate } from '@/utils/departureCapacity';
import { useApiQuery } from '@/hooks';
import { formatDate, isListCapped, TOUR_LIST_CAP } from '@/utils';
import AddTourDeparture from './ModelTourDeparture/AddTourDeparture';
import EditTourDeparture from './ModelTourDeparture/EditTourDeparture';
import EditMeetingPoint from './ModelTourDeparture/EditMeetingPoint';
function errorText(error: unknown) {
  const body = error as { response?: { data?: { message?: string } } };
  return body?.response?.data?.message || (error instanceof Error ? error.message : 'Chưa cập nhật được lịch');
}
export default function ManagerTourDeparture() {
  const location = useLocation();
  const navigate = useNavigate();
  const search = new URLSearchParams(location.search);
  const tourId = Number(search.get('tourId')) || null;
  const focusDepartureId = Number(search.get('departureId')) || null;
  const focusRequestId = Number(search.get('requestId')) || undefined;
  const tourDeparturesPath = tourId ? `/admin/managerTour/tourDeparture?tourId=${tourId}` : '/admin/managerTour/tourDeparture';
  const [openAdd, setOpenAdd] = useState(false);
  const [selected, setSelected] = useState<DepartureCapacity | null>(null);
  const [meetingId, setMeetingId] = useState<number>();
  const [saving, setSaving] = useState(false);
  /** Later clicks reload the capacity panel; an older response must not overwrite the newer one. */
  const capacityRequest = useRef(0);
  const canCreate = useHasPermission(ALL_PERMISSIONS.TOUR_DEPARTURES.CREATE);
  const canUpdate = useHasPermission(ALL_PERMISSIONS.TOUR_DEPARTURES.UPDATE);
  const { data = [], error: loadError, loading, refresh } = useApiQuery(
    async () => {
      if (focusDepartureId) {
        const { code, result } = await getTourDepartureById(focusDepartureId);
        if (code !== 1000 || !result || (tourId !== null && Number(result.tourId) !== tourId)) throw new Error('Không tìm thấy lịch của tour này');
        return [result];
      }
      const result = await getDepartureHistoryByTourId(tourId as number);
      if (result.code !== 1000) throw new Error(result.message || 'Chưa tải được lịch');
      return result.result;
    },
    { enabled: (tourId != null || focusDepartureId != null) && !focusRequestId, deps: [tourId, focusDepartureId, focusRequestId], onError: (msg) => message.error(msg) },
  );
  const { data: tours = [] } = useApiQuery(
    async () => {
      const result = await getAllTours();
      if (result.code !== 1000) throw new Error(result.message || 'Chưa tải được danh sách tour');
      return result.result;
    },
    { enabled: tourId == null && focusDepartureId == null, deps: [tourId, focusDepartureId], onError: (msg) => message.error(msg) },
  );
  async function create(values: { capacity: number; departureDate: string; returnDate: string }) {
    if (!tourId) return false;
    try {
      const result = await addTourDeparture({ ...values, tourId });
      if (result.code !== 1000) throw new Error('Chưa tạo được lịch');
      setOpenAdd(false); message.success('Đã tạo lịch và tổng sức chứa'); await refresh(); return true;
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
  const columns: ProColumns<ITourDeparture>[] = [
    { title: 'Mã lịch', render: (_, row) => <>{row.tourCode}<br /><small>ID #{row.id}</small></> },
    {
      title: 'Ngày khởi hành',
      dataIndex: 'departureDate',
      render: (val) => formatDate(String(val ?? '')),
    },
    { title: 'Ngày trở về', dataIndex: 'returnDate', render: (val) => formatDate(String(val ?? '')) },
    { title: 'Tổng sức chứa', render: (_, row) => row.capacity ?? 'Chưa xác nhận' }, { title: 'Còn lại', dataIndex: 'availableSeats' },
    { title: 'Thao tác', render: (_, row) => canUpdate && <>
      <Button type="link" icon={<EditOutlined />} onClick={() => void loadCapacity(Number(row.id))}>Sức chứa/lịch</Button>
      <Button type="link" onClick={() => setMeetingId(Number(row.id))}>Điểm tập trung</Button>
    </> },
  ];
  return <>
    <Input.Search className="mb-4" style={{ maxWidth: 380 }} aria-label="Mã số lịch khởi hành"
      placeholder="Nhập mã số lịch khởi hành" enterButton="Tra cứu" maxLength={10} onSearch={value => {
        const id = value.trim();
        if (!/^[0-9]{1,10}$/.test(id) || Number(id) < 1 || Number(id) > 2147483647) {
          message.warning('Nhập mã lịch khởi hành dạng số'); return;
        }
        navigate(`/admin/managerTour/tourDeparture?departureId=${id}`);
      }} />
    {loadError && <Alert type="error" showIcon className="mb-4" message={loadError} />}
    {meetingId && <EditMeetingPoint key={meetingId} departureId={meetingId} onClose={() => setMeetingId(undefined)} />}
    {(focusDepartureId || focusRequestId) && <Alert showIcon className="!mb-4"
      message={focusRequestId ? `Đang xem yêu cầu dời lịch #${focusRequestId}` : `Đang xem lịch khởi hành #${focusDepartureId}`}
      action={<Button size="small" onClick={() => navigate(tourDeparturesPath)}>{tourId ? 'Xem tất cả lịch và yêu cầu của tour' : 'Quay lại danh sách'}</Button>} />}
    {tourId == null && focusDepartureId == null && (
      <Alert
        type="info"
        showIcon
        style={{ marginBottom: 16 }}
        message="Chọn tour để quản lý lịch khởi hành và sức chứa"
        action={
          <Select
            style={{ minWidth: 280 }}
            showSearch
            optionFilterProp="label"
            placeholder="Chọn tour"
            options={tours.map((tour) => ({ value: tour.id, label: tour.tourTitle }))}
            onChange={(id) => navigate(`/admin/managerTour/tourDeparture?tourId=${id}`)}
          />
        }
      />
    )}
    {isListCapped(tours, TOUR_LIST_CAP) && (
      <Alert
        type="warning"
        showIcon
        style={{ marginBottom: 16 }}
        message={`Danh sách chỉ tải ${TOUR_LIST_CAP} tour gần nhất nên tour cũ hơn không chọn được ở đây.`}
      />
    )}
    {!focusRequestId && <ProTable<ITourDeparture> columns={columns} rowKey="id" dataSource={loading || loadError ? [] : data} loading={loading} search={false} headerTitle="Lịch khởi hành và sức chứa"
      toolBarRender={() => [<Button key="reload" disabled={tourId == null && focusDepartureId == null} onClick={() => void refresh()}>Tải lại</Button>, ...(canCreate ? [<Button key="add" type="primary" disabled={!tourId} icon={<PlusOutlined />} onClick={() => setOpenAdd(true)}>Thêm lịch</Button>] : [])]}
      pagination={focusDepartureId ? false : { pageSize: 5 }} />}
    <Modal centered
        title="Thêm lịch khởi hành" open={openAdd} onCancel={() => setOpenAdd(false)} closable={!saving} maskClosable={!saving} keyboard={!saving} footer={null} destroyOnHidden width={650}><AddTourDeparture onSubmit={create} onSavingChange={setSaving} /></Modal>
    <Modal centered
        title="Quản lý sức chứa/lịch" open={!!selected} onCancel={() => { capacityRequest.current += 1; setSelected(null); }} closable={!saving} maskClosable={!saving} keyboard={!saving} footer={null} destroyOnHidden width={750}>
      {selected && <EditTourDeparture data={selected} onSubmit={update} onReload={() => loadCapacity(selected.id)} onSavingChange={setSaving} />}
    </Modal>
    {tourId && !focusDepartureId && <ScheduleChangesPanel tourId={tourId} focusRequestId={focusRequestId}
      onChanged={() => { if (!focusRequestId) void refresh(); }} />}
  </>;
}
