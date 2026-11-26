import { Alert, Button, Card, Empty, List, Typography } from 'antd';
import { useState } from 'react';
import { useApiQuery } from '@/hooks';
import { departureManifest } from '@/services/departureManifest';
import { getTourDepartureById } from '@/services/tourServices';
import type { ITourDeparture } from '@/types/Tour';
import DepartureManifest from '@/components/Admin/ManagerTour/ModelTourDeparture/DepartureManifest';
import { formatAdminDatetime } from '@/components/Admin/Shared/adminDate';

export default function AssignedDepartures() {
  const [selected, setSelected] = useState<ITourDeparture>();
  const { data, error, loading, refresh } = useApiQuery(async () => {
    const result = await departureManifest.assigned();
    if (result.code !== 1000) throw new Error(result.message || 'Chưa tải được danh sách phân công.');
    return Promise.all(result.result.map(async id => {
      try {
        const { code, result } = await getTourDepartureById(id);
        return { id, departure: code === 1000 ? result : undefined };
      } catch {
        return { id, departure: undefined };
      }
    }));
  });

  return <section className="mx-auto max-w-4xl px-4 py-8">
    <Card title="Chuyến được phân công" extra={<Button onClick={() => void refresh()}>Tải lại</Button>}>
      {error && <Alert showIcon type="error" message={error} />}
      <List loading={loading} dataSource={data ?? []} rowKey="id"
        locale={{ emptyText: <Empty image={Empty.PRESENTED_IMAGE_SIMPLE} description="Bạn chưa được phân công chuyến nào." /> }}
        renderItem={({ id, departure }) => <List.Item actions={[
          <Button key="open" disabled={!departure} onClick={() => setSelected(departure)}>Điểm danh</Button>,
        ]}>
          <div>
            <Typography.Text strong>{departure?.tourCode || `Lịch #${id}`}</Typography.Text>
            <div><Typography.Text type="secondary">{departure ? formatAdminDatetime(departure.departureDate)
              : 'Chưa tải được thông tin lịch. Hãy thử tải lại.'}</Typography.Text></div>
          </div>
        </List.Item>} />
    </Card>
    {selected && <DepartureManifest key={selected.id} departure={selected} onClose={() => setSelected(undefined)} />}
  </section>;
}
