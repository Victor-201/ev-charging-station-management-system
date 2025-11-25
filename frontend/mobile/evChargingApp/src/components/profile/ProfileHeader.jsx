import React, { useEffect, useRef } from 'react';
import { View, StyleSheet, TouchableOpacity, Animated } from 'react-native';
import { Avatar, Text, useTheme } from 'react-native-paper';
import { scale, fadeIn } from '../../utils/animations';
import { getAvatarData } from '../../utils/avatarUtils';

export default function ProfileHeader({ user, onAvatarPress }) {
  const { colors } = useTheme();
  const opacity = useRef(new Animated.Value(0)).current;
  const avatarScale = useRef(new Animated.Value(0.9)).current;

  useEffect(() => {
    Animated.parallel([fadeIn(opacity, 400, 80), scale(avatarScale, 1, 500)]).start();
  }, []);

  const { initials, backgroundColor, textColor } = getAvatarData(user?.full_name || 'User', colors);

  return (
    <Animated.View style={[styles.container, { opacity }]}>
      <TouchableOpacity onPress={onAvatarPress} activeOpacity={0.8}>
        <Animated.View style={{ transform: [{ scale: avatarScale }] }}>
          {user?.avatar_url ? (
            <Avatar.Image size={96} source={{ uri: user.avatar_url }} style={styles.avatar} />
          ) : (
            <Avatar.Text size={96} label={initials} style={[styles.avatar, { backgroundColor }]} color={textColor} />
          )}
        </Animated.View>
      </TouchableOpacity>
      <Text style={[styles.userName, { color: colors.onSurface }]} numberOfLines={1}>
        {user?.full_name || 'User Name'}
      </Text>
      <Text style={[styles.userEmail, { color: colors.onSurfaceVariant }]} numberOfLines={1}>
        {user?.email || ''}
      </Text>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: { alignItems: 'center', paddingVertical: 24, paddingHorizontal: 16 },
  avatar: { marginBottom: 12 },
  userName: { fontSize: 22, fontWeight: '700', marginBottom: 4 },
  userEmail: { fontSize: 14 },
});

