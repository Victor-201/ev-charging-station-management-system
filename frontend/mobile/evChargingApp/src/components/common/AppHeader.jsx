import React from 'react';
import { Appbar, useTheme } from 'react-native-paper';
import { Platform } from 'react-native';

export default function AppHeader({ title = '', onBack, right = null }) {
  const { colors } = useTheme();
  const canGoBack = typeof onBack === 'function';

  return (
    <Appbar.Header
      mode="small"
      statusBarHeight={Platform.select({ ios: 44, android: 0 })}
      elevated
      style={{ backgroundColor: colors.background }}
    >
      {canGoBack ? (
        <Appbar.BackAction color={colors.onSurface} onPress={onBack} />
      ) : null}
      <Appbar.Content title={title} titleStyle={{ color: colors.onSurface, fontWeight: '700' }} />
      {right}
    </Appbar.Header>
  );
}

