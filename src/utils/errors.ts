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
    if (typeof data === 'string' && data) return data;
    if (data && typeof data === 'object' && 'message' in data && typeof data.message === 'string' && data.message) return data.message;
    const status = error.response?.status;
    if (status && STATUS_MESSAGES[status]) return STATUS_MESSAGES[status];
    // Axios phrases transport failures in English; keep the UI in Vietnamese when the
    // server never answered (offline, DNS, timeout) or answered without a known status.
    if (!error.response) return 'Không kết nối được máy chủ. Vui lòng kiểm tra mạng và thử lại.';
    return fallback;
  }
  if (error && typeof error === 'object' && 'message' in error && typeof error.message === 'string' && error.message) return error.message;
  return fallback;
}
