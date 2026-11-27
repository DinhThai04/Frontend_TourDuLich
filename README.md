# SGU Tour — Frontend

## Giới thiệu

SGU Tour là website đặt tour du lịch tại Việt Nam, phục vụ khách hàng tìm kiếm hành trình, lựa chọn lịch khởi hành, đặt chỗ và theo dõi thanh toán. Repository này cung cấp giao diện khách hàng và hệ thống quản trị, kết nối với các API của [SGU Tour Backend](https://github.com/DinhThai04/Backend_TourDuLich).

Các chức năng chính:

- Khám phá điểm đến, tìm và lọc tour theo địa điểm, ngày khởi hành và ngân sách; xem lịch trình, giá và số chỗ còn lại.
- Đăng ký, đăng nhập bằng tài khoản hoặc Google; quản lý thông tin cá nhân.
- Nhập thông tin hành khách, đặt tour, xem hạn giữ chỗ, thanh toán VNPay sandbox và xem biên nhận.
- Theo dõi lịch sử đặt tour, gửi yêu cầu dời lịch và phản hồi đề xuất từ đơn vị tổ chức.
- Sử dụng trợ lý AI để tìm tour, tham khảo chính sách và tra cứu đơn đặt tour của tài khoản.
- Quản trị tour, lịch trình, lịch khởi hành, giá, hình ảnh, tài khoản, vai trò, đánh giá và đối soát thanh toán theo quyền được cấp.

## Công nghệ

| Thành phần | Công nghệ | Vai trò |
|---|---|---|
| Giao diện | React 19 | Xây dựng giao diện theo component |
| Ngôn ngữ | TypeScript 5.8 | Khai báo kiểu dữ liệu và kiểm tra hợp đồng phía client |
| Công cụ phát triển | Vite 7 | Dev server, xử lý tài nguyên và build ứng dụng |
| Điều hướng | React Router 7 | Quản lý route khách hàng, tài khoản và quản trị |
| Trạng thái | Redux Toolkit 2, React Redux 9, Redux Persist 6 | Quản lý trạng thái ứng dụng và cơ chế lưu trạng thái |
| Thành phần giao diện | Ant Design 5 | Form, bảng, modal, lịch và thông báo |
| Định dạng giao diện | Tailwind CSS 4, CSS | Bố cục, responsive, theme và chuyển động |
| Gọi API | Axios 1 | HTTP client và xử lý phiên đăng nhập |
| Đăng nhập | Google OAuth, jwt-decode 4 | Tích hợp Google Sign-In và đọc thông tin token phía client |
| Thời gian thực | Socket.IO Client 4 | Nhận cập nhật đánh giá tour |
| Ngày giờ | Day.js 1 | Xử lý và định dạng ngày tháng |
| Trình chiếu và biểu tượng | React Slick, Ant Design Icons, Lucide React | Các dải nội dung và hệ thống biểu tượng |
| Kiểm tra mã | ESLint 9, TypeScript, Node test runner | Lint, kiểm tra kiểu và chạy test |
| Đóng gói và phục vụ | Docker, Nginx | Build image và phục vụ frontend trong hệ thống Compose |

Phiên bản dependency được khai báo trong [package.json](package.json) và khóa tại [package-lock.json](package-lock.json).

`overrides` trong package.json giữ `path-to-regexp` ở bản vá 8.4.0 cho `@ant-design/pro-layout`. Giữ cấu hình này khi cập nhật dependency cho đến khi thư viện cha sử dụng phiên bản đã vá tương ứng. Plugin Vite và Tailwind thuộc dependency phát triển; image Nginx chỉ chứa bản build tĩnh.

## Khởi chạy

### Cách 1: Docker Compose

Thực hiện [Khởi chạy — Cách 1 trong README backend](https://github.com/DinhThai04/Backend_TourDuLich#cách-1-chạy-toàn-bộ-bằng-docker-compose).

### Cách 2: npm

Yêu cầu Node.js `^20.19.0 || >=22.12.0`, npm và backend hoạt động qua gateway tại `http://localhost:8888`. Chạy tại thư mục `Frontend_TourDuLich`:

```bash
npm ci
npm run dev
```

Truy cập **http://localhost:5173**.

## Cấu hình

Ứng dụng có các giá trị mặc định để phát triển tại localhost. Khi cần thay đổi, sao chép [.env.example](.env.example) thành `.env` tại thư mục frontend và chỉnh các biến tương ứng.

| Biến | Giá trị mặc định | Ý nghĩa |
|---|---|---|
| `VITE_API_URL` | `/api/v1` | Đường dẫn gốc của API; dev server proxy `/api` tới gateway 8888 |
| `VITE_PAGE_SIZE` | `10` | Kích thước trang mặc định khi tìm và liệt kê tour |
| `VITE_GOOGLE_CLIENT_ID` | Không đặt | Client ID để hiển thị và sử dụng Google Sign-In; phải khớp cấu hình auth_service |
| `VITE_SOCKET_URL` | Cùng origin website, qua Vite proxy trong dev | Địa chỉ kết nối Socket.IO; chỉ ghi đè khi dùng địa chỉ triển khai khác |
| `VITE_VNPAY_ALLOWED_HOSTS` | `sandbox.vnpayment.vn,pay.vnpayment.vn` | Danh sách host VNPay mà frontend cho phép chuyển hướng thanh toán |

Vite đọc các biến `VITE_*` khi khởi động dev server hoặc build và đưa chúng vào mã phía trình duyệt. Sau khi đổi `.env`, khởi động lại dev server hoặc build lại ứng dụng. Chỉ đặt cấu hình công khai ở frontend; JWT signing key, Groq, Cloudinary và SMTP secret thuộc backend.

Proxy phát triển được khai báo trong [vite.config.ts](vite.config.ts). Khi thay địa chỉ website, cần đồng bộ return URL VNPay và OAuth origin tương ứng ở cấu hình backend/nhà cung cấp.

## Kiểm thử

```bash
npm test
npm run lint
npm audit
```

- `npm test`: chạy các bộ test bằng Node test runner, gồm xử lý phiên đăng nhập, quyền truy cập, hợp đồng dữ liệu, tìm kiếm, đặt tour và trợ lý AI.
- `npm run lint`: kiểm tra quy tắc TypeScript/React bằng ESLint.
- `npm audit`: đối chiếu dependency đã khóa với advisory registry; dùng thêm `npm audit --omit=dev` để xem riêng dependency runtime. Cần phân biệt cảnh báo công cụ build/lint với đường chạy thực tế của website.

Các bài test này kiểm tra logic phía client; xác minh hành trình đặt tour và thanh toán cần thực hiện thêm với backend và môi trường sandbox.

Trước khi commit, kiểm tra cả diff, file mới và nội dung đã stage. Các biến `VITE_*` xuất hiện trong mã build công khai; không sử dụng chúng để lưu API secret. Khi có Gitleaks, chạy `gitleaks git --pre-commit --staged --redact=100 .` để kiểm tra index và `gitleaks git --log-opts="--all" --redact=100 .` để kiểm tra lịch sử. Index rỗng không phải bằng chứng toàn bộ repository sạch.

### Smoke test quản trị

Chạy trên stack kiểm thử có dữ liệu mẫu. Đặt `SGU_BROWSER_BASE_URL`, `SGU_BROWSER_ADMIN_EMAIL`
và `SGU_BROWSER_ADMIN_PASSWORD` cho tài khoản quản trị kiểm thử.

- `node scripts/admin-api-smoke.cjs` kiểm tra API. Script tạo và dọn dữ liệu mẫu, đồng thời chỉnh rồi khôi phục một bảng giá.
- `node scripts/browser-admin-regression.cjs` kiểm tra các thao tác trên trình duyệt. Cài Playwright bằng
  `npm install --no-save --package-lock=false playwright` rồi chạy `npx playwright install chromium` trước khi chạy script.

## Build

```bash
npm run build
```

Lệnh chạy kiểm tra TypeScript và tạo bản build trong `dist/`. Thư mục này chứa HTML, CSS, JavaScript và các tài nguyên tĩnh để phục vụ qua web server.

Có thể kiểm tra bản build cục bộ bằng:

```bash
npm run preview
```

Vite phục vụ `dist/` tại **http://localhost:4173**. Lệnh preview dùng để kiểm tra bản build, không thay thế web server triển khai và các API backend.

## Docker

[Dockerfile](Dockerfile) sử dụng hai giai đoạn:

1. **Node.js:** cài dependency từ lockfile, chạy build và tạo `dist/`.
2. **Nginx:** phục vụ nội dung `dist/`, xử lý route SPA và proxy request tới backend.

[nginx.conf](nginx.conf) chuyển `/api/` tới gateway và `/socket.io/` tới auth_service. Nhờ đó, website và API sử dụng cùng origin khi chạy bằng Compose. Container frontend được đặt trong mạng hệ thống thông qua Compose ở repository backend.

Các biến Vite cần có ở **thời điểm build**. Compose truyền `GOOGLE_CLIENT_ID` thành build argument `VITE_GOOGLE_CLIENT_ID`; khi đổi client ID, cần build lại image frontend. Đặt biến môi trường cho container Nginx sau khi image đã build không thay đổi nội dung JavaScript đã tạo.

## Cấu trúc mã nguồn

```text
src/
├── api/          # HTTP client và Socket.IO
├── assets/       # Ảnh, logo và tài nguyên giao diện
├── components/   # Thành phần giao diện theo tính năng
├── config/       # Theme và quy tắc truy cập
├── layouts/      # Bố cục trang và các luồng giao diện
├── pages/        # Trang khách hàng, tài khoản và quản trị
├── routes/       # Khai báo route và guard
├── services/     # Hàm gọi API theo nghiệp vụ
├── store/        # Redux store và slices
├── types/        # Kiểu dữ liệu
└── utils/        # Hàm xử lý dùng chung
```

## Tài liệu liên quan

- [Backend: khởi chạy và cấu hình](https://github.com/DinhThai04/Backend_TourDuLich)
- [Kiến trúc hệ thống](https://github.com/DinhThai04/Backend_TourDuLich/blob/main/docs/PROJECT.md)
- [Database và tài khoản trình diễn](https://github.com/DinhThai04/Backend_TourDuLich/blob/main/data_seed/README.md)
- [Trợ lý AI](https://github.com/DinhThai04/Backend_TourDuLich/blob/main/ai_service/README.md)
- [Email và n8n](https://github.com/DinhThai04/Backend_TourDuLich/blob/main/docs/mail/README.md)
