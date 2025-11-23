// src/components/common/SkeletonLoader.jsx
import { useEffect, useRef } from 'react';
import { View, Animated, StyleSheet, Platform } from 'react-native';
import { useTheme } from 'react-native-paper';

/**
 * SkeletonLoader - Animated loading placeholder with shimmer effect
 * 
 * @param {Object} props
 * @param {number} props.width - Width of skeleton (default: '100%')
 * @param {number} props.height - Height of skeleton (default: 20)
 * @param {number} props.borderRadius - Border radius (default: 8)
 * @param {Object} props.style - Additional styles
 */
const SkeletonLoader = ({
  width = '100%',
  height = 20,
  borderRadius = 8,
  style,
}) => {
  const { colors } = useTheme();
  const shimmerAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    // Only animate on iOS for performance
    if (Platform.OS === 'ios') {
      Animated.loop(
        Animated.sequence([
          Animated.timing(shimmerAnim, {
            toValue: 1,
            duration: 1000,
            useNativeDriver: true,
          }),
          Animated.timing(shimmerAnim, {
            toValue: 0,
            duration: 1000,
            useNativeDriver: true,
          }),
        ])
      ).start();
    }
  }, []);

  const opacity = shimmerAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [0.3, 0.7],
  });

  const styles = StyleSheet.create({
    skeleton: {
      backgroundColor: colors.surfaceVariant,
      width,
      height,
      borderRadius,
    },
  });

  return (
    <Animated.View
      style={[
        styles.skeleton,
        Platform.OS === 'ios' && { opacity },
        style,
      ]}
    />
  );
};

/**
 * SkeletonCard - Pre-configured skeleton for card layouts
 */
export const SkeletonCard = () => {
  const { colors } = useTheme();

  return (
    <View
      style={{
        backgroundColor: colors.surface,
        padding: 16,
        borderRadius: 12,
        marginBottom: 16,
      }}
    >
      <View style={{ flexDirection: 'row', alignItems: 'center' }}>
        <SkeletonLoader width={48} height={48} borderRadius={24} />
        <View style={{ flex: 1, marginLeft: 12 }}>
          <SkeletonLoader width="70%" height={18} style={{ marginBottom: 8 }} />
          <SkeletonLoader width="50%" height={14} />
        </View>
      </View>
      <View style={{ marginTop: 12 }}>
        <SkeletonLoader width="100%" height={12} style={{ marginBottom: 6 }} />
        <SkeletonLoader width="80%" height={12} />
      </View>
    </View>
  );
};

/**
 * SkeletonList - Multiple skeleton cards
 */
export const SkeletonList = ({ count = 3 }) => {
  return (
    <View style={{ padding: 16 }}>
      {Array.from({ length: count }).map((_, index) => (
        <SkeletonCard key={index} />
      ))}
    </View>
  );
};

export default SkeletonLoader;

