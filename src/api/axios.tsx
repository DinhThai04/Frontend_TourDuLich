import { sessionService } from '@/services/sessionServices';
import axios from 'axios';

let persistorRef: any = null;
export const injectPersistor = (persistor: any) => {
  persistorRef = persistor;
};

const axiosClient = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'http://localhost:8888/api/v1',
  headers: { 'Content-Type': 'application/json' },
});

let isRefreshing = false;
// eslint-disable-next-line @typescript-eslint/no-explicit-any
let failedQueue: any[] = [];

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const processQueue = (error: any, token: string | null = null) => {
  failedQueue.forEach((prom) => {
    if (error) prom.reject(error);
    else prom.resolve(token);
  });
  failedQueue = [];
};

// Interceptor request
axiosClient.interceptors.request.use((config) => {
  const token = sessionService.getToken();
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// // Interceptor response
// axiosClient.interceptors.response.use(
//   (response) => response.data,
//   // eslint-disable-next-line @typescript-eslint/no-explicit-any
//   async (error: AxiosError<any>) => {
//     // eslint-disable-next-line @typescript-eslint/no-explicit-any
//     const originalRequest: any = error.config;

//     if (error.response?.status === 401 && !originalRequest._retry) {
//       if (isRefreshing) {
//         // Nếu đang refresh thì đợi
//         return new Promise((resolve, reject) => {
//           failedQueue.push({ resolve, reject });
//         }).then((token) => {
//           originalRequest.headers.Authorization = 'Bearer ' + token;
//           return axiosClient(originalRequest);
//         });
//       }

//       originalRequest._retry = true;
//       isRefreshing = true;

//       try {
//         const token = sessionService.getToken();
//         if (!token) {
//           // sessionService.clearSession();
//           return Promise.reject(error);
//         }

//         // Gọi API refresh token
//         const res = await axios.post(`${import.meta.env.VITE_API_URL}/auth/users/refresh`, {
//           token,
//         });

//         const newToken = res.data.result.token;
//         const user = res.data.result.user;
//         sessionService.setSession(newToken, user);

//         processQueue(null, newToken);
//         isRefreshing = false;

//         originalRequest.headers.Authorization = 'Bearer ' + newToken;
//         return axiosClient(originalRequest);
//       } catch (err) {
//         processQueue(err, null);
//         isRefreshing = false;
//         sessionService.clearSession();
//         // window.location.href = "/login";
//         return Promise.reject(err);
//       }
//     }

//     return Promise.reject(error);
//   }
// );

// export default axiosClient;
// Interceptor response
axiosClient.interceptors.response.use(
  (response) => response.data,
  async (error) => {
    const originalRequest = error.config;

    // 1. Kiểm tra lỗi 401 và đảm bảo chưa retry lần nào
    if (error.response?.status === 401 && !originalRequest?._retry) {
      // LOG: Để kiểm tra xem code có chạy vào đây không
      console.log('Interceptor: Phát hiện lỗi 401, bắt đầu xử lý...');

      // 2. Trường hợp đang có một request khác đang refresh token
      if (isRefreshing) {
        console.log('Interceptor: Đang refresh, đưa request vào hàng đợi...');
        return new Promise((resolve, reject) => {
          failedQueue.push({ resolve, reject });
        })
          .then((token) => {
            // Cập nhật token mới cho request đang chờ
            if (originalRequest.headers) {
              originalRequest.headers['Authorization'] = 'Bearer ' + token;
            }
            return axiosClient(originalRequest);
          })
          .catch((err) => {
            return Promise.reject(err);
          });
      }

      // 3. Đánh dấu request này là đang retry và bật cờ refreshing
      originalRequest._retry = true;
      isRefreshing = true;

      try {
        const token = sessionService.getToken();

        // Kiểm tra 1: Nếu không có token để gửi đi refresh
        if (!token) {
          console.warn('Interceptor: Không tìm thấy token trong storage => Logout');
          sessionService.clearSession();
          return Promise.reject(error);
        }

        // Gọi API refresh
        // Lưu ý: Đảm bảo URL và Payload đúng với Backend yêu cầu
        const res = await axios.post(`${import.meta.env.VITE_API_URL}/auth/users/refresh`, {
          token,
        });

        // Kiểm tra 2: Log response để xem cấu trúc thực tế (QUAN TRỌNG)
        console.log('Interceptor: Refresh API Response:', res.data);

        // Sử dụng Optional Chaining (?.) để tránh crash code nếu cấu trúc sai
        const newToken = res.data?.result?.token;
        const user = res.data?.result?.user;

        // Kiểm tra 3: Nếu API 200 OK nhưng không có token trong body
        if (!newToken) {
          console.error(
            'Interceptor: API trả về 200 nhưng không tìm thấy token mới trong response'
          );
          // Tùy chọn: Có thể logout hoặc không, nhưng cần return lỗi để biết
          throw new Error('Token structure mismatch');
        }

        sessionService.setSession(newToken, user);

        processQueue(null, newToken);
        isRefreshing = false;

        originalRequest.headers.Authorization = 'Bearer ' + newToken;
        return axiosClient(originalRequest);
      } catch (err) {
        // ...
        sessionService.clearSession(); // Xóa token thường

        // 3. Sử dụng biến đệm để gọi purge
        if (persistorRef) {
          console.log('Purging Redux Persist...');
          await persistorRef.purge(); // Xóa sạch Redux Persist
        }

        window.location.href = '/login';
        return Promise.reject(err);
      }
    }

    // Trả về lỗi nếu không phải 401 hoặc đã retry rồi
    return Promise.reject(error);
  }
);
export default axiosClient;
