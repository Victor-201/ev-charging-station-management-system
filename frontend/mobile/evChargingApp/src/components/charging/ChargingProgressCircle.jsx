import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { useTheme } from 'react-native-paper';
import Svg, { Circle } from 'react-native-svg';

const ChargingProgressCircle = ({ 
  size = 250, 
  strokeWidth = 20, 
  progress = 0, // 0 to 1
  soc = 0, // State of Charge (battery level)
  power = 0, // kW
}) => {
  const { colors } = useTheme();
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference * (1 - progress);

  return (
    <View style={[styles.container, { width: size, height: size }]}>
      <Svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
        {/* Background Circle */}
        <Circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke={colors.surface}
          strokeWidth={strokeWidth}
        />
        {/* Progress Circle */}
        <Circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke={colors.primary}
          strokeWidth={strokeWidth}
          strokeDasharray={circumference}
          strokeDashoffset={strokeDashoffset}
          strokeLinecap="round"
          transform={`rotate(-90 ${size / 2} ${size / 2})`}
        />
      </Svg>
      <View style={styles.centerContent}>
        <Text style={[styles.soc, { color: colors.primary }]}>{`${Math.round(soc)}%`}</Text>
        <Text style={[styles.power, { color: colors.onSurface }]}>{`${power.toFixed(1)} kW`}</Text>
        <Text style={[styles.status, { color: colors.onSurfaceVariant }]}>Đang sạc</Text>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  centerContent: {
    position: 'absolute',
    justifyContent: 'center',
    alignItems: 'center',
  },
  soc: {
    fontSize: 56,
    fontWeight: 'bold',
  },
  power: {
    fontSize: 20,
    fontWeight: '600',
    marginTop: 4,
  },
  status: {
    fontSize: 14,
    fontWeight: '500',
    marginTop: 4,
    textTransform: 'uppercase',
  },
});

export default ChargingProgressCircle;

