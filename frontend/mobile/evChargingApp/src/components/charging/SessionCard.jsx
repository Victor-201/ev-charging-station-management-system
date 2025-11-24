import React, { useRef, useEffect } from 'react';
import { View, StyleSheet, Animated, TouchableOpacity, Platform } from 'react-native';
import { Card, Text, IconButton, useTheme } from 'react-native-paper';

const getStyles = (colors) => StyleSheet.create({
  card: {
    marginBottom: 16,
    backgroundColor: colors.surface,
    overflow: 'hidden',
  },
  cardContent: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
  },
  iconContainer: {
    marginRight: 12,
  },
  icon: {
    backgroundColor: colors.primary + '20',
  },
  detailsContainer: {
    flex: 1,
  },
  title: {
    fontSize: 18,
    fontWeight: 'bold',
    color: colors.onSurface,
  },
  date: {
    fontSize: 14,
    color: colors.onSurface + '90',
    marginBottom: 8,
  },
  statsRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  statItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginRight: 16,
  },
  statIcon: {
    margin: 0,
    marginRight: 4,
  },
  statText: {
    fontSize: 14,
    fontWeight: '500',
    color: colors.onSurface,
  },
  chevronContainer: {
    justifyContent: 'center',
  },
});

const SessionCard = ({ session, onPress }) => {
  const { colors } = useTheme();
  const styles = getStyles(colors);

  // Animation values
  const scaleAnim = useRef(new Animated.Value(1)).current;
  const pressAnim = useRef(new Animated.Value(1)).current;

  if (!session) return null;

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    try {
      const options = { year: 'numeric', month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit' };
      return new Date(dateString).toLocaleDateString('vi-VN', options);
    } catch (error) {
      return 'N/A';
    }
  };

  const stationName = session.station_name || session.stationName || 'Trạm sạc';
  const startTime = session.start_time || session.startTime || session.created_at;
  const energyConsumed = session.energy_consumed || session.energyConsumed || 0;
  const cost = session.cost || session.total_cost || session.totalCost || 0;

  // iOS-style press animation
  const handlePressIn = () => {
    if (Platform.OS === 'ios') {
      Animated.spring(pressAnim, {
        toValue: 0.96,
        tension: 300,
        friction: 20,
        useNativeDriver: true,
      }).start();
    }
  };

  const handlePressOut = () => {
    if (Platform.OS === 'ios') {
      Animated.spring(pressAnim, {
        toValue: 1,
        tension: 300,
        friction: 20,
        useNativeDriver: true,
      }).start();
    }
  };

  return (
    <Animated.View
      style={{
        transform: [{ scale: pressAnim }],
      }}
    >
      <Card
        style={styles.card}
        onPress={onPress}
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
      >
        <View style={styles.cardContent}>
          <View style={styles.iconContainer}>
            <IconButton
              icon="history"
              size={32}
              color={colors.primary}
              style={styles.icon}
            />
          </View>
          <View style={styles.detailsContainer}>
            <Text style={styles.title}>{stationName}</Text>
            <Text style={styles.date}>{formatDate(startTime)}</Text>
            <View style={styles.statsRow}>
              <View style={styles.statItem}>
                <IconButton icon="flash" size={16} color={colors.onSurface + '80'} style={styles.statIcon} />
                <Text style={styles.statText}>{energyConsumed.toFixed(2)} kWh</Text>
              </View>
              <View style={styles.statItem}>
                <IconButton icon="cash" size={16} color={colors.onSurface + '80'} style={styles.statIcon} />
                <Text style={styles.statText}>{cost.toLocaleString('vi-VN')} ₫</Text>
              </View>
            </View>
          </View>
          <View style={styles.chevronContainer}>
            <IconButton
              icon="chevron-right"
              size={28}
              color={colors.onSurface + '40'}
            />
          </View>
        </View>
      </Card>
    </Animated.View>
  );
};

export default SessionCard;

