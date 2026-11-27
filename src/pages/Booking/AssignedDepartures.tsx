import { logoutUser } from '@/store/slices/authSlice';
import { useAppDispatch, useAppSelector } from '@/store/hooks';
import { useNavigate } from 'react-router-dom';
import { Alert, Button, Card, Empty, List, Tag, Typography } from 'antd';
import { useState } from 'react';
import { useApiQuery } from '@/hooks';
import { departureManifest, tripPhaseLabel, hasBoarded } from '@/services/departureManifest';
import { getTourDepartureById, getTourById } from '@/services/tourServices';
import type { ITourDeparture } from '@/types/Tour';
import DepartureManifest from '@/components/Admin/ManagerTour/ModelTourDeparture/DepartureManifest';
import { formatAdminDatetime } from '@/components/Admin/Shared/adminDate';

export default function AssignedDepartures() {
  const dispatch = useAppDispatch();
  const navigate = useNavigate();
  const username = useAppSelector(state => state.auth.user?.username);
  const [selected, setSelected] = useState<{ departure: ITourDeparture; title?: string }>();
  const { data, error, loading, refresh } = useApiQuery(async () => {
    const result = await departureManifest.assigned();
    if (result.code !== 1000) throw new Error(result.message || 'Chưa tải được danh sách phân công.');
    return Promise.all(result.result.map(async id => {
      try {
        const { code, result } = await getTourDepartureById(id);
        if (code !== 1000 || !result) return { id };
        const [tour, manifest] = await Promise.allSettled([getTourById(result.tourId), departureManifest.get(id)]);
        const title = tour.status === 'fulfilled' && tour.value.code === 1000 ? tour.value.result?.tourTitle : undefined;
        const summary = manifest.status === 'fulfilled' && manifest.value.code === 1000 ? manifest.value.result : undefined;
        return { id, departure: result, title, summary };
      } catch {
        return { id, departure: undefined };
      }
    }));
  });

  return <main className="min-h-screen bg-[#F3F8F7]">
    <header className="border-b border-[#DDE9E6] bg-white">
      <div className="mx-auto flex max-w-5xl flex-wrap items-center justify-between gap-3 px-4 py-4">
        <strong className="text-[#134E48]">SGU Tour · Vận hành chuyến</strong>
        <div className="flex items-center gap-3">
          {username && <span>{username}</span>}
          <Button onClick={async () => { await dispatch(logoutUser()); navigate('/login', { replace: true }); }}>Đăng xuất</Button>
        </div>
      </div>
    </header>
    <section className="mx-auto max-w-5xl px-4 py-6">
      <Typography.Title level={1} className="!text-2xl">Điểm danh chuyến</Typography.Title>
      {selected ? <Card>
        <DepartureManifest key={selected.departure.id} departure={selected.departure} tourTitle={selected.title} onClose={() => { setSelected(undefined); void refresh(); }} inline />
      </Card> : <Card title="Chuyến được phân công" extra={<Button onClick={() => void refresh()}>Tải lại</Button>}>
      {error && <Alert showIcon type="error" message={error} />}
      <List loading={loading} dataSource={data ?? []} rowKey="id"
        locale={{ emptyText: <Empty image={Empty.PRESENTED_IMAGE_SIMPLE} description="Bạn chưa được phân công chuyến nào." /> }}
        renderItem={({ id, departure, title, summary }) => <List.Item className="!flex !flex-wrap !gap-3">
          <div className="min-w-0 flex-1 basis-52">
            <Typography.Title level={4} className="!mb-2">{title || departure?.tourCode || `Lịch #${id}`}</Typography.Title>
            {departure?.tourCode && <Tag>{departure.tourCode}</Tag>}
            {summary && <Tag color="green">{tripPhaseLabel[summary.phase]}</Tag>}
            <div><Typography.Text type="secondary">{departure ? formatAdminDatetime(departure.departureDate)
              : 'Chưa tải được thông tin lịch. Hãy thử tải lại.'}</Typography.Text></div>
            {departure?.returnDate && <Typography.Text type="secondary">Dự kiến về {formatAdminDatetime(departure.returnDate)}</Typography.Text>}
            {summary && <div className="mt-1 font-medium text-[#14532d]">{summary.passengers.filter(hasBoarded).length}/{summary.passengers.length} đã lên xe</div>}
          </div>
          <Button type="primary" style={{ backgroundColor: '#0f5132' }} disabled={!departure}
            onClick={() => { if (departure) setSelected({ departure, title }); }}>Vận hành chuyến</Button>
        </List.Item>} />
      </Card>}
    </section>
  </main>;
}
