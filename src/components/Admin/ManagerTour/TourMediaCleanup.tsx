import { useCallback, useEffect, useRef, useState } from 'react';
import { Alert, Button, Image, Modal, Space, Table, Tag, message } from 'antd';
import { deleteDetachedImage, getDetachedImages, type DetachedImage } from '@/services/tourMediaServices';
import { mediaError, pageWithinRange } from '@/utils/tourMedia';

const PAGE_SIZE = 15;

export default function TourMediaCleanup({ open, onClose, canDelete }: { open: boolean; onClose: () => void; canDelete: boolean }) {
  const [images, setImages] = useState<DetachedImage[]>([]);
  const [page, setPage] = useState(0);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(false);
  const [deleting, setDeleting] = useState<string | null>(null);
  const request = useRef(0);
  const load = useCallback(async (selectedPage: number) => {
    const current = ++request.current;
    setLoading(true);
    try {
      const result = await getDetachedImages(selectedPage);
      // Only the newest request may paint the table; an older page response must not overwrite it.
      if (current !== request.current) return;
      const shown = pageWithinRange(result.totalElements, selectedPage, PAGE_SIZE);
      if (shown !== selectedPage) { setPage(shown); return; }
      setImages(result.content); setTotal(result.totalElements);
    }
    catch (error) { if (current === request.current) message.error(mediaError(error)); }
    finally { if (current === request.current) setLoading(false); }
  }, []);
  useEffect(() => { if (open) void load(page); }, [open, page, load]);
  function remove(image: DetachedImage) {
    Modal.confirm({
      title: 'Xóa vĩnh viễn ảnh trên Cloudinary?',
      content: 'Ảnh sẽ không thể dùng lại qua URL cũ. Email đã gửi có thể mất ảnh minh họa này. Chỉ xóa khi bạn chắc chắn không cần giữ ảnh.',
      okText: 'Xóa vĩnh viễn', cancelText: 'Giữ ảnh', okButtonProps: { danger: true },
      onOk: async () => {
        setDeleting(image.id);
        try { await deleteDetachedImage(image.id); message.success('Đã xóa ảnh khỏi Cloudinary'); await load(page); }
        catch (error) { message.error(mediaError(error)); throw error; }
        finally { setDeleting(null); }
      },
    });
  }
  return <Modal open={open} onCancel={onClose} footer={null} width={820} title="Ảnh đã gỡ khỏi tour">
    <Alert type="info" showIcon message="Gỡ khỏi tour sẽ giữ ảnh trên Cloudinary. Xóa vĩnh viễn chỉ thực hiện với ảnh đã xác minh và không còn tham chiếu khác."
      description="Ảnh đã gỡ từ trước khi có chức năng này có thể không còn metadata để xuất hiện trong danh sách; bạn kiểm tra những ảnh đó trực tiếp trên Cloudinary." />
    <Space style={{ marginBlock: 12 }}><Button onClick={() => void load(page)} loading={loading}>Tải lại</Button></Space>
    <Table<DetachedImage> rowKey="id" loading={loading} dataSource={images}
      pagination={{ current: page + 1, pageSize: PAGE_SIZE, total, showSizeChanger: false, onChange: value => setPage(value - 1) }}
      columns={[
        { title: 'Ảnh', render: (_, image) => <Image src={image.url} width={90} height={64} style={{ objectFit: 'cover' }} /> },
        { title: 'Public ID', render: (_, image) => <span style={{ overflowWrap: 'anywhere' }}>{image.publicId || 'Chưa có public_id'}</span> },
        { title: 'Xác minh', render: (_, image) => <Tag color={image.verified ? 'green' : 'orange'}>{image.verified ? 'Đã xác minh' : 'Kiểm tra thủ công'}</Tag> },
        { title: 'Thao tác', render: (_, image) => canDelete && <Button danger disabled={!image.verified || deleting !== null} loading={deleting === image.id} onClick={() => remove(image)}>Xóa Cloudinary</Button> },
      ]} />
  </Modal>;
}
