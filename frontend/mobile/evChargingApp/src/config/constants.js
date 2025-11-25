export const APP_NAME = 'EV Charging App';

// Storage keys
export const STORAGE_KEYS = {
  ACCESS_TOKEN: 'ev_access_token',
  REFRESH_TOKEN: 'ev_refresh_token',
  REMEMBER_EMAIL: 'ev_remember_email',
};

// Geolocation constants
export const GEOLOCATION = {
  ENABLE_HIGH_ACCURACY: true,
  TIMEOUT: 10000, // milliseconds
  MAXIMUM_AGE: 5000, // milliseconds
  DEFAULT_LATITUDE: 10.77978,
  DEFAULT_LONGITUDE: 106.699,
  DEFAULT_LATITUDE_DELTA: 0.05,
  DEFAULT_LONGITUDE_DELTA: 0.05,
  SEARCH_RADIUS_KM: 5,
  INITIAL_ZOOM_LEVEL: 13,
};

// Animation & timing constants
export const TIMING = {
  DEBOUNCE_DELAY: 500, // milliseconds
  MAP_ANIMATION_DURATION: 1000, // milliseconds
  SHEET_ANIMATION_DURATION: 300, // milliseconds
  API_TIMEOUT: 15000, // milliseconds
  SOCKET_RECONNECTION_ATTEMPTS: 5,
  GEOLOCATION_TIMEOUT: 10000, // milliseconds
};

// Map configuration
export const MAP_CONFIG = {
  MIN_ZOOM: 10,
  MAX_ZOOM: 19,
  OSMAP_URL: 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png',
};

// API endpoint constants
export const API_ENDPOINTS = {
  AUTH: {
    REGISTER: '/auth/register',
    LOGIN: '/auth/login',
    LOGOUT: '/auth/logout',
    REFRESH_TOKEN: '/auth/refresh-token',
    GOOGLE: '/auth/google',
    FACEBOOK: '/auth/facebook',
  },
  USERS: {
    PROFILE: '/users/profile',
    LIST: '/users',
  },
  STATIONS: {
    SEARCH: '/stations/search',
    NEARBY: '/stations/nearby',
    DETAIL: '/stations/:id',
  },
};

// Station status constants
export const STATION_STATUS = {
  ONLINE: 'online',
  OFFLINE: 'offline',
  MAINTENANCE: 'maintenance',
};

// Station port status constants
export const PORT_STATUS = {
  AVAILABLE: 'available',
  IN_USE: 'in_use',
  RESERVED: 'reserved',
  MAINTENANCE: 'maintenance',
};

// UI pagination constants
export const PAGINATION = {
  DEFAULT_PAGE_SIZE: 20,
  MAX_PAGE_SIZE: 100,
  INITIAL_PAGE: 0,
};

export default {
  APP_NAME,
  STORAGE_KEYS,
  GEOLOCATION,
  TIMING,
  MAP_CONFIG,
  API_ENDPOINTS,
  STATION_STATUS,
  PORT_STATUS,
  PAGINATION,
};
