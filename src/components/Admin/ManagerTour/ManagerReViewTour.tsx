import { Alert, Avatar, Button, DatePicker, Drawer, Empty, Rate, Select, Space } from 'antd';
import { useParams } from 'react-router-dom';
import { useState } from 'react';
import type { Dayjs } from 'dayjs';
import AdminPageHeader from '../Shared/AdminPageHeader';
import { AdminProTable } from '../Shared/AdminTable';
import { getAllReviews, getReviewsByTour } from '@/services/authServices';
import type { ReviewResponse } from '@/types/comment';
import { useApiQuery } from '@/hooks';
import { formatDate, parseDate, LIST_PAGE_SIZE } from '@/utils';

type Row = ReviewResponse & { tourName: string };

export default function ManagerReviewTour() {
  const { tourId } = useParams();
  const id = Number(tourId) || undefined;
  const [focus, setFocus] = useState<Row>();
  const [tour, setTour] = useState<number>();
  const [stars, setStars] = useState<number>();
  const [range, setRange] = useState<[Dayjs | null, Dayjs | null] | null>(null);
  const { data = [], loading, error, refresh } = useApiQuery(async (): Promise<Row[]> => {
    if (id) {
      const response = await getReviewsByTour(id, { page: 0, size: LIST_PAGE_SIZE });
      if (response.code !== 1000) throw new Error(response.message);
      return response.result.map(review => ({ ...review, tourId: id, tourName: `Tour #${id}` }));
    }
    const response = await getAllReviews();
    if (response.code !== 1000) throw new Error(response.message);
    return response.result.flatMap(group => group.reviews.map(review => ({
      ...review, tourId: group.tourId, tourName: group.tourName,
    })));
  }, { deps: [id] });
  const choices = [...new Map(data.map(row => [row.tourId, row.tourName]))].map(([value, label]) => ({ value, label }));
  const rows = data.filter(row => {
    const date = parseDate(row.createdAt);
    const day = date ? new Intl.DateTimeFormat('sv-SE', { timeZone: 'Asia/Ho_Chi_Minh' }).format(date) : '';
    return (!tour || tour === row.tourId) && (!stars || stars === row.rating) &&
      (!range?.[0] || day >= range[0].format('YYYY-MM-DD')) && (!range?.[1] || day <= range[1].format('YYYY-MM-DD'));
  });
  return <div className="admin-dashboard">
    {!id && <AdminPageHeader title="Đánh giá" description="Theo dõi phản hồi và điểm đánh giá của khách theo tour." />}
    {error && <Alert type="error" showIcon message={error} action={<Button onClick={() => void refresh()}>Thử lại</Button>} />}
    {data.length >= LIST_PAGE_SIZE && <Alert showIcon message={`Chỉ số và bộ lọc dựa trên ${LIST_PAGE_SIZE} đánh giá đã tải.`} />}
    <div className="admin-metric-strip">
      <div><span>Điểm trung bình</span><strong>{rows.length ? (rows.reduce((sum, row) => sum + row.rating, 0) / rows.length).toLocaleString('vi-VN', { minimumFractionDigits: 1, maximumFractionDigits: 1 }) + ' ★' : '—'}</strong></div>
      <div><span>Tổng đánh giá trong kết quả</span><strong>{rows.length}</strong></div>
      <div><span>Phân bố sao</span><div className="admin-rating-distribution">{[5, 4, 3, 2, 1].map(score => {
        const count = rows.filter(row => row.rating === score).length;
        return <div key={score}><span>{score} ★</span><meter min={0} max={Math.max(1, rows.length)} value={count} aria-label={`${score} sao`} /><span>{count}</span></div>;
      })}</div></div>
    </div>
    <AdminProTable<Row> filterKey={JSON.stringify([tour, stars, range])}
 rowKey="id" headerTitle="Phản hồi của khách" loading={loading} dataSource={error ? [] : rows}
      search={false} options={{ reload: refresh }} locale={{ emptyText: <Empty description="Không có đánh giá trong bộ lọc" /> }}
      toolBarRender={() => [<Space key="filters" wrap>
        {!id && <Select aria-label="Tour" showSearch optionFilterProp="label" allowClear placeholder="Tất cả tour" value={tour} options={choices} onChange={setTour} />}
        <Select aria-label="Số sao" allowClear placeholder="Số sao" value={stars} onChange={setStars} options={[5, 4, 3, 2, 1].map(value => ({ value, label: `${value} sao` }))} />
        <DatePicker.RangePicker format="DD/MM/YYYY" value={range} onChange={setRange} />
      </Space>]}
      columns={[
        { title: 'Khách hàng', width: 190, render: (_, row) => <Space className="whitespace-nowrap"><Avatar className="admin-user-avatar" src={row.user?.avatar}>{row.user?.username?.[0]?.toUpperCase() || '?'}</Avatar>{row.user?.username || 'Ẩn danh'}</Space> },
        { title: 'Tour', hideInTable: !!id, dataIndex: 'tourName' },
        { title: 'Sao', width: 82, render: (_, row) => <span className="whitespace-nowrap" aria-label={`${row.rating} sao`} style={{ color: '#92400E' }}> <span style={{ color: '#F59E0B' }}>★</span> {row.rating}/5</span> },
        { title: 'Nội dung', render: (_, row) => <span className="line-clamp-2">{row.content}</span> },
        { title: 'Ngày', responsive: ['md'], render: (_, row) => formatDate(row.createdAt) },
        { title: 'Thao tác', render: (_, row) => <Button size="small" onClick={() => setFocus(row)}>Chi tiết</Button> },
      ]} />
    <Drawer width={640} title={`Đánh giá #${focus?.id ?? ''}`} open={!!focus} onClose={() => setFocus(undefined)}>
      {focus && <div className="admin-dossier"><h3>{focus.tourName}</h3><p>{focus.user?.username || 'Ẩn danh'} · {formatDate(focus.createdAt)}</p>
        <Rate disabled value={focus.rating} /><p className="whitespace-pre-wrap break-words">{focus.content}</p></div>}
    </Drawer>
  </div>;
}
