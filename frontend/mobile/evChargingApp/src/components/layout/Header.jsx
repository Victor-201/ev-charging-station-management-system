import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { useTheme } from 'react-native-paper';
import { useSelector } from 'react-redux';
import { useNavigation } from '@react-navigation/native';
import useWallet from '../../hooks/useWallet';
import Logo from '../common/Logo';
import BalancePill from '../wallet/BalancePill';

export default function Header({ user }) {
  const { colors } = useTheme();
  const navigation = useNavigation();

  // useWallet will read auth user id from store if not provided
  const { wallet, loading: walletLoading, error: walletError, fetchWallet } = useWallet(true, user?.id);
  console.log('Header wallet', wallet);
  const balance = wallet?.balance ?? wallet?.data?.balance ?? 0;

  const handleBalancePress = () => {
    // Navigate to Wallet tab (which contains WalletStack with WalletMain screen)
    navigation.navigate('Wallet');
  }

  return (
    <View style={[styles.header, { backgroundColor: colors.primary }]}>
      <View style={styles.row}>
        <Logo style={styles.logo} />
        <View style={styles.titleContainer}>
          <Text style={[styles.welcomeText, { color: colors.onPrimary }]}>
            Xin chào, {user?.full_name || 'User'}!
          </Text>
          <Text style={[styles.subtitle, { color: colors.onPrimary + 'CC' }]}>
            Sẵn sàng sạc xe điện của bạn?
          </Text>
        </View>

        <View style={styles.balanceContainer}>
          <BalancePill balance={balance} onPress={handleBalancePress} />
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  header: { 
    padding: 20, 
  },
  logo: { 
    width: 60,
    height: 60,
    borderRadius: 30,
    marginRight: 15,
  },
  row: { 
    flexDirection: 'row', 
    alignItems: 'center' 
  },
  titleContainer: {
    flex: 1,
    marginRight: 15,
  },
  welcomeText: { 
    fontSize: 24, 
    fontWeight: 'bold', 
    marginBottom: 5 
  },
  subtitle: { 
    fontSize: 16 
  },
  balanceContainer: {
    justifyContent: 'center',
    alignItems: 'flex-end',
  },
});
