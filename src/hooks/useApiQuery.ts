import { useCallback, useEffect, useRef, useState } from 'react';
import { errorMessage } from '@/utils/errors';

export interface UseApiQueryOptions {
  /** Khi false, hook không tự tải — dùng khi phụ thuộc quyền/điều kiện chưa sẵn sàng. */
  enabled?: boolean;
  /** Các giá trị thay đổi thì tự tải lại (ví dụ tourId lấy từ URL). */
  deps?: readonly unknown[];
  /** Nhận thông báo lỗi khi tải thất bại (ví dụ để hiện message/Alert). */
  onError?: (message: string) => void;
}

/**
 * Hook truy vấn dữ liệu: tách việc gọi API + quản lý loading/error khỏi component.
 * `fetcher` trả về dữ liệu cuối cùng; ném lỗi nếu không tải được.
 */
export function useApiQuery<T>(
  fetcher: () => Promise<T>,
  { enabled = true, deps = [], onError }: UseApiQueryOptions = {},
) {
  const [data, setData] = useState<T | undefined>(undefined);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetcherRef = useRef(fetcher);
  fetcherRef.current = fetcher;
  const onErrorRef = useRef(onError);
  onErrorRef.current = onError;
  const requestIdRef = useRef(0);

  const refresh = useCallback(async () => {
    const requestId = ++requestIdRef.current;
    setLoading(true);
    setError(null);
    try {
      const result = await fetcherRef.current();
      if (requestId === requestIdRef.current) setData(result);
      return result;
    } catch (err) {
      const message = errorMessage(err);
      if (requestId === requestIdRef.current) {
        setError(message);
        onErrorRef.current?.(message);
      }
      return undefined;
    } finally {
      if (requestId === requestIdRef.current) setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (!enabled) {
      // Discard anything still in flight and stop rendering the previous entity.
      requestIdRef.current += 1;
      setData(undefined);
      setError(null);
      setLoading(false);
      return;
    }
    // A different query identity must not render the previous entity while loading.
    requestIdRef.current += 1;
    setData(undefined);
    setError(null);
    void refresh();
    return () => { requestIdRef.current += 1; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [enabled, ...deps]);

  return { data, loading, error, refresh };
}
