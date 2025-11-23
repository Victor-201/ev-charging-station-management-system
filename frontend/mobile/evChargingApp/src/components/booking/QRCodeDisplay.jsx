import { View, Text, StyleSheet, TouchableOpacity, Share, Platform } from 'react-native';
import { useTheme } from 'react-native-paper';
import QRCode from 'react-native-qrcode-svg';
import Icon from 'react-native-vector-icons/MaterialIcons';

const getStyles = (colors) => StyleSheet.create({
  wrap: { alignItems: 'center', padding: 16 },
  box: {
    backgroundColor: colors.surface,
    padding: 16,
    borderRadius: 12,
    elevation: 3,
    shadowColor: colors.onBackground,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.15,
    shadowRadius: 2,
  },
  info: { marginTop: 12, color: colors.onSurfaceVariant, textAlign: 'center' },
  code: {
    marginTop: 8,
    color: colors.onSurfaceVariant,
    fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace',
    fontSize: 12,
  },
  row: { flexDirection: 'row', gap: 8, marginTop: 16 },
  btn: {
    flexDirection: 'row', alignItems: 'center', gap: 6,
    backgroundColor: colors.primaryContainer, paddingHorizontal: 12, paddingVertical: 10, borderRadius: 8,
  },
  btnText: { color: colors.onPrimaryContainer, fontWeight: '600' },
  err: { alignItems: 'center', padding: 16 },
});

export default function QRCodeDisplay({ qrCode, onRefresh, error }) {
  const { colors } = useTheme();
  const styles = getStyles(colors);

  const onShare = async () => {
    try { await Share.share({ message: `QR: ${qrCode}` }); } catch {}
  };

  if (error) {
    return (
      <View style={styles.err}>
        <Icon name="error-outline" size={48} color={colors.error} />
        <Text style={{ marginTop: 8, color: colors.error, fontWeight: '600' }}>{error}</Text>
        {onRefresh && (
          <TouchableOpacity style={[styles.btn, { marginTop: 12 }]} onPress={onRefresh}>
            <Icon name="refresh" size={18} color={colors.onPrimaryContainer} />
            <Text style={styles.btnText}>Thử lại</Text>
          </TouchableOpacity>
        )}
      </View>
    );
  }

  if (!qrCode) return null;

  return (
    <View style={styles.wrap}>
      <View style={styles.box}>
        <QRCode value={qrCode} size={220} />
      </View>
      <Text style={styles.info}>Quét mã QR tại trạm để bắt đầu phiên sạc</Text>
      <Text style={styles.code} numberOfLines={1} ellipsizeMode="middle">{qrCode}</Text>
      <View style={styles.row}>
        <TouchableOpacity style={styles.btn} onPress={onShare}>
          <Icon name="share" size={18} color={colors.onPrimaryContainer} />
          <Text style={styles.btnText}>Chia sẻ</Text>
        </TouchableOpacity>
        {onRefresh && (
          <TouchableOpacity style={styles.btn} onPress={onRefresh}>
            <Icon name="refresh" size={18} color={colors.onPrimaryContainer} />
            <Text style={styles.btnText}>Làm mới</Text>
          </TouchableOpacity>
        )}
      </View>
    </View>
  );
}

