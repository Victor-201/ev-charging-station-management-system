import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import Icon from 'react-native-vector-icons/MaterialIcons';
import { useTheme } from 'react-native-paper';
import Logo from '../common/Logo';

export default function Header({ user, onLogout }) {
  const { colors } = useTheme();

  return (
    <View style={[styles.header, { backgroundColor: colors.primary }]}>
      <View style={styles.row}>
        <Logo style={styles.logo} />
        <View>
          <Text style={[styles.welcomeText, { color: colors.onPrimary }]}>
            Xin chào, {user?.full_name || 'User'}!
          </Text>
          <Text style={[styles.subtitle, { color: colors.onPrimary + 'CC' }]}>
            Sẵn sàng sạc xe điện của bạn?
          </Text>
        </View>

        <TouchableOpacity
          style={[styles.logoutButton, { backgroundColor: 'rgba(255,255,255,0.2)' }]}
          onPress={onLogout}
        >
          <Icon name="logout" size={24} color={colors.onPrimary} />
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  header: { padding: 20, paddingTop: 60 },
  logo: { 
    width: 60,
    height: 60,
    borderRadius: 30,
    marginRight: 15,
  },
  row: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  welcomeText: { fontSize: 24, fontWeight: 'bold', marginBottom: 5 },
  subtitle: { fontSize: 16 },
  logoutButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: 'center',
    alignItems: 'center',
  },
});
