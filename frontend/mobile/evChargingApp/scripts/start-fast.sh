#!/bin/bash

# Script to start Metro bundler with optimizations for faster startup

echo "🚀 Starting Metro bundler with optimizations..."

# Get local IP
LOCAL_IP=$(ifconfig | grep "inet " | grep -v 127.0.0.1 | awk '{print $2}' | head -n 1)
echo "📱 Device IP: $LOCAL_IP"

# Export Metro host for device connection
export RCT_METRO_HOST=$LOCAL_IP
export RCT_METRO_PORT=8081

# Start Metro with cache enabled and optimizations
npx react-native start \
  --port 8081 \
  --host $LOCAL_IP \
  --max-workers 4
