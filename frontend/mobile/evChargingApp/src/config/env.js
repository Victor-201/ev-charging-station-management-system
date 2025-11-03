// Use Mac's local IP address so iPhone can connect to backend running in Docker
// Change this to your Mac's IP address (run: ifconfig | grep "inet " | grep -v 127.0.0.1)
export const API_BASE_URL = 'http://192.168.1.32:3001/api/v1'; // auth-service port
export const GOOGLE_WEB_CLIENT_ID = '<GOOGLE_WEB_CLIENT_ID>'; // replace with web client id
export const FACEBOOK_APP_ID = '<FB_APP_ID>'; // replace with facebook app id
