import React, { useState, useEffect } from 'react';
import { View, StyleSheet, Animated, Dimensions } from 'react-native';
import { Text, Card, ProgressBar, useTheme } from 'react-native-paper';
import MaterialIcons from 'react-native-vector-icons/MaterialIcons';

const { width } = Dimensions.get('window');

const ChargingProgress = ({ 
  currentEnergy = 0, 
  targetEnergy = 100, 
  chargingRate = 0, 
  estimatedTime = 0,
  batteryLevel = 0,
  status = 'CHARGING'
}) => {
  const { colors } = useTheme();
  const styles = getStyles(colors);
  const [animatedValue] = useState(new Animated.Value(0));

  // Calculate progress percentage
  const progress = targetEnergy > 0 ? Math.min(currentEnergy / targetEnergy, 1) : 0;

  useEffect(() => {
    Animated.timing(animatedValue, {
      toValue: progress,
      duration: 1000,
      useNativeDriver: false,
    }).start();
  }, [progress, animatedValue]);

  const formatTime = (minutes) => {
    if (!minutes || minutes <= 0) return '-- phút';
    const hours = Math.floor(minutes / 60);
    const mins = Math.round(minutes % 60);
    if (hours > 0) {
      return `${hours}h ${mins}m`;
    }
    return `${mins} phút`;
  };

  const getStatusIcon = () => {
    switch (status) {
      case 'CHARGING':
        return 'flash-on';
      case 'PAUSED':
        return 'pause-circle';
      case 'COMPLETED':
        return 'check-circle';
      case 'ERROR':
        return 'error';
      default:
        return 'flash-on';
    }
  };

  const getStatusColor = () => {
    switch (status) {
      case 'CHARGING':
        return colors.success;
      case 'PAUSED':
        return colors.warning;
      case 'COMPLETED':
        return colors.primary;
      case 'ERROR':
        return colors.error;
      default:
        return colors.success;
    }
  };

  return (
    <Card style={styles.card}>
      <Card.Content style={styles.content}>
        {/* Status Header */}
        <View style={styles.statusHeader}>
          <MaterialIcons 
            name={getStatusIcon()} 
            size={32} 
            color={getStatusColor()} 
          />
          <Text style={[styles.statusText, { color: getStatusColor() }]}>
            {status === 'CHARGING' ? 'Đang sạc' : 
             status === 'PAUSED' ? 'Tạm dừng' :
             status === 'COMPLETED' ? 'Hoàn thành' : 'Lỗi'}
          </Text>
        </View>

        {/* Battery Visual */}
        <View style={styles.batteryContainer}>
          <View style={styles.batteryOutline}>
            <Animated.View 
              style={[
                styles.batteryFill,
                {
                  width: animatedValue.interpolate({
                    inputRange: [0, 1],
                    outputRange: ['0%', '100%'],
                  }),
                  backgroundColor: getStatusColor(),
                }
              ]} 
            />
            <View style={styles.batteryTip} />
          </View>
          <Text style={styles.batteryPercentage}>
            {Math.round(batteryLevel)}%
          </Text>
        </View>

        {/* Progress Bar */}
        <View style={styles.progressContainer}>
          <Text style={styles.progressLabel}>Tiến độ sạc</Text>
          <ProgressBar 
            progress={progress} 
            color={getStatusColor()}
            style={styles.progressBar}
          />
          <Text style={styles.progressText}>
            {currentEnergy.toFixed(1)} / {targetEnergy.toFixed(1)} kWh
          </Text>
        </View>

        {/* Stats Grid */}
        <View style={styles.statsGrid}>
          <View style={styles.statItem}>
            <MaterialIcons name="speed" size={24} color={colors.onSurface} />
            <Text style={styles.statLabel}>Tốc độ sạc</Text>
            <Text style={styles.statValue}>{chargingRate.toFixed(1)} kW</Text>
          </View>
          
          <View style={styles.statItem}>
            <MaterialIcons name="schedule" size={24} color={colors.onSurface} />
            <Text style={styles.statLabel}>Thời gian còn lại</Text>
            <Text style={styles.statValue}>{formatTime(estimatedTime)}</Text>
          </View>
        </View>
      </Card.Content>
    </Card>
  );
};

const getStyles = (colors) => StyleSheet.create({
  card: {
    backgroundColor: colors.surface,
    marginBottom: 16,
  },
  content: {
    padding: 20,
  },
  statusHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 24,
  },
  statusText: {
    fontSize: 20,
    fontWeight: 'bold',
    marginLeft: 8,
  },
  batteryContainer: {
    alignItems: 'center',
    marginBottom: 24,
  },
  batteryOutline: {
    width: width * 0.6,
    height: 40,
    borderWidth: 3,
    borderColor: colors.onSurface + '40',
    borderRadius: 8,
    position: 'relative',
    overflow: 'hidden',
    backgroundColor: colors.background,
  },
  batteryFill: {
    height: '100%',
    borderRadius: 4,
  },
  batteryTip: {
    position: 'absolute',
    right: -8,
    top: '25%',
    width: 6,
    height: '50%',
    backgroundColor: colors.onSurface + '40',
    borderTopRightRadius: 3,
    borderBottomRightRadius: 3,
  },
  batteryPercentage: {
    fontSize: 24,
    fontWeight: 'bold',
    marginTop: 12,
    color: colors.onSurface,
  },
  progressContainer: {
    marginBottom: 24,
  },
  progressLabel: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 8,
    color: colors.onSurface,
  },
  progressBar: {
    height: 8,
    borderRadius: 4,
    marginBottom: 8,
  },
  progressText: {
    fontSize: 14,
    textAlign: 'center',
    color: colors.onSurface + '80',
  },
  statsGrid: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  statItem: {
    alignItems: 'center',
    flex: 1,
  },
  statLabel: {
    fontSize: 12,
    color: colors.onSurface + '80',
    marginTop: 4,
    textAlign: 'center',
  },
  statValue: {
    fontSize: 16,
    fontWeight: 'bold',
    color: colors.onSurface,
    marginTop: 2,
  },
});

export default ChargingProgress;
