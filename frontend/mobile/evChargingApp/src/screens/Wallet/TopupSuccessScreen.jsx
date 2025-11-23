import { useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useTheme } from 'react-native-paper';
import { useNavigation, useRoute } from '@react-navigation/native';
import { useDispatch, useSelector } from 'react-redux';
import { getWallet } from '../../store/slices/walletSlice';

const getStyles = (colors) => StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  card: { margin: 16, padding: 16, backgroundColor: colors.surface, borderRadius: 12 },
  title: { fontSize: 20, fontWeight: '700', color: colors.success, textAlign: 'center', marginTop: 12 },
  row: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 10 },
  label: { color: colors.onSurfaceVariant },
  value: { color: colors.onSurface, fontWeight: '600' },
  actions: { padding: 16, gap: 12 },
  btn: { alignItems: 'center', paddingVertical: 14, borderRadius: 10 },
});

export default function TopupSuccessScreen() {
  const { colors } = useTheme();
  const styles = getStyles(colors);
  const navigation = useNavigation();
  const route = useRoute();
  const dispatch = useDispatch();
  const { user } = useSelector(s => s.auth);
  const userId = user?.id || user?.user_id || user?.sub;
  const { amount, transactionId } = route.params || {};
  const { wallet, loading } = useSelector((s) => s.wallet);

  useEffect(() => {
    if (userId) dispatch(getWallet(userId));
  }, [userId, dispatch]);

  return (
    <SafeAreaView style={styles.container}>
      <View style={{ alignItems:'center', padding: 16 }}>
        <Text style={styles.title}>Nạp tiền thành công</Text>
      </View>

      <View style={styles.card}>
        <View style={styles.row}><Text style={styles.label}>Số tiền</Text><Text style={styles.value}>{Number(amount||0).toLocaleString('vi-VN')} ₫</Text></View>
        <View style={styles.row}><Text style={styles.label}>Mã giao dịch</Text><Text style={styles.value} numberOfLines={1} ellipsizeMode="middle">{transactionId}</Text></View>
        <View style={styles.row}><Text style={styles.label}>Số dư mới</Text><Text style={styles.value}>{loading ? 'Đang cập nhật...' : `${Number(wallet?.balance||0).toLocaleString('vi-VN')} ₫`}</Text></View>
      </View>

      <View style={styles.actions}>
        <TouchableOpacity style={[styles.btn,{ backgroundColor: colors.primary }]} onPress={()=>navigation.navigate('TransactionHistoryScreen')}>
          <Text style={{ color: colors.onPrimary, fontWeight:'700' }}>Xem giao dịch</Text>
        </TouchableOpacity>
        <TouchableOpacity style={[styles.btn,{ backgroundColor: colors.secondaryContainer }]} onPress={()=>navigation.navigate('WalletMain')}>
          <Text style={{ color: colors.onSecondaryContainer, fontWeight:'700' }}>Về Ví</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

