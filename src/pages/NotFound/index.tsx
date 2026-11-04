import { Button, Result } from 'antd';
import { useNavigate } from 'react-router-dom';

const NotFoundPage = () => {
  const navigate = useNavigate();

  return (
    <Result
      status="404"
      title="404"
      subTitle="Trang bạn tìm kiếm không tồn tại hoặc đã bị di chuyển."
      extra={
        <Button type="primary" className="bg-[#7BBCB0]!" onClick={() => navigate('/')}>
          Về trang chủ
        </Button>
      }
    />
  );
};

export default NotFoundPage;
