#!/bin/bash

# Script tự động start Metro với network IP cho iOS device testing
# Sử dụng: ./scripts/start-metro-device.sh

echo "🔍 Detecting Mac IP address..."

# Lấy IP của Mac (ưu tiên WiFi, fallback sang Ethernet)
MAC_IP=$(ifconfig | grep "inet " | grep -v 127.0.0.1 | awk '{print $2}' | head -1)

if [ -z "$MAC_IP" ]; then
    echo "❌ Không tìm thấy IP address. Đảm bảo Mac đã kết nối mạng."
    exit 1
fi

echo "✅ Detected IP: $MAC_IP"
echo "📱 iPhone/iPad có thể connect tới Metro tại: http://$MAC_IP:8081"
echo ""
echo "🚀 Starting Metro bundler..."
echo "   Press Ctrl+C to stop"
echo ""

# Start Metro với IP binding
npx react-native start --host "$MAC_IP"
