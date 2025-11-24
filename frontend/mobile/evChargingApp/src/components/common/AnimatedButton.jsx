// src/components/common/AnimatedButton.jsx
import React, { useRef } from 'react';
import { TouchableOpacity, Animated, Platform, StyleSheet } from 'react-native';
import ReactNativeHapticFeedback from 'react-native-haptic-feedback';

/**
 * AnimatedButton - A button with iOS-style press animations and haptic feedback
 * 
 * @param {Object} props
 * @param {Function} props.onPress - Press handler
 * @param {React.ReactNode} props.children - Button content
 * @param {Object} props.style - Additional styles
 * @param {boolean} props.disabled - Whether button is disabled
 * @param {boolean} props.enableHaptic - Enable haptic feedback (default: true)
 * @param {number} props.scaleValue - Scale value when pressed (default: 0.96)
 */
const AnimatedButton = ({
  onPress,
  children,
  style,
  disabled = false,
  enableHaptic = true,
  scaleValue = 0.96,
  ...rest
}) => {
  const scaleAnim = useRef(new Animated.Value(1)).current;

  const handlePressIn = () => {
    if (Platform.OS === 'ios' && !disabled) {
      Animated.spring(scaleAnim, {
        toValue: scaleValue,
        tension: 300,
        friction: 20,
        useNativeDriver: true,
      }).start();

      // Haptic feedback
      if (enableHaptic) {
        ReactNativeHapticFeedback.trigger('impactLight', {
          enableVibrateFallback: false,
          ignoreAndroidSystemSettings: false,
        });
      }
    }
  };

  const handlePressOut = () => {
    if (Platform.OS === 'ios' && !disabled) {
      Animated.spring(scaleAnim, {
        toValue: 1,
        tension: 300,
        friction: 20,
        useNativeDriver: true,
      }).start();
    }
  };

  const handlePress = () => {
    if (!disabled && onPress) {
      onPress();
    }
  };

  return (
    <Animated.View
      style={[
        {
          transform: [{ scale: scaleAnim }],
        },
        disabled && styles.disabled,
      ]}
    >
      <TouchableOpacity
        onPress={handlePress}
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
        disabled={disabled}
        activeOpacity={0.8}
        style={style}
        {...rest}
      >
        {children}
      </TouchableOpacity>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  disabled: {
    opacity: 0.5,
  },
});

export default AnimatedButton;

