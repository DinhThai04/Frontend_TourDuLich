import { Result, Button } from 'antd';
import { Link } from 'react-router-dom';

export default function ManagerPromotion() {
  return <Result status="info" title="Chưa triển khai quản lý khuyến mãi"
    subTitle="SGU Tour hiện áp dụng giá được công bố cho từng tour."
    extra={<Link to="/admin/managerTour/list"><Button type="primary">Quản lý tour</Button></Link>} />;
}
