# SGU Tour — Frontend

Giao diện khách hàng và quản trị SGU Tour: tìm tour, đặt chỗ, thanh toán VNPay sandbox, quản lý tài khoản và tư vấn AI. Ứng dụng hướng tới laptop/PC; luồng MoMo chưa tích hợp đầy đủ.

Công nghệ chính: React 19, TypeScript, Vite 7, Ant Design, Redux Toolkit và Tailwind CSS.

## Cài đặt và chạy

Yêu cầu Node.js tương thích Vite 7 (`^20.19.0 || >=22.12.0`) và npm. Backend cùng database phải được cấu hình theo [hướng dẫn hệ thống](../Backend_TourDuLich/docs/PROJECT.md).

Tại thư mục frontend, chạy bằng PowerShell:

```powershell
npm ci
if (-not (Test-Path -LiteralPath .env)) { Copy-Item .env.example .env }
# Điền cấu hình cục bộ trước khi chạy:
npm run dev
```

Mở `http://localhost:5173`. Cổng frontend phải khớp return URL VNPay trong backend; không tự dùng cổng khác khi 5173 đang bị chiếm.

## Cấu hình

| Biến | Giá trị / mục đích |
|---|---|
| `VITE_API_URL` | `/api/v1`; dev proxy `/api` tới gateway `http://localhost:8888` |
| `VITE_PAGE_SIZE` | `10`; số dòng mỗi trang danh sách |
| `VITE_GOOGLE_CLIENT_ID` | Client ID khi dùng Google Sign-In |
| `VITE_SOCKET_URL` | Dev: `http://localhost:8099`; production để trống để dùng cùng origin |
| `VITE_VNPAY_ALLOWED_HOSTS` | Host được phép redirect: `sandbox.vnpayment.vn,pay.vnpayment.vn` |

Đổi cấu hình cần restart dev server hoặc build lại. **Mọi biến `VITE_*` đều có thể xuất hiện trong trình duyệt**, không đặt khóa bí mật của Groq, SMTP, Cloudinary hay API nội bộ vào đây; không commit file chứa bí mật.

## Kiểm tra và build

```powershell
npm run lint
npm test
npm run build
npm run preview
```

Build kiểm tra TypeScript và xuất `dist/`. Test dùng Node test runner, không thay thế kiểm thử E2E với backend và VNPay. Giữ `package-lock.json` để `npm ci` cài đúng dependency.

## Docker

Dockerfile build ứng dụng rồi phục vụ bằng Nginx; Nginx xử lý route SPA, proxy `/api/` tới gateway và `/socket.io/` tới auth service.

Dùng compose trong repo backend cạnh frontend để chạy cả hệ thống. Cấu hình `VITE_*` phải có **lúc build**, không phải lúc chạy container Nginx; Google Client ID được truyền qua build arg từ `GOOGLE_CLIENT_ID` của compose.

## Tài liệu liên quan

- [Kiến trúc, backend và cách chạy Docker](../Backend_TourDuLich/docs/PROJECT.md)
- [Database và tài khoản demo](../Backend_TourDuLich/data_seed/README.md)
- [AI](../Backend_TourDuLich/docs/ai/README.md) · [Email/n8n](../Backend_TourDuLich/docs/mail/README.md)
