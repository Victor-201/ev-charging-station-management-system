import React from 'react';
import { Button } from 'react-native-paper';
import { theme } from '../../config/theme';

export default function AppButton({ children, onPress, loading, disabled, style, ...rest }) {
  return (
    <Button
      mode="contained"
      onPress={onPress}
      loading={loading}
      disabled={disabled}
      uppercase={false}
      buttonColor={theme.colors.primary}
      textColor={theme.colors.onPrimary}
      style={[{ borderRadius: 8, paddingVertical: 6 }, style]}
      {...rest}
    >
      {children}
    </Button>
  );
}
