import { MD3LightTheme as DefaultTheme } from 'react-native-paper';

export const theme = {
  ...DefaultTheme,
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
