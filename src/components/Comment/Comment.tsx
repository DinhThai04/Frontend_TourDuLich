import React, { useState, useEffect } from 'react';
import { Input, Button, List, Tooltip, message, Rate, Card, Avatar } from 'antd';
import { SendOutlined, UserOutlined } from '@ant-design/icons';
import { useParams } from 'react-router-dom';
import { createComent, getListComentByTour } from '@/services/authServices';
import socket from '@/api/socket'; // ✅ dùng alias @ thay vì đường dẫn tương đối
import { sessionService } from '@/services/sessionServices';
import type { ReviewResponse } from '@/types/comment';

const CommentTour: React.FC = () => {
  const [comments, setComments] = useState<ReviewResponse[]>([]);
  const [newComment, setNewComment] = useState('');
  const [rating, setRating] = useState<number>(0);
  const [loading, setLoading] = useState(false);
  const { id } = useParams<{ id: string }>();
  const userLogin = sessionService.getUser();
  useEffect(() => {
    if (!id) return;

    const room = `tour_${id}`;
    socket.emit('join_room', room);
    console.log(`✅ Joined room: ${room}`);

    socket.on('new_review', (newReview: ReviewResponse) => {
      if (newReview.tourId === Number(id)) {
        // ⚠️ Kiểm tra tránh duplicate (nếu server phát lại cùng review)
        setComments((prev) => {
          const exist = prev.find((c) => c.id === newReview.id);
          if (exist) {
            // nếu cùng id thì thay thế (đảm bảo rating mới nhất)
            return [newReview, ...prev.filter((c) => c.id !== newReview.id)];
          }
          return [newReview, ...prev];
        });
      }
    });

    return () => {
      socket.emit('leave_room', room);
      socket.off('new_review');
    };
  }, [id]);

  // --- Lấy danh sách bình luận ban đầu ---
  const fetchDataComment = async () => {
    try {
      const res = await getListComentByTour(Number(id));
      if (res && res.code === 1000) {
        setComments(res.result);
      }
    } catch (err) {
      console.error('❌ Lỗi khi tải bình luận:', err);
    }
  };

  useEffect(() => {
    fetchDataComment();
  }, [id]);

  const handleSend = async () => {
    if (!newComment.trim()) {
      return message.warning('Vui lòng nhập nội dung bình luận!');
    }

    setLoading(true);

    const data = {
      tourId: Number(id),
      content: newComment,
      rating: rating,
      userId: Number(userLogin?.id) || 0,
      username: userLogin?.username || '',
      avatar: userLogin?.avatar || '',
    };
    try {
      const res = await createComent(data);
      if (res && res.code === 1000) {
        setNewComment('');
        setRating(0);
        message.success('✅ Gửi bình luận thành công!');
      }
    } catch (err) {
      message.error('❌ Gửi bình luận thất bại!');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card className="w-full mx-auto rounded-2xl shadow-sm">
      <h2 className="text-lg font-semibold mb-4">Đánh giá & Bình luận Tour</h2>

      {/* --- Form nhập bình luận --- */}
      <div className="flex gap-3 mb-4">
        <Avatar size={40} icon={<UserOutlined />} src={userLogin?.avatar} />
        <div className="flex-1">
          <Rate
            value={rating}
            onChange={(value) => setRating(value)}
            allowClear
            className="mb-2 text-lg"
          />
          <Input.TextArea
            rows={3}
            placeholder="Chia sẻ trải nghiệm của bạn..."
            value={newComment}
            onChange={(e) => setNewComment(e.target.value)}
          />
          <div className="text-right mt-2">
            <Button type="primary" icon={<SendOutlined />} loading={loading} onClick={handleSend}>
              Gửi
            </Button>
          </div>
        </div>
      </div>

      {/* --- Danh sách bình luận --- */}
      <List
        dataSource={comments}
        itemLayout="horizontal"
        pagination={{
          pageSize: 3,
          position: 'bottom',
          align: 'center',
          showSizeChanger: false,
          showLessItems: true,
        }}
        renderItem={(item) => (
          <List.Item className="border-b last:border-none pb-4">
            <List.Item.Meta
              avatar={
                <Avatar src={item.user.avatar} icon={<UserOutlined />} alt={item.user.username} />
              }
              title={
                <div className="flex items-center gap-2">
                  <span className="font-medium">{item.user.username}</span>
                  <Tooltip title={item.createdAt}>
                    <span className="text-xs text-gray-500">
                      {new Date(item.createdAt).toLocaleString()}
                    </span>
                  </Tooltip>
                </div>
              }
              description={
                <div>
                  <Rate disabled value={item.rating} className="text-sm" />

                  <p className="mt-1 text-black">{item.content}</p>
                </div>
              }
            />
          </List.Item>
        )}
      />
    </Card>
  );
};

export default CommentTour;
