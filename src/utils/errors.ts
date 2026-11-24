import axios from 'axios';

/** Friendly fallbacks for HTTP statuses whose response body has no message. */
const STATUS_MESSAGES: Record<number, string> = {
  401: 'Phiên đăng nhập đã hết hạn. Vui lòng đăng nhập lại.',
  403: 'Bạn không có quyền thực hiện thao tác này.',
  429: 'Bạn thao tác quá nhanh. Vui lòng thử lại sau ít phút.',
  503: 'Hệ thống đang bận. Vui lòng thử lại sau.',
};

export function errorMessage(error: unknown, fallback = 'Đã xảy ra lỗi'): string {
  if (axios.isAxiosError<unknown>(error)) {
    const data = error.response?.data;
    const reference = error.response?.headers?.['x-request-id'];
    const withReference = (message: string) => typeof reference === 'string' &&
      /^[a-f0-9]{8}(?:-[a-f0-9]{4}){3}-[a-f0-9]{12}$/i.test(reference)
      ? `${message} (Mã tra cứu ${reference})` : message;
    if (typeof data === 'string' && data) return withReference(data);
    if (data && typeof data === 'object' && 'message' in data && typeof data.message === 'string' && data.message) return withReference(data.message);
    const status = error.response?.status;
    if (status && STATUS_MESSAGES[status]) return withReference(STATUS_MESSAGES[status]);
    // Axios phrases transport failures in English; keep the UI in Vietnamese when the
    // server never answered (offline, DNS, timeout) or answered without a known status.
    if (!error.response) return 'Không kết nối được máy chủ. Vui lòng kiểm tra mạng và thử lại.';
    return withReference(fallback);
  }
  if (error && typeof error === 'object' && 'message' in error && typeof error.message === 'string' && error.message) return error.message;
  return fallback;
}
