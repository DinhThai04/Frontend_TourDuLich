import type { TourFormValues } from '@/types/adminForms';
import type { ITour } from '@/types/Tour';
import React, { useEffect, useState } from 'react';
import { Form, Card, Image, Tag, Row, Col, Divider } from 'antd';
import { EnvironmentOutlined, CarOutlined, DollarOutlined, CalendarOutlined } from '@ant-design/icons';
import type { ILocation, ITourPrice, IVehicle } from '@/types/Tour';
import { getAllDepartures, getAllDestinations, getAllPrice, getAllVehicles } from '@/services/tourServices';

interface WatchTourProps {
  data?: ITour | null;
}

const WatchTour: React.FC<WatchTourProps> = ({ data }) => {
  const [form] = Form.useForm<TourFormValues & Pick<ITour, 'basePrice'>>();
  const [departureList, setDepartureList] = useState<ILocation[]>([]);
  const [destinationList, setDestinationList] = useState<ILocation[]>([]);
  const [vehicleList, setVehicleList] = useState<IVehicle[]>([]);
  const [tourPriceList, setTourPriceList] = useState<ITourPrice[]>([]);

  const fetchDataDestinations = async () => {
    try {
      const res = await getAllDestinations();
      if (res.code === 1000) {
        setDestinationList(res.result);
      }
    } catch { /* Không cần xử lý thêm */ }
  }

  const fetchDataDepartures = async () => {
    try {
      const res = await getAllDepartures();
      if (res.code === 1000) {
        setDepartureList(res.result);
      }
    } catch { /* Không cần xử lý thêm */ }
  }

  const fetchDataVehicles = async () => {
    try {
      const res = await getAllVehicles();
      if (res.code === 1000) {
        setVehicleList(res.result);
      }
    } catch { /* Không cần xử lý thêm */ }
  }

  const fetchDataTourPrice = async () => {
    try {
      const res = await getAllPrice();
      if (res.code === 1000) {
        setTourPriceList(res.result);
      }
    } catch { /* Không cần xử lý thêm */ }
  }

  useEffect(() => {
    fetchDataDestinations();
    fetchDataDepartures();
    fetchDataVehicles();
    fetchDataTourPrice();
  }, []);

  // Khi data thay đổi, set giá trị cho form
  useEffect(() => {
    if (data) {
      form.setFieldsValue({
        tourProgram: data.tourProgram,
        tourTitle: data.tourTitle,
        description: data.description,
        duration: data.duration,
        basePrice: data.basePrice,
        departureLocationId: data.departureCity?.id,
        destinationLocationId: data.destinationCity?.id,
        vehicleId: data.vehicle?.id,
        tourPriceId: data.tourPrice?.id,
      });
    }
  }, [data, form]);

  // Lấy thông tin hiển thị từ ID
  const getDepartureCityName = (id: number) => {
    const city = departureList.find(item => item.id === id);
    return city ? city.city : 'N/A';
  };

  const getDestinationCityName = (id: number) => {
    const city = destinationList.find(item => item.id === id);
    return city ? city.city : 'N/A';
  };

  const getVehicleName = (id: string) => {
    const vehicle = vehicleList.find(item => item.id === id);
    return vehicle ? vehicle.name : 'N/A';
  };

  const getTourPriceInfo = (id: number) => {
    const price = tourPriceList.find(item => item.id === id);
    return price;
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('vi-VN', {
      style: 'currency',
      currency: 'VND'
    }).format(amount);
  };

  // The tour response already carries its price; the reference list may still be loading or fail.
  const priceDetail = data?.tourPrice ? getTourPriceInfo(data.tourPrice.id) ?? data.tourPrice : null;
  const priceText = (value?: number | null) => (value == null ? '—' : formatCurrency(value));

  return (
    <Card
      variant="borderless"
      style={{
        maxWidth: 1000,
        margin: '0 auto',
        boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
        borderRadius: 12,
      }}
      styles={{
        header: {
          background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
          color: 'white',
          borderRadius: '12px 12px 0 0',
        },
      }}
    >
      {/* Thông tin cơ bản */}
      <Row gutter={[24, 16]}>
        <Col span={24}>
          <div style={{ marginBottom: 16 }}>
            <Tag color="blue" style={{ fontSize: '14px', padding: '4px 12px' }}>
              Tên chương trình
            </Tag>
            <div style={{ 
              fontSize: '18px', 
              fontWeight: '600', 
              marginTop: 8,
              padding: '12px',
              background: '#f8f9fa',
              borderRadius: '8px',
              borderLeft: '4px solid #1890ff'
            }}>
              {data?.tourProgram || 'N/A'}
            </div>
          </div>
        </Col>

        <Col span={24}>
          <div style={{ marginBottom: 16 }}>
            <Tag color="green" style={{ fontSize: '14px', padding: '4px 12px' }}>
              Tiêu đề tour
            </Tag>
            <div style={{ 
              fontSize: '16px', 
              fontWeight: '500', 
              marginTop: 8,
              padding: '12px',
              background: '#f8f9fa',
              borderRadius: '8px'
            }}>
              {data?.tourTitle || 'N/A'}
            </div>
          </div>
        </Col>

        <Col span={24}>
          <div style={{ marginBottom: 16 }}>
            <Tag color="orange" style={{ fontSize: '14px', padding: '4px 12px' }}>
              Mô tả tour
            </Tag>
            <div style={{ 
              marginTop: 8,
              padding: '16px',
              background: '#fff9f0',
              borderRadius: '8px',
              border: '1px solid #ffe7ba',
              lineHeight: '1.6'
            }}>
              {data?.description || 'Chưa có mô tả'}
            </div>
          </div>
        </Col>
      </Row>

      <Divider />

      {/* Thông tin chi tiết */}
      <Row gutter={[24, 16]}>
        <Col xs={24} sm={12} md={8}>
          <Card 
            size="small" 
            style={{ textAlign: 'center', height: '100%' }}
            styles={{ body: { padding: '16px 8px' } }}
          >
            <EnvironmentOutlined style={{ fontSize: '24px', color: '#52c41a', marginBottom: 8 }} />
            <div style={{ fontWeight: '600', color: '#52c41a' }}>Điểm khởi hành</div>
            <div style={{ marginTop: 8, fontSize: '16px', fontWeight: '500' }}>
              {data?.departureCity ? getDepartureCityName(data.departureCity.id) : 'N/A'}
            </div>
          </Card>
        </Col>

        <Col xs={24} sm={12} md={8}>
          <Card 
            size="small" 
            style={{ textAlign: 'center', height: '100%' }}
            styles={{ body: { padding: '16px 8px' } }}
          >
            <EnvironmentOutlined style={{ fontSize: '24px', color: '#fa541c', marginBottom: 8 }} />
            <div style={{ fontWeight: '600', color: '#fa541c' }}>Điểm đến</div>
            <div style={{ marginTop: 8, fontSize: '16px', fontWeight: '500' }}>
              {data?.destinationCity ? getDestinationCityName(data.destinationCity.id) : 'N/A'}
            </div>
          </Card>
        </Col>

        <Col xs={24} sm={12} md={8}>
          <Card 
            size="small" 
            style={{ textAlign: 'center', height: '100%' }}
            styles={{ body: { padding: '16px 8px' } }}
          >
            <CarOutlined style={{ fontSize: '24px', color: '#722ed1', marginBottom: 8 }} />
            <div style={{ fontWeight: '600', color: '#722ed1' }}>Phương tiện</div>
            <div style={{ marginTop: 8, fontSize: '16px', fontWeight: '500' }}>
              {data?.vehicle ? getVehicleName(data.vehicle.id) : 'N/A'}
            </div>
          </Card>
        </Col>

        <Col xs={24} sm={12} md={6}>
          <Card 
            size="small" 
            style={{ textAlign: 'center', height: '100%' }}
            styles={{ body: { padding: '16px 8px' } }}
          >
            <CalendarOutlined style={{ fontSize: '24px', color: '#1890ff', marginBottom: 8 }} />
            <div style={{ fontWeight: '600', color: '#1890ff' }}>Thời lượng</div>
            <div style={{ marginTop: 8, fontSize: '16px', fontWeight: '500' }}>
              {data?.duration ? `${data.duration} ngày` : 'N/A'}
            </div>
          </Card>
        </Col>

        <Col xs={24} sm={12} md={6}>
          <Card 
            size="small" 
            style={{ textAlign: 'center', height: '100%' }}
            styles={{ body: { padding: '16px 8px' } }}
          >
            <DollarOutlined style={{ fontSize: '24px', color: '#faad14', marginBottom: 8 }} />
            <div style={{ fontWeight: '600', color: '#faad14' }}>Giá người lớn</div>
            <div style={{ marginTop: 8, fontSize: '16px', fontWeight: '500', color: '#cf1322' }}>
              {data?.basePrice ? formatCurrency(data.basePrice) : 'N/A'}
            </div>
          </Card>
        </Col>

        <Col xs={24} sm={24} md={12}>
          <Card 
            size="small" 
            style={{ height: '100%' }}
            title={
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <DollarOutlined />
                <span>Chi tiết giá</span>
              </div>
            }
          >
            {priceDetail ? (
              <div style={{ lineHeight: '2' }}>
                <div>👤 Người lớn: <strong>{priceText(priceDetail.adultPrice)}</strong></div>
                <div>🧒 Trẻ em: <strong>{priceText(priceDetail.childPrice)}</strong></div>
                <div>👶 Trẻ nhỏ: <strong>{priceText(priceDetail.toddlerPrice)}</strong></div>
                <div>🍼 Em bé: <strong>{priceText(priceDetail.infantPrice)}</strong></div>
                <div>🏨 Phụ thu: <strong>{priceText(priceDetail.singleSupplementPrice)}</strong></div>
              </div>
            ) : (
              <div style={{ textAlign: 'center', color: '#999' }}>Chưa có thông tin giá</div>
            )}
          </Card>
        </Col>
      </Row>

      {/* Hình ảnh tour */}
      <Divider />
      
      <div style={{ marginBottom: 16 }}>
        <Tag color="purple" style={{ fontSize: '14px', padding: '4px 12px', marginBottom: 16 }}>
          Hình ảnh tour
        </Tag>
        
        {data?.imageIds && data.imageIds.length > 0 ? (
          <Row gutter={[16, 16]}>
            {data.imageIds.map((url: string, index: number) => (
              <Col xs={12} sm={8} md={6} key={index}>
                <Card
                  size="small"
                  styles={{ body: { padding: 8 } }}
                  hoverable
                  cover={
                    <Image
                      src={url}
                      alt={`Tour image ${index + 1}`}
                      style={{ 
                        height: 120, 
                        objectFit: 'cover',
                        borderRadius: '6px'
                      }}
                      preview={{
                        mask: <span>Xem ảnh</span>
                      }}
                    />
                  }
                >
                  <div style={{ 
                    textAlign: 'center', 
                    fontSize: '12px', 
                    color: '#666',
                    padding: '4px 0'
                  }}>
                    Ảnh {index + 1}
                  </div>
                </Card>
              </Col>
            ))}
          </Row>
        ) : (
          <div style={{ 
            textAlign: 'center', 
            padding: '40px', 
            background: '#fafafa',
            borderRadius: '8px',
            border: '2px dashed #d9d9d9'
          }}>
            <Image
              width={80}
              src="https://gw.alipayobjects.com/zos/antfincdn/ZHrcdLPrvN/empty.svg"
              preview={false}
            />
            <div style={{ marginTop: 16, color: '#999' }}>
              Chưa có hình ảnh nào cho tour này
            </div>
          </div>
        )}
      </div>
    </Card>
  );
};

export default WatchTour;