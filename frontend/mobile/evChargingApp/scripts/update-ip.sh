#!/bin/bash

# Script tự động cập nhật IP cho development
# Fix OAuth timeout khi IP thay đổi

echo "🔧 Đang cập nhật IP address..."
echo ""

# Lấy IP hiện tại (bỏ qua 127.0.0.1 và 169.254.x.x)
CURRENT_IP=$(ifconfig | grep "inet " | grep -v "127.0.0.1" | grep -v "169.254" | head -1 | awk '{print $2}')

if [ -z "$CURRENT_IP" ]; then
    echo "❌ Không tìm thấy IP address!"
    echo "Vui lòng kiểm tra kết nối mạng."
    exit 1
fi

echo "✅ IP hiện tại: $CURRENT_IP"
echo ""

# Kiểm tra backend có đang chạy không
echo "🔍 Kiểm tra backend server..."
if lsof -i :3001 | grep -q LISTEN; then
    echo "✅ Backend đang chạy trên port 3001"
else
    echo "⚠️  Backend không chạy trên port 3001!"
    echo "Vui lòng khởi động backend trước:"
    echo "  cd services/auth-service && docker-compose up"
    exit 1
fi

# Test backend connection
echo ""
echo "🌐 Testing backend connection..."
if curl -s --max-time 2 http://$CURRENT_IP:3001/api/v1/auth/login/oauth > /dev/null 2>&1; then
    echo "✅ Backend accessible từ $CURRENT_IP"
else
    echo "⚠️  Không thể kết nối đến backend qua $CURRENT_IP"
    echo "Backend có thể chỉ listen trên localhost."
fi

echo ""
echo "📝 Đang cập nhật file cấu hình..."

# Backup .env nếu chưa có backup
if [ ! -f ".env.backup" ]; then
    cp .env .env.backup
    echo "📦 Đã tạo backup: .env.backup"
fi

# Cập nhật .env
OLD_IP=$(grep "API_BASE_URL=" .env | sed 's|.*http://\([^:]*\):.*|\1|')
if [ "$OLD_IP" != "$CURRENT_IP" ]; then
    sed -i '' "s|API_BASE_URL=http://.*:3001|API_BASE_URL=http://$CURRENT_IP:3001|g" .env
    echo "✅ Đã cập nhật .env: $OLD_IP → $CURRENT_IP"
else
    echo "ℹ️  .env đã có IP đúng"
fi

# Cập nhật AppDelegate.swift (Metro bundler URL)
APPDELEGATE="ios/evChargingApp/AppDelegate.swift"
if [ -f "$APPDELEGATE" ]; then
    OLD_METRO_IP=$(grep "index.bundle?platform=ios" "$APPDELEGATE" | sed 's|.*http://\([^:]*\):.*|\1|')
    if [ "$OLD_METRO_IP" != "$CURRENT_IP" ]; then
        sed -i '' "s|http://.*:8081/index.bundle|http://$CURRENT_IP:8081/index.bundle|g" "$APPDELEGATE"
        echo "✅ Đã cập nhật AppDelegate.swift: $OLD_METRO_IP → $CURRENT_IP"
    else
        echo "ℹ️  AppDelegate.swift đã có IP đúng"
    fi
fi

echo ""
echo "========================================="
echo "🎉 CẬP NHẬT HOÀN TẤT!"
echo "========================================="
echo ""
echo "IP mới: $CURRENT_IP"
echo "API URL: http://$CURRENT_IP:3001/api/v1"
echo "Metro URL: http://$CURRENT_IP:8081"
echo ""
echo "📋 Bước tiếp theo:"
echo ""
echo "1️⃣  Restart Metro Bundler:"
echo "   pkill -f 'node.*react-native' && yarn start"
echo ""
echo "2️⃣  Rebuild ứng dụng:"
echo "   yarn build:ios:run"
echo ""
echo "3️⃣  Test Facebook Login lại"
echo ""
echo "Hoặc chạy tất cả trong 1 lệnh:"
echo "   yarn dev:device"
echo ""
