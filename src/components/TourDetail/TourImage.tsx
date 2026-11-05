import { Image } from 'antd';
import { useState } from 'react';
import ResponsiveImage from '@/components/Share/ResponsiveImage';
import './tourGallery.css';

export default function TourImages({ imageIds }: { imageIds: string[] }) {
  const [selected, setSelected] = useState(0);
  const [preview, setPreview] = useState(false);
  if (!imageIds?.length) return null;
  const current = Math.min(selected, imageIds.length - 1);
  const move = (step: number) => setSelected((current + step + imageIds.length) % imageIds.length);
  return <div className="tour-gallery">
    <div className="tour-gallery-thumbnails" aria-label="Ảnh thu nhỏ của tour">
      {imageIds.slice(0, 3).map((src, index) => <button key={src + '-' + index}
        className={current === index ? 'selected' : ''} type="button"
        aria-label={index === 2 && imageIds.length > 3 ? 'Xem thêm ' + (imageIds.length - 3) + ' ảnh' : 'Chọn ảnh ' + (index + 1)}
        aria-pressed={current === index}
        onClick={() => { setSelected(index); if (index === 2 && imageIds.length > 3) setPreview(true); }}>
        <ResponsiveImage src={src} alt={'Ảnh tour ' + (index + 1)} imageWidth={160} sizes="140px" width={160} height={120} />
        {index === 2 && imageIds.length > 3 && <span className="tour-gallery-more">+{imageIds.length - 3}</span>}
      </button>)}
    </div>
    <div className="tour-gallery-main">
      <button type="button" className="tour-gallery-open" aria-label={'Phóng to ảnh tour ' + (current + 1)} onClick={() => setPreview(true)}>
        <ResponsiveImage key={imageIds[current]} src={imageIds[current]} alt={'Ảnh tour ' + (current + 1)}
          imageWidth={960} sizes="(max-width: 768px) 100vw, 750px" width={960} height={640}
          loading="eager" fetchPriority={current === 0 ? 'high' : 'auto'} />
      </button>
      {imageIds.length > 1 && <>
        <button type="button" className="tour-gallery-previous" aria-label="Ảnh trước" onClick={() => move(-1)}>‹</button>
        <button type="button" className="tour-gallery-next" aria-label="Ảnh tiếp theo" onClick={() => move(1)}>›</button>
        <span className="tour-gallery-counter" aria-live="polite">{current + 1} / {imageIds.length}</span>
      </>}
    </div>
    {/* No hidden image copies: originals are requested only when the viewer opens. */}
    <Image.PreviewGroup items={imageIds} preview={{ visible: preview, current,
      onVisibleChange: setPreview, onChange: setSelected }} />
  </div>;
}
