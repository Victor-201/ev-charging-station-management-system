# EV Admin Dashboard (Frontend)

Giao diện quản trị hệ thống trạm sạc EV được xây dựng bằng **React + Vite + Tailwind CSS**. Mục tiêu là tái hiện mockup quản trị với hệ màu teal như hình tham chiếu.

## Chuẩn bị môi trường

- Node.js 18+ (khuyến nghị 20)
- npm hoặc pnpm/yarn (hướng dẫn dưới đây dùng npm)

## Cài đặt

```bash
npm install
```

## Chạy ở chế độ phát triển

```bash
npm run dev
```

Server mặc định chạy tại `http://localhost:5173`.

## Build production

```bash
npm run build
```

### Cấu trúc thư mục chính

```text
src/
  components/   // Sidebar, Navbar, Card, các UI dùng chung
  layout/       // AdminLayout bao quanh mọi trang
  pages/        // Overview, Stations, Pricing, Users, Reports
  routes/       // Định nghĩa route + meta
  App.jsx       // Khởi tạo router
  main.jsx      // Entry point React
  index.css     // Tailwind + custom utilities
```

## Hệ màu

Các tone màu teal được định nghĩa trong `tailwind.config.js`:

| Token       | Mã HEX |
| ----------- | ------ |
| `ev-black`  | `#000000` |
| `ev-gunmetal` | `#001A1A` |
| `ev-deep`   | `#004D4D` |
| `ev-teal`   | `#008080` |
| `ev-cyan`   | `#00B3B3` |
| `ev-ice`    | `#00E6E6` |
| `ev-sky`    | `#1AFFFF` |

## Ghi chú triển khai

- Các block nội dung (`panel`) dùng `@apply` để tái sử dụng border + blur nhẹ.
- Placeholder biểu đồ/báo cáo đã sẵn layout, khi cần chỉ việc nhúng component chart thực tế.
- Router mặc định chuyển hướng `/` về `/overview`.
