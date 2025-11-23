import React, { createContext, useCallback, useContext, useMemo, useRef, useState } from 'react';
import { Animated, Easing, PanResponder, Platform, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Icon from 'react-native-vector-icons/MaterialIcons';
import { useTheme } from 'react-native-paper';

const InAppNotificationContext = createContext({
  show: (_opts) => {},
  hide: () => {},
});

export const useInAppNotification = () => useContext(InAppNotificationContext);

const getStyles = (colors) => StyleSheet.create({
  container: { position: 'absolute', top: 0, left: 0, right: 0, zIndex: 9999, elevation: 10 },
  banner: { marginHorizontal: 12, borderRadius: 14, backgroundColor: colors.surface, flexDirection: 'row', alignItems: 'center', padding: 12, shadowColor: '#000', shadowOpacity: 0.15, shadowRadius: 8, shadowOffset: { width: 0, height: 3 }, elevation: 6 },
  iconWrap: { width: 36, height: 36, borderRadius: 8, alignItems: 'center', justifyContent: 'center', marginRight: 10, backgroundColor: colors.primary },
  title: { color: colors.onSurface, fontWeight: '700', fontSize: 15 },
  message: { color: colors.onSurfaceVariant, marginTop: 2, fontSize: 13 },
  close: { marginLeft: 8 },
});

export function InAppNotificationProvider({ children }) {
  const { colors } = useTheme();
  const styles = getStyles(colors);
  const insets = useSafeAreaInsets();

  const [visible, setVisible] = useState(false);
  const [options, setOptions] = useState({ title: '', message: '', icon: 'bolt', type: 'info', duration: 3500 });

  const translateY = useRef(new Animated.Value(-140)).current;
  const hideTimer = useRef(null);

  const clearTimer = () => { if (hideTimer.current) { clearTimeout(hideTimer.current); hideTimer.current = null; } };

  const hide = useCallback(() => {
    clearTimer();
    Animated.timing(translateY, { toValue: -160, duration: 250, easing: Easing.out(Easing.quad), useNativeDriver: true }).start(() => setVisible(false));
  }, [translateY]);

  const show = useCallback((opts = {}) => {
    clearTimer();
    const next = {
      title: opts.title || 'Thông báo',
      message: opts.message || '',
      icon: opts.icon || (opts.type === 'success' ? 'check-circle' : opts.type === 'error' ? 'error' : 'notifications'),
      type: opts.type || 'info',
      duration: Number.isFinite(opts.duration) ? opts.duration : 3500,
    };
    setOptions(next);
    setVisible(true);
    translateY.setValue(-160);
    Animated.timing(translateY, { toValue: insets.top + 8, duration: 260, easing: Easing.out(Easing.cubic), useNativeDriver: true }).start();
    hideTimer.current = setTimeout(() => hide(), next.duration);
  }, [hide, insets.top, translateY]);

  const panResponder = useMemo(() => PanResponder.create({
    onStartShouldSetPanResponder: () => true,
    onMoveShouldSetPanResponder: (_, g) => Math.abs(g.dy) > 4,
    onPanResponderMove: Animated.event([null, { dy: translateY }], { useNativeDriver: false }),
    onPanResponderRelease: (_, gesture) => {
      if (gesture.dy < -20) hide(); else Animated.spring(translateY, { toValue: insets.top + 8, useNativeDriver: true }).start();
    },
  }), [hide, insets.top, translateY]);

  const value = useMemo(() => ({ show, hide }), [show, hide]);

  return (
    <InAppNotificationContext.Provider value={value}>
      {children}
      {visible && (
        <Animated.View style={[styles.container, { transform: [{ translateY }] }]} pointerEvents="box-none">
          <View style={[styles.banner]} {...panResponder.panHandlers}>
            <View style={styles.iconWrap}>
              <Icon name={options.icon} size={18} color={colors.onPrimary} />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.title} numberOfLines={1}>{options.title}</Text>
              {!!options.message && <Text style={styles.message} numberOfLines={2}>{options.message}</Text>}
            </View>
            <TouchableOpacity onPress={hide} accessibilityLabel="Đóng thông báo" style={styles.close}>
              <Icon name="close" size={18} color={colors.onSurfaceVariant} />
            </TouchableOpacity>
          </View>
        </Animated.View>
      )}
    </InAppNotificationContext.Provider>
  );
}

