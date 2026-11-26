import { useEffect } from 'react';
import { message } from 'antd';
import { useNavigate } from 'react-router-dom';

export default function LegacyItinerary() {
  const navigate = useNavigate();
  useEffect(() => {
    const last = localStorage.getItem('sgu-admin-recent-tour') || '';
    if (/^[1-9][0-9]*$/.test(last)) navigate(`/admin/tours/${last}/itinerary`, { replace: true });
    else {
      void message.info('Chọn một tour rồi mở tab Lịch trình');
      navigate('/admin/tours', { replace: true });
    }
  }, [navigate]);
  return null;
}
