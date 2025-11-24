// src/components/common/EnhancedRefreshControl.jsx
import { RefreshControl, Platform } from 'react-native';
import { useTheme } from 'react-native-paper';
import ReactNativeHapticFeedback from 'react-native-haptic-feedback';
import { useRef } from 'react';

/**
 * EnhancedRefreshControl - RefreshControl with haptic feedback
 * 
 * @param {Object} props
 * @param {boolean} props.refreshing - Whether refresh is in progress
 * @param {Function} props.onRefresh - Refresh handler
 * @param {boolean} props.enableHaptic - Enable haptic feedback (default: true on iOS)
 */
const EnhancedRefreshControl = ({
  refreshing,
  onRefresh,
  enableHaptic = Platform.OS === 'ios',
  ...rest
}) => {
  const { colors } = useTheme();
  const lastRefreshing = useRef(refreshing);

  // Trigger haptic when refresh starts
  if (enableHaptic && refreshing && !lastRefreshing.current) {
    ReactNativeHapticFeedback.trigger('impactLight', {
      enableVibrateFallback: false,
      ignoreAndroidSystemSettings: false,
    });
  }
  
  lastRefreshing.current = refreshing;

  return (
    <RefreshControl
      refreshing={refreshing}
      onRefresh={onRefresh}
      colors={[colors.primary]}
      tintColor={colors.primary}
      progressBackgroundColor={colors.surface}
      {...rest}
    />
  );
};

export default EnhancedRefreshControl;

