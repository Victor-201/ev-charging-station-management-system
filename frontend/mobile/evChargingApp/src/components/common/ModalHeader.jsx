// src/components/common/ModalHeader.jsx
import { View, Text, TouchableOpacity, StyleSheet, Platform } from 'react-native';
import { useTheme } from 'react-native-paper';
import Icon from 'react-native-vector-icons/MaterialIcons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

/**
 * ModalHeader - iOS-style modal header with drag indicator and close button
 * 
 * @param {Object} props
 * @param {string} props.title - Header title
 * @param {Function} props.onClose - Close handler
 * @param {boolean} props.showDragIndicator - Show drag indicator (default: true on iOS)
 * @param {boolean} props.showCloseButton - Show close button (default: true)
 */
const ModalHeader = ({
  title,
  onClose,
  showDragIndicator = Platform.OS === 'ios',
  showCloseButton = true,
}) => {
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();

  const styles = StyleSheet.create({
    container: {
      paddingTop: Math.max(insets.top, 8),
      backgroundColor: colors.background,
      borderBottomWidth: 1,
      borderBottomColor: colors.outline + '30',
    },
    dragIndicatorContainer: {
      alignItems: 'center',
      paddingVertical: 8,
    },
    dragIndicator: {
      width: 36,
      height: 5,
      borderRadius: 3,
      backgroundColor: colors.onSurfaceVariant + '40',
    },
    headerContent: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      paddingHorizontal: 16,
      paddingVertical: 12,
      minHeight: 56,
    },
    title: {
      fontSize: 20,
      fontWeight: '600',
      color: colors.onSurface,
      flex: 1,
      textAlign: 'center',
    },
    closeButton: {
      position: 'absolute',
      right: 16,
      width: 32,
      height: 32,
      borderRadius: 16,
      backgroundColor: colors.surfaceVariant,
      alignItems: 'center',
      justifyContent: 'center',
    },
    placeholder: {
      width: 32,
    },
  });

  return (
    <View style={styles.container}>
      {showDragIndicator && (
        <View style={styles.dragIndicatorContainer}>
          <View style={styles.dragIndicator} />
        </View>
      )}
      <View style={styles.headerContent}>
        <View style={styles.placeholder} />
        <Text style={styles.title} numberOfLines={1}>
          {title}
        </Text>
        {showCloseButton && onClose && (
          <TouchableOpacity
            style={styles.closeButton}
            onPress={onClose}
            accessibilityLabel="Đóng"
            accessibilityRole="button"
          >
            <Icon name="close" size={20} color={colors.onSurfaceVariant} />
          </TouchableOpacity>
        )}
        {!showCloseButton && <View style={styles.placeholder} />}
      </View>
    </View>
  );
};

export default ModalHeader;

