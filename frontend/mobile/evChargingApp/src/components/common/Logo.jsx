import React from 'react';
import { View, Image, StyleSheet } from 'react-native';
import { theme } from '../../config/theme';

const Logo = ({ style }) => {
  return (
    <View style={[styles.container, style]}>
      <Image
        source={require('../../../assets/images/logo.png')}
        style={styles.image}
        resizeMode="contain"
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: theme.colors.background,
    padding: 8,
    borderRadius: 999, // Làm cho container hoàn toàn tròn
    alignItems: 'center',
    justifyContent: 'center',
    aspectRatio: 1, // Đảm bảo container luôn là hình vuông
    elevation: 2, // cho Android
    shadowColor: theme.colors.onBackground,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4, // cho iOS
    overflow: 'hidden', // Đảm bảo logo không tràn ra ngoài vòng tròn
  },
  image: {
    width: 45,
    height: 45,
  },
});

export default Logo;
