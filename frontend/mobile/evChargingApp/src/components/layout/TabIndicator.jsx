import React, { useEffect, useRef } from 'react';
import { Animated, StyleSheet, Dimensions, Platform } from 'react-native';
import { useTheme } from 'react-native-paper';

const windowWidth = Dimensions.get('window').width;
const TAB_WIDTH = windowWidth / 5; 

const TabIndicator = ({ index }) => {
  const { colors } = useTheme();
  const translateX = useRef(new Animated.Value(0)).current;
  const scaleAnim = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.spring(translateX, {
        toValue: index * TAB_WIDTH,
        useNativeDriver: true,
        friction: 10,
        tension: 50,
      }),
      Animated.sequence([
        Animated.timing(scaleAnim, {
          toValue: 0.8,
          duration: 50,
          useNativeDriver: true,
        }),
        Animated.spring(scaleAnim, {
          toValue: 1,
          friction: 10,
          tension: 50,
          useNativeDriver: true,
        }),
      ]),
    ]).start();
  }, [index]);

  return (
    <Animated.View
      style={[
        styles.container,
        {
          transform: [{ translateX }, { scale: scaleAnim }],
        },
      ]}
    >
      <Animated.View
        style={[
          styles.indicator,
          { 
            backgroundColor: colors.primary,
            outlineColor: colors.surface,
         },
        ]}
      />
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    top: Platform.OS === 'ios' ? 13 : 10,
    width: TAB_WIDTH,
    height: 0,
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 0,
  },
  indicator: {
    width: 50,
    height: 50,
    borderRadius: 25,
    outlineWidth: 10,
  },
});

export default TabIndicator;
