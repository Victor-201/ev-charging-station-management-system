import { MD3LightTheme as DefaultTheme } from 'react-native-paper';

export const theme = {
  ...DefaultTheme,
  colors: {
    ...DefaultTheme.colors,

    // === Màu chủ đạo (thiên về xanh nước biển) ===
    primary: '#002682',        // màu chính
    onPrimary: '#FFFFFF',      // chữ hiển thị trên nền primary
    secondary: '#1E45B5',      // xanh biển nhạt hơn
    accent: '#4A6CFF',         // xanh biển sáng hơn, dùng làm điểm nhấn

    // === Màu nền & bề mặt ===
    background: '#FFFFFF',
    surface: '#FFFFFF',
    onBackground: '#000000',
    onSurface: '#000000',

    // === Màu trạng thái ===
    error: '#f60d01',          // đỏ cảnh báo lỗi
    success: '#86df20',        // xanh lá – trạng thái thành công
    warning: '#f2ae14',        // vàng cảnh báo

    // === Màu brand (gradient scale) ===
    brand50:  '#E5ECFF',
    brand100: '#B3C3FF',
    brand200: '#8099FF',
    brand300: '#4A6CFF',
    brand400: '#1E45B5',
    brand500: '#002682',
    brand600: '#001F6B',
    brand700: '#001653',
  },
};
