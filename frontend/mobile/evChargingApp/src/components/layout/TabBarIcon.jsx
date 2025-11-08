import React, { useEffect, useRef } from 'react';
import { View, Animated } from 'react-native';
import Icon from 'react-native-vector-icons/MaterialIcons';

const TabBarIcon = ({ route, focused, color }) => {
  const scaleAnim = useRef(new Animated.Value(1)).current;
  const opacityAnim = useRef(new Animated.Value(1)).current;
  const translateYAnim = useRef(new Animated.Value(0)).current; 

  let iconName;

  useEffect(() => {
    Animated.parallel([
      Animated.spring(scaleAnim, {
        toValue: focused ? 1.5 : 1,
        useNativeDriver: true,
        friction: 5,
        tension: 40,
      }),
      Animated.timing(opacityAnim, {
        toValue: focused ? 1 : 1,
        duration: 200,
        useNativeDriver: true,
      }),
      Animated.spring(translateYAnim, { 
        toValue: focused ? -5 : 0,
        useNativeDriver: true,
        friction: 5,
        tension: 40,
      }),
    ]).start();
  }, [focused]);

  switch (route.name) {
    case 'Home':
      iconName = 'home';
      break;
    case 'Map':
      iconName = 'map';
      break;
    case 'History':
      iconName = 'history';
      break;
    case 'Wallet':
      iconName = 'account-balance-wallet';
      break;
    case 'Profile':
      iconName = 'person';
      break;
    default:
      iconName = 'circle';
  }

  return (
    <View
      style={{
        alignItems: 'center',
        justifyContent: 'center',
        width: 24,
        height: 24,
      }}
    >
      <Animated.View
        style={{
          transform: [
            { scale: scaleAnim },
            { translateY: translateYAnim },
          ],
          opacity: opacityAnim,
          zIndex: 2,
          width: '100%',
          height: '100%',
          alignItems: 'center',
          justifyContent: 'center',
          shadowColor: '#000',
          shadowOffset: { width: 0, height: 2 },
          shadowOpacity: 0.1,
          shadowRadius: 3,
          elevation: 4,
        }}
      >
        <Icon name={iconName} size={22} color={color} />
      </Animated.View>
    </View>
  );
};

export default TabBarIcon;
