import { useState } from 'react';
import { View, StyleSheet, Alert } from 'react-native';
import { Button, List, Divider, Text, Dialog, Portal } from 'react-native-paper';
import { useDispatch, useSelector } from 'react-redux';
import { logout } from '../../store/slices/authSlice';
import profileService from '../../services/profileService';
import { useTheme } from 'react-native-paper';

const getStyles = (colors) => StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  dangerZone: {
    marginTop: 32,
    paddingHorizontal: 16,
    borderTopWidth: 1,
    borderTopColor: colors.error + '30',
    paddingTop: 16,
    backgroundColor: colors.error + '10',
  },
  dangerTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: colors.error,
  },
  dangerText: {
    marginVertical: 8,
    color: colors.onSurface + '90',
  },
  deleteButton: {
    marginTop: 16,
    borderColor: colors.error,
  },
});

export default function AccountSettingsScreen() {
  const { colors } = useTheme();
  const styles = getStyles(colors);
  const dispatch = useDispatch();
  const { user } = useSelector((state) => state.auth);
  const [loading, setLoading] = useState(null); // 'export' | 'delete' | null
  const [dialogVisible, setDialogVisible] = useState(false);

  const handleExportData = async () => {
    setLoading('export');
    try {
      // This would ideally trigger a download or send an email.
      // For now, we'll just show a success message.
      await profileService.exportData(user.id);
      Alert.alert('Thành công', 'Yêu cầu xuất dữ liệu đã được gửi. Vui lòng kiểm tra email của bạn.');
    } catch (error) {
      Alert.alert('Lỗi', 'Không thể xuất dữ liệu. Vui lòng thử lại.');
    } finally {
      setLoading(null);
    }
  };

  const handleDeleteAccount = async () => {
    setDialogVisible(false);
    setLoading('delete');
    try {
      await profileService.deleteAccount(user.id);
      Alert.alert('Thành công', 'Tài khoản của bạn đã được xóa.', [
        { text: 'OK', onPress: () => dispatch(logout()) },
      ]);
    } catch (error) {
      Alert.alert('Lỗi', 'Không thể xóa tài khoản. Vui lòng thử lại.');
    } finally {
      setLoading(null);
    }
  };

  return (
    <View style={styles.container}>
      <List.Section>
        <List.Subheader>Quản lý Dữ liệu</List.Subheader>
        <List.Item
          title="Xuất Dữ liệu Cá nhân"
          description="Tải xuống một bản sao dữ liệu của bạn"
          left={(props) => <List.Icon {...props} icon="database-export" />}
          onPress={handleExportData}
          disabled={loading}
        />
      </List.Section>

      <Divider />

      <View style={styles.dangerZone}>
        <Text style={styles.dangerTitle}>Vùng Nguy hiểm</Text>
        <Text style={styles.dangerText}>
          Hành động này không thể hoàn tác. Tất cả dữ liệu của bạn sẽ bị xóa vĩnh viễn.
        </Text>
        <Button
          mode="outlined"
          color={colors.error}
          icon="delete-forever"
          loading={loading === 'delete'}
          disabled={loading}
          onPress={() => setDialogVisible(true)}
          style={styles.deleteButton}
        >
          Xóa tài khoản
        </Button>
      </View>

      <Portal>
        <Dialog visible={dialogVisible} onDismiss={() => setDialogVisible(false)}>
          <Dialog.Title>Xác nhận Xóa Tài khoản</Dialog.Title>
          <Dialog.Content>
            <Text>Bạn có chắc chắn muốn xóa tài khoản vĩnh viễn không? Hành động này không thể hoàn tác.</Text>
          </Dialog.Content>
          <Dialog.Actions>
            <Button onPress={() => setDialogVisible(false)}>Hủy</Button>
            <Button color={colors.error} onPress={handleDeleteAccount}>Xóa</Button>
          </Dialog.Actions>
        </Dialog>
      </Portal>
    </View>
  );
}



