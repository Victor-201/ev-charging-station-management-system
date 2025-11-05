// metro.config.js
const { getDefaultConfig, mergeConfig } = require('@react-native/metro-config');

const config = {
  // Tăng tốc độ bundling
  transformer: {
    // Bật minification để giảm kích thước bundle
    minifierConfig: {
      keep_classnames: true,
      keep_fnames: true,
      mangle: {
        keep_classnames: true,
        keep_fnames: true,
      },
    },
  },
  // Tối ưu resolver để tìm modules nhanh hơn
  resolver: {
    // Chỉ xử lý những file cần thiết
    sourceExts: ['jsx', 'js', 'ts', 'tsx', 'json'],
    // Bỏ qua các thư mục không cần thiết
    blockList: [
      /node_modules\/.*\/__(tests|mocks|fixtures)__\/.*/,
    ],
  },
  // Tăng số lượng workers để build song song
  maxWorkers: 4,
};

module.exports = mergeConfig(getDefaultConfig(__dirname), config);
