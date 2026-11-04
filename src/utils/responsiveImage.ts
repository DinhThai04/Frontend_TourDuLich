/** Only rewrite plain, versioned public Cloudinary images. Signed/transformed URLs stay intact. */
export function imageAtWidth(source: string, width: number): string {
  if (!Number.isFinite(width) || width < 1 || width > 2400) return source;
  try {
    const url = new URL(source);
    if (url.protocol !== 'https:' || url.hostname !== 'res.cloudinary.com' || url.port ||
        url.username || url.password || url.search || url.hash ||
        !/^\/[\w-]+\/image\/upload\/v\d+\/.+\.(?:jpe?g|png|webp|avif)$/i.test(url.pathname)) return source;
    url.pathname = url.pathname.replace('/image/upload/', `/image/upload/f_auto,q_auto,c_limit,w_${Math.round(width)}/`);
    return url.href;
  } catch { return source; }
}

export function imageSources(source: string, widths: readonly number[]): string | undefined {
  const valid = [...new Set(widths)].filter(width => Number.isInteger(width) && width > 0 && width <= 2400).sort((a, b) => a - b);
  const first = valid[0];
  if (first === undefined || imageAtWidth(source, first) === source) return undefined;
  return valid.map(width => `${imageAtWidth(source, width)} ${width}w`).join(', ');
}
