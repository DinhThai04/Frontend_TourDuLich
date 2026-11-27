import { Result, Button } from 'antd';
import { Link } from 'react-router-dom';

export default function AdminResult({ status }: { status: 403 | 404 }) {
  return <Result status={status} title={status === 403 ? 'Bạn chưa có quyền truy cập' : 'Không tìm thấy trang'}
    subTitle={status === 403 ? 'Liên hệ quản trị viên để được cấp quyền phù hợp.' : 'Kiểm tra đường dẫn hoặc quay về danh sách tour.'}
    extra={<Link to={status === 403 ? '/' : '/admin/tours'}><Button type="primary">{status === 403 ? 'Về trang chủ' : 'Về danh sách tour'}</Button></Link>} />;
}
