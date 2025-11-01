// src/components/common/AppButton.jsx
import React from 'react';
import { Button } from 'react-native-paper';

export default function AppButton({ children, onPress, loading, disabled, style, ...rest }) {
  return (
    <Button mode="contained" onPress={onPress} loading={loading} disabled={disabled} uppercase={false} style={style} {...rest}>
      {children}
    </Button>
  );
}
