// src/utils/animations.js
import { Animated, LayoutAnimation, Platform, UIManager } from 'react-native';

// Enable LayoutAnimation on Android
if (Platform.OS === 'android' && UIManager.setLayoutAnimationEnabledExperimental) {
  UIManager.setLayoutAnimationEnabledExperimental(true);
}

/**
 * iOS-style spring animation configuration
 * Matches Apple's default spring animation parameters
 */
export const IOSSpringConfig = {
  tension: 300,
  friction: 30,
  useNativeDriver: true,
};

/**
 * Smooth easing configuration for iOS-like animations
 */
export const IOSEasingConfig = {
  duration: 350,
  useNativeDriver: true,
};

/**
 * Quick animation for micro-interactions
 */
export const QuickSpringConfig = {
  tension: 400,
  friction: 25,
  useNativeDriver: true,
};

/**
 * Preset LayoutAnimation configurations for iOS-style animations
 */
export const LayoutAnimations = {
  // Smooth spring animation for list items
  spring: {
    duration: 400,
    create: {
      type: LayoutAnimation.Types.spring,
      property: LayoutAnimation.Properties.opacity,
      springDamping: 0.7,
    },
    update: {
      type: LayoutAnimation.Types.spring,
      springDamping: 0.7,
    },
    delete: {
      type: LayoutAnimation.Types.spring,
      property: LayoutAnimation.Properties.opacity,
      springDamping: 0.7,
    },
  },

  // Gentle fade for subtle changes
  fade: {
    duration: 300,
    create: {
      type: LayoutAnimation.Types.easeInEaseOut,
      property: LayoutAnimation.Properties.opacity,
    },
    update: {
      type: LayoutAnimation.Types.easeInEaseOut,
    },
    delete: {
      type: LayoutAnimation.Types.easeInEaseOut,
      property: LayoutAnimation.Properties.opacity,
    },
  },

  // Slide up animation for new items
  slideUp: {
    duration: 350,
    create: {
      type: LayoutAnimation.Types.easeInEaseOut,
      property: LayoutAnimation.Properties.scaleY,
    },
    update: {
      type: LayoutAnimation.Types.easeInEaseOut,
    },
  },
};

/**
 * Fade in animation
 * @param {Animated.Value} animatedValue - The animated value to use
 * @param {number} duration - Animation duration in ms
 * @param {number} delay - Delay before animation starts in ms
 */
export const fadeIn = (animatedValue, duration = 300, delay = 0) => {
  return Animated.timing(animatedValue, {
    toValue: 1,
    duration,
    delay,
    useNativeDriver: true,
  });
};

/**
 * Fade out animation
 */
export const fadeOut = (animatedValue, duration = 300, delay = 0) => {
  return Animated.timing(animatedValue, {
    toValue: 0,
    duration,
    delay,
    useNativeDriver: true,
  });
};

/**
 * Slide up animation
 */
export const slideUp = (animatedValue, duration = 350, delay = 0) => {
  return Animated.timing(animatedValue, {
    toValue: 0,
    duration,
    delay,
    useNativeDriver: true,
  });
};

/**
 * Scale animation
 */
export const scale = (animatedValue, toValue = 1, duration = 300, delay = 0) => {
  return Animated.spring(animatedValue, {
    toValue,
    ...IOSSpringConfig,
  });
};

/**
 * Staggered animation for list items
 * @param {Array<Animated.Value>} animations - Array of animations to stagger
 * @param {number} staggerDelay - Delay between each animation in ms
 */
export const staggerAnimation = (animations, staggerDelay = 50) => {
  return Animated.stagger(staggerDelay, animations);
};

/**
 * Parallel animation
 */
export const parallel = (animations) => {
  return Animated.parallel(animations);
};

/**
 * Sequence animation
 */
export const sequence = (animations) => {
  return Animated.sequence(animations);
};

