#!/usr/bin/env python3
"""
Simple HTTP server for testing EV Charging Station User Service
Serves static HTML files for API testing
"""

import http.server
import socketserver
import os
import sys
from pathlib import Path

# Configuration
PORT = 8080
DIRECTORY = Path(__file__).parent

class CORSRequestHandler(http.server.SimpleHTTPRequestHandler):
    """HTTP request handler with CORS support"""
    
    def end_headers(self):
        # Enable CORS for all origins
        self.send_header('Access-Control-Allow-Origin', '*')
        self.send_header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS')
        self.send_header('Access-Control-Allow-Headers', 'Content-Type, Authorization')
        super().end_headers()
    
    def do_OPTIONS(self):
        """Handle OPTIONS request for CORS preflight"""
        self.send_response(200)
        self.end_headers()
    
    def log_message(self, format, *args):
        """Custom log format"""
        sys.stdout.write("[%s] %s\n" % (self.log_date_time_string(), format % args))

def main():
    """Start the HTTP server"""
    os.chdir(DIRECTORY)
    
    print("=" * 60)
    print("🚀 EV Charging Station - Test Web Server (Python)")
    print("=" * 60)
    print(f"✅ Python version: {sys.version.split()[0]}")
    print(f"✅ Server starting at: http://localhost:{PORT}")
    print(f"📁 Serving files from: {DIRECTORY}")
    print()
    print("🔗 Available Pages:")
    print(f"   Main Dashboard:    http://localhost:{PORT}/index.html")
    print(f"   Subscription Test: http://localhost:{PORT}/subscription-test.html")
    print()
    print("🎯 API Endpoints:")
    print("   Auth Service:  http://localhost:3001/api/v1")
    print("   User Service:  http://localhost:3002/api/v1")
    print()
    print("💡 Tips:")
    print("   - Make sure auth-service is running on port 3001")
    print("   - Make sure user-service is running on port 3002")
    print("   - Login first to get JWT token")
    print("   - Use the token in subscription test page")
    print()
    print("Press Ctrl+C to stop the server")
    print("=" * 60)
    print()
    
    try:
        with socketserver.TCPServer(("", PORT), CORSRequestHandler) as httpd:
            httpd.serve_forever()
    except KeyboardInterrupt:
        print("\n\n" + "=" * 60)
        print("🛑 Server stopped")
        print("=" * 60)
        sys.exit(0)
    except OSError as e:
        if e.errno == 10048:  # Port already in use
            print(f"\n❌ ERROR: Port {PORT} is already in use!")
            print(f"   Please close the application using port {PORT} or change PORT in this script.")
        else:
            print(f"\n❌ ERROR: {e}")
        sys.exit(1)

if __name__ == "__main__":
    main()
