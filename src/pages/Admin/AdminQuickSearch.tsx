import { Button, Empty, Input, Modal, Space } from 'antd';
import { SearchOutlined } from '@ant-design/icons';
import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useHasPermission } from '@/config/useHasPermission';
import { ALL_PERMISSIONS as P } from '@/config/permissions';
import { useApiQuery } from '@/hooks';
import { getAllTours } from '@/services/tourServices';
import { getAllUsers } from '@/services/userServices';
import type { User } from '@/types/User';

export default function AdminQuickSearch() {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState('');
  const bookings = useHasPermission(P.BOOKINGS.GET_ALL);
  const transactions = useHasPermission(P.PAYMENT_RECONCILIATION.GET_LIST);
  const tours = useHasPermission(P.TOURS.GET_LIST);
  const users = useHasPermission(P.USERS.GET_LIST);
  useEffect(() => {
    const handler = (event: KeyboardEvent) => {
      if (!(event.ctrlKey || event.metaKey) || event.key.toLowerCase() !== 'k') return;
      event.preventDefault(); setOpen(true);
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, []);
  const catalogue = useApiQuery(async () => {
    const [tourResult, userResult] = await Promise.allSettled([tours ? getAllTours() : undefined, users ? getAllUsers() : undefined]);
    return {
      tours: tourResult.status === 'fulfilled' && tourResult.value?.code === 1000 ? tourResult.value.result : [],
      users: userResult.status === 'fulfilled' && userResult.value?.code === 1000 && Array.isArray(userResult.value.result) ? userResult.value.result as User[] : [],
      partial: [tourResult, userResult].some(result => result.status === 'rejected' || (result.value && result.value.code !== 1000)),
    };
  }, { enabled: open && (tours || users), deps: [open, tours, users] });
  const term = query.trim();
  const match = term.toLocaleLowerCase('vi');
  const id = term.replace(/^#/, '');
  const results = [
    ...(bookings && /^[1-9]\d{0,9}$/.test(id) && Number(id) <= 2147483647 ? [{ to: `/admin/managerBooking?bookingId=${id}`, label: `Tra cứu đơn #${id}` }] : []),
    ...(transactions && /^[a-zA-Z0-9_-]{6,32}$/.test(term) ? [{ to: `/admin/paymentReconciliation?txnRef=${encodeURIComponent(term)}`, label: `Tra cứu giao dịch ${term}` }] : []),
    ...(match.length >= 2 ? (catalogue.data?.tours ?? []).filter(tour => tour.tourTitle.toLocaleLowerCase('vi').includes(match)).slice(0, 5)
      .map(tour => ({ to: `/admin/tours/${tour.id}`, label: tour.tourTitle })) : []),
    ...(match.length >= 2 ? (catalogue.data?.users ?? []).filter(user => `${user.username} ${user.email}`.toLocaleLowerCase('vi').includes(match)).slice(0, 5)
      .map(user => ({ to: `/admin/managerUser?q=${encodeURIComponent(user.email)}`, label: `${user.username} · ${user.email}` })) : []),
  ];
  return <>
    <Button icon={<SearchOutlined />} onClick={() => setOpen(true)}>Tìm nhanh <kbd>Ctrl+K</kbd></Button>
    <Modal title="Tìm nhanh" open={open} footer={null} onCancel={() => setOpen(false)} destroyOnHidden
      afterOpenChange={visible => { if (visible) document.getElementById('admin-quick-search-input')?.focus(); }}>
      <Space direction="vertical" className="w-full">
        <Input id="admin-quick-search-input" aria-label="Tìm nhanh" prefix={<SearchOutlined />} value={query}
          onChange={event => setQuery(event.target.value)} placeholder="#Mã đơn, mã giao dịch, khách hàng hoặc tour" />
        {catalogue.data?.partial && <p role="status">Một số nguồn tìm kiếm chưa tải được.</p>}
        {results.map(result => <Link key={result.to} className="admin-quick-result" to={result.to} onClick={() => setOpen(false)}>{result.label}</Link>)}
        {!results.length && <Empty image={Empty.PRESENTED_IMAGE_SIMPLE} description={catalogue.loading ? 'Đang tải danh mục…' : term ? 'Không tìm thấy kết quả phù hợp' : 'Nhập mã hoặc ít nhất hai ký tự để tìm tên'} />}
      </Space>
    </Modal>
  </>;
}
