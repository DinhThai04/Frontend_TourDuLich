import type { ImgHTMLAttributes } from 'react';
import fallback from '@/assets/images/fallback.png';
import { imageAtWidth, imageSources } from '@/utils/responsiveImage';

type Props = Omit<ImgHTMLAttributes<HTMLImageElement>, 'src' | 'srcSet'> & {
  src: string | null | undefined;
  imageWidth?: number;
};

export default function ResponsiveImage({ src, imageWidth = 640, sizes = '(max-width: 640px) 100vw, 400px', loading = 'lazy', decoding = 'async', onError, ...props }: Props) {
  const original = src || fallback;
  return <img {...props} src={imageAtWidth(original, imageWidth)}
    srcSet={imageSources(original, [320, 640, 960, 1280].filter(width => width <= imageWidth * 2))}
    sizes={sizes} loading={loading} decoding={decoding}
    onError={event => {
      const image = event.currentTarget;
      // A Cloudinary account may forbid a new transformation: retry the stored original once.
      image.removeAttribute('srcset');
      if (image.dataset.originalTried !== original && imageAtWidth(original, imageWidth) !== original) {
        image.dataset.originalTried = original;
        image.src = original;
      } else if (image.getAttribute('src') !== fallback) image.src = fallback;
      onError?.(event);
    }} />;
}
