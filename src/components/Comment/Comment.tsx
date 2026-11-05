import React, { useCallback, useEffect, useRef, useState } from 'react';
import { Input, Button, List, Tooltip, message, Rate, Card, Avatar, Alert } from 'antd';
import { SendOutlined, UserOutlined } from '@ant-design/icons';
import { useParams } from 'react-router-dom';
import { createReview, getReviewEligibility, getReviewsByTour } from '@/services/authServices';
import socket from '@/api/socket'; // ✅ dùng alias @ thay vì đường dẫn tương đối
import { useAppSelector } from '@/store/hooks';
import { formatDatetime } from '@/utils';
import type { ReviewResponse } from '@/types/comment';

const REVIEW_PAGE_SIZE = 50;

const CommentTour: React.FC = () => {
  const [comments, setComments] = useState<ReviewResponse[]>([]);
  const [newComment, setNewComment] = useState('');
  const [rating, setRating] = useState<number>(0);
  const [loading, setLoading] = useState(false);
  const [reviewsLoading, setReviewsLoading] = useState(false);
  const [reviewsError, setReviewsError] = useState('');
  const [nextPage, setNextPage] = useState(0);
  const [hasMoreReviews, setHasMoreReviews] = useState(false);
  const reviewRequestId = useRef(0);
  const [eligibility, setEligibility] = useState<{ eligible: boolean; message: string } | null>(null);
  const { id } = useParams<{ id: string }>();
  const userLogin = useAppSelector(state => state.auth.user);
  useEffect(() => {
    let cancelled = false;
    setEligibility(null);
    if (!id || !userLogin?.id) {
      setEligibility({ eligible: false, message: 'Đăng nhập để kiểm tra điều kiện đánh giá tour đã đi.' });
      return;
    }
    void getReviewEligibility(Number(id))
      .then((res) => {
        if (!cancelled && res.code === 1000) setEligibility(res.result);
      }).catch(() => { if (!cancelled) setEligibility({ eligible: false, message: 'Chưa xác minh được điều kiện đánh giá. Vui lòng tải lại trang để thử lại.' }); });
    return () => { cancelled = true; };
  }, [id, userLogin?.id]);
  useEffect(() => {
    if (!id) return;

    const room = `tour_${id}`;
    const join = () => socket.emit('join_room', room);
    const onReview = (newReview: ReviewResponse) => {
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
    };
    socket.on('connect', join);
    socket.on('new_review', onReview);
    if (socket.connected) join();
    else socket.connect();

    return () => {
      socket.emit('leave_room', room);
      socket.off('new_review', onReview);
      socket.off('connect', join);
      // The socket connection is shared by the whole app, so leave the room only;
      // disconnecting here would also cut off other screens listening to reviews.
    };
  }, [id]);

  const loadReviews = useCallback(async (tourId: number, page: number, reset: boolean) => {
    const requestId = ++reviewRequestId.current;
    setReviewsLoading(true);
    setReviewsError('');
    try {
      const res = await getReviewsByTour(tourId, { page, size: REVIEW_PAGE_SIZE });
      if (requestId !== reviewRequestId.current) return;
      if (res?.code === 1000) {
        const rows = res.result ?? [];
        setComments((prev) => {
          if (reset) return rows;
          const seen = new Set(prev.map((item) => item.id));
          return [...prev, ...rows.filter((item) => !seen.has(item.id))];
        });
        setNextPage(page + 1);
        // A full page means there may be another page on the server.
        setHasMoreReviews(rows.length >= REVIEW_PAGE_SIZE);
      } else {
        if (reset) setComments([]);
        setHasMoreReviews(false);
        setReviewsError(res?.message || 'Không tải được đánh giá.');
      }
    } catch {
      if (requestId === reviewRequestId.current) {
        if (reset) setComments([]);
        setHasMoreReviews(false);
        setReviewsError('Không tải được đánh giá. Vui lòng thử lại.');
      }
    } finally {
      if (requestId === reviewRequestId.current) setReviewsLoading(false);
    }
  }, []);

  useEffect(() => {
    // Invalidate any in-flight request from the previously opened tour.
    reviewRequestId.current += 1;
    setComments([]);
    setReviewsError('');
    setHasMoreReviews(false);
    setNextPage(0);
    setReviewsLoading(false);
    if (!id) return;
    void loadReviews(Number(id), 0, true);
    return () => { reviewRequestId.current += 1; };
  }, [id, loadReviews]);

  const retryReviews = () => {
    if (!id) return;
    void loadReviews(Number(id), comments.length === 0 ? 0 : nextPage, comments.length === 0);
  };

  const handleSend = async () => {
    if (!eligibility?.eligible) return;
    if (rating < 1 || rating > 5) return message.warning('Vui lòng chọn từ 1 đến 5 sao.');
    if (!newComment.trim()) {
      return message.warning('Vui lòng nhập nội dung bình luận!');
    }

    setLoading(true);

    const data = {
      tourId: Number(id),
      content: newComment,
      rating: rating,
    };
    try {
      const res = await createReview(data);
      if (res && res.code === 1000 && res.result) {
        setComments(prev => [res.result, ...prev.filter(item => item.id !== res.result.id)]);
        setEligibility({ eligible: false, message: 'Bạn đã đánh giá tour này. Cảm ơn bạn đã chia sẻ trải nghiệm với SGU Tour.' });
        setNewComment('');
        setRating(0);
        message.success('✅ Gửi bình luận thành công!');
      } else {
        message.error(res?.message || 'Gửi đánh giá thất bại. Vui lòng thử lại.');
      }
    } catch (err: unknown) {
      const failure = err as { response?: { data?: { message?: string } } };
      message.error(failure.response?.data?.message || 'Gửi đánh giá thất bại. Vui lòng thử lại.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card className="w-full mx-auto rounded-2xl shadow-sm">
      <h2 className="text-lg font-semibold mb-4">Đánh giá & Bình luận Tour</h2>
      <Alert type="info" showIcon style={{ marginBottom: 16 }} message={eligibility?.message || 'Đang kiểm tra điều kiện đánh giá…'} />

      {/* --- Form nhập bình luận --- */}
      <div className="flex gap-3 mb-4">
        <Avatar size={40} icon={<UserOutlined />} src={userLogin?.avatar} />
        <div className="flex-1">
          <Rate
            value={rating}
            onChange={(value) => setRating(value)}
            allowClear
            className="mb-2 text-lg"
            disabled={!eligibility?.eligible}
          />
          <Input.TextArea
            rows={3}
            maxLength={1000}
            disabled={!eligibility?.eligible}
            placeholder="Chia sẻ trải nghiệm của bạn..."
            value={newComment}
            onChange={(e) => setNewComment(e.target.value)}
          />
          <div className="text-right mt-2">
            <Button type="primary" icon={<SendOutlined />} loading={loading} disabled={!eligibility?.eligible} onClick={handleSend}>
              Gửi
            </Button>
          </div>
        </div>
      </div>

      {/* --- Danh sách bình luận --- */}
      <List
        dataSource={comments}
        itemLayout="horizontal"
        loading={reviewsLoading && comments.length === 0}
        locale={{ emptyText: 'Chưa có đánh giá cho tour này' }}
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
                <Avatar src={item.user?.avatar} icon={<UserOutlined />} alt={item.user?.username} />
              }
              title={
                <div className="flex items-center gap-2">
                  <span className="font-medium">{item.user?.username || 'Ẩn danh'}</span>
                  <Tooltip title={formatDatetime(item.createdAt)}>
                    <span className="text-xs text-gray-500">{formatDatetime(item.createdAt)}</span>
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

      {reviewsError && (
        <Alert
          type="error"
          showIcon
          message={reviewsError}
          style={{ marginTop: 16 }}
          action={<Button size="small" loading={reviewsLoading} onClick={retryReviews}>Thử lại</Button>}
        />
      )}

      {hasMoreReviews && (
        <div className="text-center mt-4">
          <Button
            loading={reviewsLoading}
            disabled={reviewsLoading}
            onClick={() => id && void loadReviews(Number(id), nextPage, false)}
          >
            Tải thêm đánh giá
          </Button>
        </div>
      )}
    </Card>
  );
};

export default CommentTour;
