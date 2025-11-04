#!/bin/bash

# Script khởi động Metro và update AppDelegate với IP tự động
# Sử dụng: yarn dev:device

echo "🔍 Detecting Mac IP address..."

# Lấy IP của Mac
MAC_IP=$(ifconfig | grep "inet " | grep -v 127.0.0.1 | awk '{print $2}' | head -1)

if [ -z "$MAC_IP" ]; then
    echo "❌ Không tìm thấy IP address. Đảm bảo Mac đã kết nối mạng."
    exit 1
fi

echo "✅ Detected IP: $MAC_IP"

# Update AppDelegate.swift với IP mới (nếu khác)
APPDELEGATE_PATH="ios/evChargingApp/AppDelegate.swift"

if [ -f "$APPDELEGATE_PATH" ]; then
    # Tìm và thay thế IP trong AppDelegate
    if grep -q "http://[0-9]*\.[0-9]*\.[0-9]*\.[0-9]*:8081" "$APPDELEGATE_PATH"; then
        # Có IP cũ, replace
        sed -i '' "s|http://[0-9]*\.[0-9]*\.[0-9]*\.[0-9]*:8081|http://$MAC_IP:8081|g" "$APPDELEGATE_PATH"
        echo "📝 Updated AppDelegate.swift with new IP"
    else
        echo "ℹ️  AppDelegate using dynamic IP detection"
    fi
fi

echo "📱 iPhone/iPad sẽ connect tới: http://$MAC_IP:8081"
echo ""
echo "🚀 Starting Metro bundler..."
echo "   Sau khi Metro chạy, mở Xcode và build app (⌘R)"
echo "   Press Ctrl+C to stop"
echo ""

# Start Metro
npx react-native start --host "$MAC_IP"
