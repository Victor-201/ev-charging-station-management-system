# Hướng dẫn tối ưu tốc độ khởi động App

## 🚀 Các phương pháp tối ưu

### **Phương pháp 1: Sử dụng Metro với Cache (Nhanh hơn 30-40%)**

Sử dụng Metro bundler được tối ưu với cache:

```bash
npm run start:fast
```

**Ưu điểm:**
- ✅ Cache được lưu lại giữa các lần chạy
- ✅ Không cần rebuild toàn bộ mỗi lần
- ✅ Chạy song song với 4 workers
- ✅ Vẫn có thể hot reload khi code

**Khuyên dùng:** Khi đang phát triển và cần hot reload

---

### **Phương pháp 2: Pre-build Bundle (Nhanh nhất - 0 giây khởi động!)**

Build sẵn bundle một lần, sau đó app khởi động ngay lập tức:

```bash
# Bước 1: Build bundle (chỉ cần làm 1 lần hoặc khi code thay đổi)
npm run build:ios

# Bước 2: Chạy app từ Xcode hoặc
npx react-native run-ios --device
```

**Ưu điểm:**
- ✅ Khởi động SIÊU NHANH - không cần Metro
- ✅ Không cần kết nối WiFi cùng Mac
- ✅ App chạy độc lập như production
- ✅ Tiết kiệm pin Mac (không chạy Metro)

**Nhược điểm:**
- ❌ Không có hot reload
- ❌ Mỗi lần sửa code phải rebuild bundle

**Khuyên dùng:** 
- Khi test chức năng đã hoàn thiện
- Khi di chuyển xa Mac
- Khi demo cho khách hàng

---

### **Phương pháp 3: Metro thông thường**

```bash
npm start
# hoặc
npm run start:device
```

---

## 📊 So sánh thời gian khởi động

| Phương pháp | Lần đầu | Lần sau | Hot Reload |
|-------------|---------|---------|------------|
| Metro thường | 30-45s | 25-40s | ✅ |
| Metro + Cache (start:fast) | 25-35s | 10-20s | ✅ |
| Pre-built Bundle | 5-10s | **1-3s** | ❌ |

---

## 🔧 Các tối ưu đã áp dụng

### 1. **Metro Config Optimization**
- ✅ Bật caching với `.metro-cache`
- ✅ Tăng số workers lên 4
- ✅ Bỏ qua các thư mục không cần thiết
- ✅ Minification config

### 2. **Watchman Optimization**
- ✅ Ignore các thư mục build, node_modules, Pods
- ✅ Giảm số file cần theo dõi

### 3. **AppDelegate Smart Bundle Loading**
- ✅ Tự động dùng pre-built bundle nếu có
- ✅ Fallback về Metro nếu không có bundle

---

## 💡 Tips thêm

### Xóa cache khi cần:
```bash
# Xóa Metro cache
rm -rf .metro-cache

# Reset Metro cache và start lại
npm run start:cache
```

### Rebuild bundle khi code thay đổi nhiều:
```bash
npm run build:ios
```

### Kiểm tra tốc độ build:
```bash
time npm run build:ios
```

---

## 🎯 Workflow khuyên dùng

### Khi đang develop:
1. Dùng `npm run start:fast` để có cache
2. Hot reload khi sửa code nhỏ
3. Sau mỗi 10-15 lần sửa, restart Metro để tránh cache bloat

### Khi test:
1. Build bundle: `npm run build:ios`
2. Test trên device không cần Metro
3. Khi cần sửa, quay lại develop mode

### Khi demo:
1. Build bundle production
2. Archive app trong Xcode
3. Install file .ipa lên device

---

## ⚠️ Lưu ý

- Pre-built bundle chỉ hoạt động trong DEBUG mode với config hiện tại
- Nếu thấy app không cập nhật code mới, xóa bundle cũ:
  ```bash
  rm ios/main.jsbundle
  rm -rf ios/assets
  ```
- Metro cache được lưu tại `.metro-cache/` (đã ignore git)
