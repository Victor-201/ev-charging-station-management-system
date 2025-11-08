import React, { useRef, useEffect } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Platform, Animated } from 'react-native';
import TabBarIcon from './TabBarIcon';
import TabIndicator from './TabIndicator';
import { useTheme } from 'react-native-paper';

const CustomTabBar = ({ state, descriptors, navigation }) => {
  const { colors, dark } = useTheme();
  const slideAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    // Animate the indicator when the active tab changes
    Animated.spring(slideAnim, {
      toValue: state.index * (100 / state.routes.length),
      useNativeDriver: true,
      friction: 8,
      tension: 60,
    }).start();
  }, [state.index, state.routes.length]);

  return (
    <View
      style={[
        styles.tabBar,
        {
          backgroundColor: colors.surface,
        },
      ]}
    >
      <TabIndicator index={state.index} totalTabs={state.routes.length} color={colors.primary} />
      {state.routes.map((route, index) => {
        const { options } = descriptors[route.key];
        const label =
          options.tabBarLabel !== undefined
            ? options.tabBarLabel
            : options.title !== undefined
            ? options.title
            : route.name;

        const isFocused = state.index === index;

        const onPress = () => {
          const event = navigation.emit({
            type: 'tabPress',
            target: route.key,
            canPreventDefault: true,
          });

          if (!isFocused && !event.defaultPrevented) {
            navigation.navigate(route.name);
          }
        };

        return (
          <TouchableOpacity
            key={route.key}
            accessibilityRole="button"
            accessibilityState={isFocused ? { selected: true } : {}}
            accessibilityLabel={options.tabBarAccessibilityLabel}
            testID={options.tabBarTestID}
            onPress={onPress}
            style={styles.tabItem}
          >
            <View style={styles.tabContent}>
              <View style={styles.iconContainer}>
                <TabBarIcon
                  route={route}
                  focused={isFocused}
                  color={isFocused ? colors.onPrimary : colors.onSurfaceVariant}
                />
              </View>
              <Text
                style={[
                  styles.tabLabel,
                  {
                    color: isFocused ? colors.primary : colors.onSurfaceVariant,
                    fontWeight: isFocused ? '700' : '500',
                  },
                ]}
              >
                {label}
              </Text>
            </View>
          </TouchableOpacity>
        );
      })}
    </View>
  );
};

const styles = StyleSheet.create({
  tabBar: {
    flexDirection: 'row',
    paddingBottom: 30,
    height: Platform.OS === 'ios' ? 85 : 70,
    borderTopWidth: 0,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
  },
  tabItem: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'flex-start',
    position: 'relative',
    height: '100%',
    width: `${100 / 5}%`,
  },
  tabContent: {
    alignItems: 'center',
    justifyContent: 'center',
    width: '100%',
    position: 'relative',
  },
  iconContainer: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
    zIndex: 2,
    elevation: 4,
    backgroundColor: 'transparent',
  },
  tabLabel: {
    fontSize: 12,
    textAlign: 'center',
    paddingBottom: Platform.OS === 'ios' ? 2 : 0,
    fontFamily: Platform.OS === 'ios' ? 'System' : 'sans-serif-medium',
  },
});

export default CustomTabBar;
