import React, { useEffect, useRef } from 'react';
import { View, Text, StyleSheet, Animated } from 'react-native';
import { useTheme } from 'react-native-paper';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';

export default function ChargingCompleteHeader() {
  const { colors } = useTheme();
  const scaleAnim = useRef(new Animated.Value(0.5)).current;
  const opacityAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.sequence([
      Animated.spring(scaleAnim, {
        toValue: 1,
        tension: 40,
        friction: 5,
        useNativeDriver: true,
      }),
      Animated.timing(opacityAnim, {
        toValue: 1,
        duration: 400,
        useNativeDriver: true,
      }),
    ]).start();
  }, []);

  return (
    <View style={[styles.header, { backgroundColor: colors.success }]}>
      <Animated.View style={{ transform: [{ scale: scaleAnim }] }}>
        <Icon name="check-decagram" size={80} color="#fff" />
      </Animated.View>
      <Animated.View style={{ opacity: opacityAnim }}>
        <Text style={styles.title}>Sạc Hoàn Tất</Text>
        <Text style={styles.subtitle}>Cảm ơn bạn đã sử dụng dịch vụ của chúng tôi!</Text>
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  header: {
    alignItems: 'center',
    paddingVertical: 32,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#fff',
    marginTop: 16,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 16,
    color: 'rgba(255,255,255,0.8)',
    marginTop: 4,
    textAlign: 'center',
  },
});

