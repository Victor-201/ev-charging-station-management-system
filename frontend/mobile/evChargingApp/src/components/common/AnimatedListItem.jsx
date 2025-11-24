// src/components/common/AnimatedListItem.jsx
import React, { useEffect, useRef } from 'react';
import { Animated, Platform } from 'react-native';
import { fadeIn, slideUp } from '../../utils/animations';

/**
 * AnimatedListItem - A wrapper component that animates list items on mount
 * Provides fade-in and slide-up animations for a polished iOS feel
 * 
 * @param {Object} props
 * @param {React.ReactNode} props.children - The content to animate
 * @param {number} props.index - The index of the item in the list (for stagger effect)
 * @param {number} props.delay - Base delay before animation starts (default: 0)
 * @param {number} props.staggerDelay - Delay multiplier per index (default: 50ms)
 * @param {boolean} props.enableSlide - Enable slide up animation (default: true)
 * @param {Object} props.style - Additional styles to apply
 */
const AnimatedListItem = ({
  children,
  index = 0,
  delay = 0,
  staggerDelay = 50,
  enableSlide = true,
  style,
}) => {
  const opacity = useRef(new Animated.Value(0)).current;
  const translateY = useRef(new Animated.Value(enableSlide ? 20 : 0)).current;

  useEffect(() => {
    // Only animate on iOS for better performance
    if (Platform.OS !== 'ios') {
      opacity.setValue(1);
      translateY.setValue(0);
      return;
    }

    const totalDelay = delay + (index * staggerDelay);

    // Run animations in parallel for smooth effect
    Animated.parallel([
      fadeIn(opacity, 350, totalDelay),
      enableSlide ? slideUp(translateY, 350, totalDelay) : null,
    ].filter(Boolean)).start();
  }, [index, delay, staggerDelay, enableSlide]);

  // Skip animation wrapper on Android for performance
  if (Platform.OS !== 'ios') {
    return children;
  }

  return (
    <Animated.View
      style={[
        {
          opacity,
          transform: [{ translateY }],
        },
        style,
      ]}
    >
      {children}
    </Animated.View>
  );
};

export default AnimatedListItem;

