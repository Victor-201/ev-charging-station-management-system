#!/usr/bin/env python3
"""
Simple HTTP Server for Auth Service Test UI
"""
import http.server
import socketserver
import os

PORT = 8080
DIRECTORY = os.path.dirname(os.path.abspath(__file__))

class MyHTTPRequestHandler(http.server.SimpleHTTPRequestHandler):
    def __init__(self, *args, **kwargs):
        super().__init__(*args, directory=DIRECTORY, **kwargs)
    
    def end_headers(self):
        # Enable CORS
        self.send_header('Access-Control-Allow-Origin', '*')
        self.send_header('Access-Control-Allow-Methods', 'GET, POST, OPTIONS')
        self.send_header('Access-Control-Allow-Headers', 'Content-Type')
        super().end_headers()

if __name__ == '__main__':
    with socketserver.TCPServer(("", PORT), MyHTTPRequestHandler) as httpd:
        print("""
╔═══════════════════════════════════════════════╗
║   🚀 Auth Service Test UI Server              ║
╠═══════════════════════════════════════════════╣
║   URL: http://localhost:{}                   ║
║   Open this URL in your browser               ║
║   Press Ctrl+C to stop                        ║
╚═══════════════════════════════════════════════╝
        """.format(PORT))
        
        try:
            httpd.serve_forever()
        except KeyboardInterrupt:
            print("\n\n🛑 Server stopped")
