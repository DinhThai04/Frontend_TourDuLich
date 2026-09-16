import React, { useEffect, useState } from 'react';
import { Collapse, List, Rate, Modal, Button, Avatar, Tooltip } from 'antd';
import { getListComentByTourALll } from '@/services/authServices';
import { UserOutlined, MailOutlined, PhoneOutlined, HomeOutlined } from '@ant-design/icons';

const { Panel } = Collapse;

interface User {
  id: number | null;
  username: string;
  email: string;
  avatar?: string | null;
  phone?: string | null;
  address?: string | null;
}

interface Review {
  id: number;
  user: User; // ✅ thay userName thành object user
  content: string;
  rating: number;
  createdAt: string;
}

interface TourReview {
  tourId: number;
  tourName: string;
  reviews: Review[];
}

const ManagerReviewTour: React.FC = () => {
  const [data, setData] = useState<TourReview[]>([]);
  const [open, setOpen] = useState(false);
  const [selectedTour, setSelectedTour] = useState<TourReview | null>(null);

  const showModal = (tour: TourReview) => {
    setSelectedTour(tour);
    setOpen(true);
  };

  const handleClose = () => {
    setOpen(false);
    setSelectedTour(null);
  };

  const fetchDataReview = async () => {
    let res = await getListComentByTourALll();
    if (res && res.code === 1000) {
      setData(res.result);
    }
  };

  useEffect(() => {
    fetchDataReview();
  }, []);

  // 🧩 render thông tin người dùng
  const renderUserInfo = (user: User) => (
    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
      <Avatar
        src={user.avatar || undefined}
        icon={!user.avatar ? <UserOutlined /> : undefined}
        style={{ backgroundColor: '#87d068' }}
      />
      <div>
        <div style={{ fontWeight: 500 }}>{user.username || 'Ẩn danh'}</div>
        <div style={{ fontSize: 12, color: '#666' }}>
          <MailOutlined /> {user.email || 'Không có email'}
        </div>
        {user.phone && (
          <div style={{ fontSize: 12, color: '#666' }}>
            <PhoneOutlined /> {user.phone}
          </div>
        )}
        {user.address && (
          <div style={{ fontSize: 12, color: '#666' }}>
            <HomeOutlined /> {user.address}
          </div>
        )}
      </div>
    </div>
  );

  return (
    <div>
      <h2 style={{ marginBottom: 16 }}>Danh sách Review theo Tour</h2>

      <Collapse accordion>
        {data.map((tour) => (
          <Panel
            header={
              <div
                style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}
              >
                <span>
                  {tour.tourName} ({tour.reviews.length} đánh giá)
                </span>
                <Button
                  size="small"
                  onClick={(e) => {
                    e.stopPropagation();
                    showModal(tour);
                  }}
                >
                  Xem chi tiết
                </Button>
              </div>
            }
            key={tour.tourId}
          >
            <List
              dataSource={tour.reviews}
              renderItem={(review) => (
                <List.Item>
                  <List.Item.Meta
                    avatar={renderUserInfo(review.user)}
                    title={
                      <div
                        style={{
                          display: 'flex',
                          justifyContent: 'space-between',
                          alignItems: 'center',
                        }}
                      >
                        <Tooltip title={review.createdAt}>
                          <span style={{ fontSize: 12, color: '#999' }}>
                            {new Date(review.createdAt).toLocaleString('vi-VN')}
                          </span>
                        </Tooltip>
                      </div>
                    }
                    description={
                      <div style={{ marginTop: 4 }}>
                        <Rate disabled defaultValue={review.rating} />
                        <p style={{ marginTop: 4 }}>{review.content}</p>
                      </div>
                    }
                  />
                </List.Item>
              )}
            />
          </Panel>
        ))}
      </Collapse>

      {/* Modal chi tiết */}
      <Modal
        title={`Chi tiết đánh giá - ${selectedTour?.tourName}`}
        open={open}
        onCancel={handleClose}
        footer={null}
        width={700}
        destroyOnClose
        centered
      >
        {selectedTour && (
          <List
            dataSource={selectedTour.reviews}
            renderItem={(review) => (
              <List.Item>
                <List.Item.Meta
                  avatar={renderUserInfo(review.user)}
                  title={
                    <div
                      style={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                      }}
                    >
                      <Tooltip title={review.createdAt}>
                        <span style={{ fontSize: 12, color: '#999' }}>
                          {new Date(review.createdAt).toLocaleString('vi-VN')}
                        </span>
                      </Tooltip>
                    </div>
                  }
                  description={
                    <div>
                      <Rate disabled defaultValue={review.rating} />
                      <p style={{ marginTop: 4 }}>{review.content}</p>
                    </div>
                  }
                />
              </List.Item>
            )}
          />
        )}
      </Modal>
    </div>
  );
};

export default ManagerReviewTour;
