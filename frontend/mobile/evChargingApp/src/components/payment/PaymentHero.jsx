import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { useTheme } from 'react-native-paper';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';

export default function PaymentHero({ balance = 0, amountDue = 0, onTopup }) {
  const { colors } = useTheme();

  return (
    <View style={[styles.container, { backgroundColor: colors.primary }]}>      
      <Text style={styles.title}>Thanh toán</Text>
      <View style={styles.row}>
        <View style={[styles.card, { backgroundColor: 'rgba(255,255,255,0.15)', borderColor: 'rgba(255,255,255,0.25)' }]}>
          <Text style={styles.cardLabel}>Số dư ví</Text>
          <Text style={styles.cardValue}>{balance.toLocaleString('vi-VN')} ₫</Text>
        </View>
        {amountDue > 0 && (
          <View style={[styles.card, { backgroundColor: colors.error + '30', borderColor: colors.error + '60' }]}> 
            <Text style={styles.cardLabel}>Cần thanh toán</Text>
            <Text style={styles.cardValue}>{amountDue.toLocaleString('vi-VN')} ₫</Text>
          </View>
        )}
      </View>

      <TouchableOpacity style={[styles.cta, { backgroundColor: colors.success }]} onPress={onTopup} activeOpacity={0.85}>
        <Icon name="cash-plus" size={20} color="#fff" />
        <Text style={styles.ctaText}>Nạp tiền vào ví</Text>
        <Icon name="chevron-right" size={22} color="#fff" />
      </TouchableOpacity>

      {/* Decorative */}
      <View style={[styles.circle, styles.c1]} />
      <View style={[styles.circle, styles.c2]} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: 20,
    paddingTop: 28,
    paddingBottom: 20,
    borderBottomLeftRadius: 24,
    borderBottomRightRadius: 24,
    overflow: 'hidden',
  },
  title: { color: '#fff', fontSize: 22, fontWeight: '700', marginBottom: 12 },
  row: { flexDirection: 'row', gap: 12, marginBottom: 12 },
  card: {
    flex: 1,
    borderRadius: 14,
    padding: 14,
    borderWidth: 1,
  },
  cardLabel: { color: 'rgba(255,255,255,0.9)', fontSize: 13, marginBottom: 6 },
  cardValue: { color: '#fff', fontSize: 22, fontWeight: '800' },
  cta: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    borderRadius: 14,
    paddingVertical: 12,
    marginTop: 2,
    elevation: 3,
    shadowColor: '#000',
    shadowOpacity: 0.2,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 3 },
  },
  ctaText: { color: '#fff', fontWeight: '700', fontSize: 15, flex: 1, textAlign: 'center' },
  circle: { position: 'absolute', backgroundColor: 'rgba(255,255,255,0.12)', borderRadius: 999 },
  c1: { width: 140, height: 140, right: -40, top: -50 },
  c2: { width: 90, height: 90, left: -20, bottom: -30 },
});

