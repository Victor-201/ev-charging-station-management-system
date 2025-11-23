// src/components/common/AnimatedFAB.jsx
import { useRef } from 'react';
import { TouchableOpacity, Animated, Platform, StyleSheet } from 'react-native';
import { useTheme } from 'react-native-paper';
import Icon from 'react-native-vector-icons/MaterialIcons';
import ReactNativeHapticFeedback from 'react-native-haptic-feedback';

/**
 * AnimatedFAB - Floating Action Button with iOS-style animations and haptic feedback
 * 
 * @param {Object} props
 * @param {string} props.icon - Material icon name
 * @param {Function} props.onPress - Press handler
 * @param {string} props.accessibilityLabel - Accessibility label
 * @param {string} props.accessibilityHint - Accessibility hint
 * @param {Object} props.style - Additional styles
 */
const AnimatedFAB = ({
  icon,
  onPress,
  accessibilityLabel,
  accessibilityHint,
  style,
}) => {
  const { colors } = useTheme();
  const scaleAnim = useRef(new Animated.Value(1)).current;

  const handlePressIn = () => {
    if (Platform.OS === 'ios') {
      Animated.spring(scaleAnim, {
        toValue: 0.9,
        tension: 300,
        friction: 20,
        useNativeDriver: true,
      }).start();
    }
  };

  const handlePressOut = () => {
    if (Platform.OS === 'ios') {
      Animated.spring(scaleAnim, {
        toValue: 1,
        tension: 300,
        friction: 20,
        useNativeDriver: true,
      }).start();
    }
  };

  const handlePress = () => {
    // Haptic feedback
    if (Platform.OS === 'ios') {
      ReactNativeHapticFeedback.trigger('impactLight', {
        enableVibrateFallback: false,
        ignoreAndroidSystemSettings: false,
      });
    }
    
    if (onPress) {
      onPress();
    }
  };

  const styles = StyleSheet.create({
    fab: {
      backgroundColor: colors.surface,
      padding: 12,
      borderRadius: 24,
      elevation: 3,
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.25,
      shadowRadius: 3.84,
    },
  });

  return (
    <Animated.View
      style={{
        transform: [{ scale: scaleAnim }],
      }}
    >
      <TouchableOpacity
        style={[styles.fab, style]}
        onPress={handlePress}
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
        accessibilityLabel={accessibilityLabel}
        accessibilityHint={accessibilityHint}
        accessibilityRole="button"
      >
        <Icon name={icon} size={22} color={colors.accent} />
      </TouchableOpacity>
    </Animated.View>
  );
};

export default AnimatedFAB;

