import { View, Text, StyleSheet, TouchableOpacity, Share, Platform } from 'react-native';
import { useTheme } from 'react-native-paper';
import QRCode from 'react-native-qrcode-svg';
import Icon from 'react-native-vector-icons/MaterialIcons';

const getStyles = (colors) => StyleSheet.create({
  container: {
    alignItems: 'center',
    padding: 20,
  },
  qrWrapper: {
    backgroundColor: colors.surface,
    padding: 24,
    borderRadius: 16,
    elevation: 4,
    shadowColor: colors.onBackground,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
  },
  qrCode: {
    alignItems: 'center',
  },
  instructionText: {
    marginTop: 16,
    fontSize: 14,
    color: colors.onSurfaceVariant,
    textAlign: 'center',
    lineHeight: 20,
  },
  codeText: {
    marginTop: 12,
    fontSize: 12,
    color: colors.onSurfaceVariant,
    fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace',
    textAlign: 'center',
  },
  actionsContainer: {
    flexDirection: 'row',
    marginTop: 24,
    gap: 12,
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 8,
    backgroundColor: colors.primaryContainer,
  },
  actionButtonText: {
    color: colors.onPrimaryContainer,
    fontSize: 14,
    fontWeight: '600',
  },
  errorContainer: {
    alignItems: 'center',
    padding: 20,
  },
  errorIcon: {
    marginBottom: 16,
  },
  errorText: {
    fontSize: 16,
    color: colors.error,
    textAlign: 'center',
    marginBottom: 8,
  },
  errorSubtext: {
    fontSize: 14,
    color: colors.onSurfaceVariant,
    textAlign: 'center',
  },
});

export default function QRCodeDisplay({ qrCode, error, onRefresh }) {
  const { colors } = useTheme();
  const styles = getStyles(colors);

  const handleShare = async () => {
    try {
      await Share.share({
        message: `Mã QR đặt chỗ sạc: ${qrCode}`,
        title: 'Chia sẻ mã QR',
      });
    } catch (error) {
      console.error('Error sharing QR code:', error);
    }
  };

  if (error) {
    return (
      <View style={styles.errorContainer}>
        <Icon name="error-outline" size={64} color={colors.error} style={styles.errorIcon} />
        <Text style={styles.errorText}>{error}</Text>
        <Text style={styles.errorSubtext}>
          Bạn vẫn có thể xem đặt chỗ trong danh sách của mình
        </Text>
        {onRefresh && (
          <TouchableOpacity 
            style={[styles.actionButton, { marginTop: 16 }]} 
            onPress={onRefresh}
          >
            <Icon name="refresh" size={20} color={colors.onPrimaryContainer} />
            <Text style={styles.actionButtonText}>Thử lại</Text>
          </TouchableOpacity>
        )}
      </View>
    );
  }

  if (!qrCode) {
    return (
      <View style={styles.errorContainer}>
        <Icon name="info-outline" size={64} color={colors.warning} style={styles.errorIcon} />
        <Text style={styles.errorText}>Không có mã QR</Text>
        <Text style={styles.errorSubtext}>
          Vui lòng thử lại sau
        </Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.qrWrapper}>
        <View style={styles.qrCode}>
          <QRCode value={qrCode} size={220} />
        </View>
      </View>
      
      <Text style={styles.instructionText}>
        Quét mã QR này tại trạm sạc để bắt đầu phiên sạc của bạn
      </Text>
      
      <Text style={styles.codeText} numberOfLines={1} ellipsizeMode="middle">
        {qrCode}
      </Text>

      <View style={styles.actionsContainer}>
        <TouchableOpacity style={styles.actionButton} onPress={handleShare}>
          <Icon name="share" size={20} color={colors.onPrimaryContainer} />
          <Text style={styles.actionButtonText}>Chia sẻ</Text>
        </TouchableOpacity>
        
        {onRefresh && (
          <TouchableOpacity style={styles.actionButton} onPress={onRefresh}>
            <Icon name="refresh" size={20} color={colors.onPrimaryContainer} />
            <Text style={styles.actionButtonText}>Làm mới</Text>
          </TouchableOpacity>
        )}
      </View>
    </View>
  );
}

