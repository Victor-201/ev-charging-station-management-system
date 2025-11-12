import { MD3LightTheme as DefaultTheme, configureFonts } from 'react-native-paper';
import { Platform } from 'react-native';

// Configure fonts for better cross-platform consistency
const fontConfig = {
  web: {
    regular: {
      fontFamily: 'system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
      fontWeight: '400',
    },
    medium: {
      fontFamily: 'system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
      fontWeight: '500',
    },
    light: {
      fontFamily: 'system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
      fontWeight: '300',
    },
    thin: {
      fontFamily: 'system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
      fontWeight: '100',
    },
  },
  ios: {
    regular: {
      fontFamily: 'System',
      fontWeight: '400',
    },
    medium: {
      fontFamily: 'System',
      fontWeight: '500',
    },
    light: {
      fontFamily: 'System',
      fontWeight: '300',
    },
    thin: {
      fontFamily: 'System',
      fontWeight: '100',
    },
  },
  android: {
    regular: {
      fontFamily: 'sans-serif',
      fontWeight: 'normal',
    },
    medium: {
      fontFamily: 'sans-serif-medium',
      fontWeight: 'normal',
    },
    light: {
      fontFamily: 'sans-serif-light',
      fontWeight: 'normal',
    },
    thin: {
      fontFamily: 'sans-serif-thin',
      fontWeight: 'normal',
    },
  },
};

export const theme = {
  ...DefaultTheme,
  fonts: configureFonts({ config: fontConfig }),
  colors: {
    ...DefaultTheme.colors,

    // === Màu chủ đạo (thiên về xanh nước biển) ===
    primary: '#002682',
    onPrimary: '#FFFFFF',
    secondary: '#1E45B5',
    accent: '#4A6CFF',

    // === Màu nền & bề mặt ===
    background: '#FFFFFF',
    surface: '#E5ECFF',
    onBackground: '#00103dff',
    onSurface: '#000c29ff',

    // === Màu trạng thái ===
    error: '#f60d01',
    success: '#86df20',
    warning: '#f2ae14',

    // === Màu brand (gradient scale) ===
    brand50:  '#E5ECFF',
    brand100: '#B3C3FF',
    brand200: '#8099FF',
    brand300: '#4A6CFF',
    brand400: '#1E45B5',
    brand500: '#002682',
    brand600: '#001F6B',
    brand700: '#001653',

    // === Màu chữ phụ & chữ mờ ===
    onSurfaceVariant: '#8A93B9', // chữ phụ, mô tả, text ít quan trọng, placeholder, disabled text
  },
};
