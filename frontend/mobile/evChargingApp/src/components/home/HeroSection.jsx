import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Dimensions } from 'react-native';
import { useTheme } from 'react-native-paper';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';

const { width } = Dimensions.get('window');

export default function HeroSection({ user, onFindStation, balance }) {
  const { colors } = useTheme();

  return (
    <View
      style={[styles.container, { backgroundColor: colors.primary }]}
    >
      {/* Welcome Text */}
      <View style={styles.welcomeSection}>
        <Text style={styles.greeting}>Xin chào,</Text>
        <Text style={styles.userName}>{user?.full_name || 'Người dùng'}!</Text>
        <Text style={styles.subtitle}>Sẵn sàng cho hành trình mới</Text>
      </View>

      {/* Balance Card */}
      <View style={[styles.balanceCard, { backgroundColor: 'rgba(255, 255, 255, 0.15)' }]}>
        <View style={styles.balanceHeader}>
          <Icon name="wallet" size={24} color="#fff" />
          <Text style={styles.balanceLabel}>Số dư ví</Text>
        </View>
        <Text style={styles.balanceAmount}>{(balance || 0).toLocaleString()} đ</Text>
        <View style={styles.balanceFooter}>
          <Icon name="arrow-up-circle" size={16} color="#86df20" />
          <Text style={styles.balanceChange}>+12% so với tháng trước</Text>
        </View>
      </View>

      {/* CTA Button */}
      <TouchableOpacity
        style={[styles.ctaButton, { backgroundColor: colors.success }]}
        onPress={onFindStation}
        activeOpacity={0.8}
      >
        <Icon name="map-marker-radius" size={24} color="#fff" />
        <Text style={styles.ctaText}>Tìm trạm sạc gần nhất</Text>
        <Icon name="chevron-right" size={24} color="#fff" />
      </TouchableOpacity>

      {/* Decorative Elements */}
      <View style={[styles.circle, styles.circle1]} />
      <View style={[styles.circle, styles.circle2]} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: 24,
    paddingTop: 40,
    paddingBottom: 32,
    borderBottomLeftRadius: 30,
    borderBottomRightRadius: 30,
    overflow: 'hidden',
  },
  welcomeSection: {
    marginBottom: 24,
  },
  greeting: {
    fontSize: 16,
    color: 'rgba(255, 255, 255, 0.8)',
    fontWeight: '500',
  },
  userName: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#fff',
    marginTop: 4,
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: 'rgba(255, 255, 255, 0.9)',
  },
  balanceCard: {
    padding: 20,
    borderRadius: 20,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.2)',
  },
  balanceHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  balanceLabel: {
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.9)',
    marginLeft: 8,
    fontWeight: '500',
  },
  balanceAmount: {
    fontSize: 36,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 8,
  },
  balanceFooter: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  balanceChange: {
    fontSize: 13,
    color: '#86df20',
    marginLeft: 6,
    fontWeight: '500',
  },
  ctaButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 18,
    borderRadius: 16,
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
  },
  ctaText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#fff',
    marginLeft: 12,
    marginRight: 8,
    flex: 1,
  },
  circle: {
    position: 'absolute',
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 999,
  },
  circle1: {
    width: 200,
    height: 200,
    top: -100,
    right: -50,
  },
  circle2: {
    width: 150,
    height: 150,
    bottom: -75,
    left: -40,
  },
});

