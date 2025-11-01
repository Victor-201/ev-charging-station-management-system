// src/components/common/AppInput.jsx
import React from 'react';
import { View } from 'react-native';
import { TextInput, HelperText } from 'react-native-paper';

export default function AppInput({ label, error, ...props }) {
  return (
    <View style={{ width: '100%', marginVertical: 6 }}>
      <TextInput label={label} mode="outlined" {...props} />
      {error ? <HelperText type="error">{error}</HelperText> : null}
    </View>
  );
}
