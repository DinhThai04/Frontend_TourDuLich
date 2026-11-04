import React, { useState } from 'react';
import { Alert, Collapse, List, Rate, Modal, Button, Avatar, Tooltip } from 'antd';
import { getAllReviews } from '@/services/authServices';
import { isApiSuccess } from '@/utils/apiResult';
import { useApiQuery } from '@/hooks';
import { formatDatetime, LIST_PAGE_SIZE } from '@/utils';
import { UserOutlined, MailOutlined, PhoneOutlined, HomeOutlined } from '@ant-design/icons';

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
  user: User | null; // tài khoản có thể đã bị gỡ khỏi hệ thống
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
  const { data, loading, error: loadError } = useApiQuery(async () => {
    const res = await getAllReviews();
    if (!isApiSuccess(res)) throw new Error(res?.message || 'Không tải được danh sách đánh giá');
    return res.result;
  });
  const [open, setOpen] = useState(false);
  const [selectedTour, setSelectedTour] = useState<TourReview | null>(null);
  // Backend caps reviews per page before grouping, so the cap must be counted on reviews, not groups.
  const totalReviews = (data ?? []).reduce((total, tour) => total + (tour.reviews?.length ?? 0), 0);

  const showModal = (tour: TourReview) => {
    setSelectedTour(tour);
    setOpen(true);
  };

  const handleClose = () => {
    setOpen(false);
    setSelectedTour(null);
  };

  // 🧩 render thông tin người dùng
  const renderUserInfo = (user: User | null) => (
    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
      <Avatar
        src={user?.avatar || undefined}
        icon={!user?.avatar ? <UserOutlined /> : undefined}
        style={{ backgroundColor: '#87d068' }}
      />
      <div>
        <div style={{ fontWeight: 500 }}>{user?.username || 'Ẩn danh'}</div>
        <div style={{ fontSize: 12, color: '#666' }}>
          <MailOutlined /> {user?.email || 'Không có email'}
        </div>
        {user?.phone && (
          <div style={{ fontSize: 12, color: '#666' }}>
            <PhoneOutlined /> {user.phone}
          </div>
        )}
        {user?.address && (
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
      {loadError && (
        <Alert type="error" showIcon style={{ marginBottom: 16 }} message={loadError} />
      )}
      {loading && (
        <Alert type="info" showIcon style={{ marginBottom: 16 }} message="Đang tải đánh giá..." />
      )}
      {totalReviews >= LIST_PAGE_SIZE && (
        <Alert
          type="warning"
          showIcon
          style={{ marginBottom: 16 }}
          message="Danh sách đánh giá đã đạt giới hạn 500 bản ghi. Dữ liệu có thể chưa đầy đủ, hãy thu hẹp phạm vi trước khi kết luận."
        />
      )}

      <Collapse
        accordion
        items={(data ?? []).map((tour) => ({
          key: tour.tourId,
          label: (
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
          ),
          children: (
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
                        <Tooltip title={formatDatetime(review.createdAt)}>
                          <span style={{ fontSize: 12, color: '#999' }}>
                            {formatDatetime(review.createdAt)}
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
          ),
        }))}
      />

      {/* Modal chi tiết */}
      <Modal
        title={`Chi tiết đánh giá - ${selectedTour?.tourName}`}
        open={open}
        onCancel={handleClose}
        footer={null}
        width={700}
        destroyOnHidden
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
                      <Tooltip title={formatDatetime(review.createdAt)}>
                        <span style={{ fontSize: 12, color: '#999' }}>
                          {formatDatetime(review.createdAt)}
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
