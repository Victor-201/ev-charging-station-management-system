import React from 'react';
import { View } from 'react-native';
import { TextInput, HelperText } from 'react-native-paper';
import { theme } from '../../config/theme';

export default function AppInput({ label, error, ...props }) {
  return (
    <View style={{ width: '100%', marginVertical: 8 }}>
      <TextInput
        label={label}
        mode="outlined"
        outlineColor={theme.colors.brand200}
        activeOutlineColor={theme.colors.primary}
        textColor={theme.colors.onSurface}
        {...props}
      />
      {error && <HelperText type="error" visible>{error}</HelperText>}
    </View>
  );
}
