import React, { useState, useEffect } from 'react';
import { View, StyleSheet, Alert } from 'react-native';
import { Button, List, Divider, Text, Dialog, Portal, Switch } from 'react-native-paper';
import { useDispatch, useSelector } from 'react-redux';
import { logoutAsync } from '../../store/slices/authSlice';
import profileService from '../../services/profileService';
import { getNotificationSettings, updateNotificationSettings } from '../../store/slices/notificationSlice';
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
  const { settings: notificationSettings, loading: settingsLoading } = useSelector((state) => state.notification);
  const [loading, setLoading] = useState(null);
  const [dialogVisible, setDialogVisible] = useState(false);
  const [socialAccounts, setSocialAccounts] = useState([]);
  const [unlinkLoading, setUnlinkLoading] = useState(null);
  const [unlinkDialogVisible, setUnlinkDialogVisible] = useState(false);
  const [accountToUnlink, setAccountToUnlink] = useState(null);

  useEffect(() => {
    if (user?.id) {
      dispatch(getNotificationSettings(user.id));
      fetchSocialAccounts();
    }
  }, [dispatch, user?.id]);

  const fetchSocialAccounts = async () => {
    try {
      const accounts = await profileService.getSocialAccounts(user.id);
      setSocialAccounts(accounts);
    } catch (error) {
      console.error('Failed to fetch social accounts:', error);
    }
  };

  const handleSettingChange = (key, value) => {
    if (!notificationSettings) return;
    const newSettings = { ...notificationSettings, [key]: value };
    dispatch(updateNotificationSettings({ userId: user.id, settings: newSettings }));
  };

  const handleExportData = async () => {
    setLoading('export');
    try {
      await profileService.exportData(user.id);
      Alert.alert('Thành công', 'Yêu cầu xuất dữ liệu đã được gửi. Vui lòng kiểm tra email của bạn.');
    } catch (error) {
      Alert.alert('Lỗi', 'Không thể xuất dữ liệu. Vui lòng thử lại.');
    } finally {
      setLoading(null);
    }
  };

  const handleUnlinkAccount = async () => {
    if (!accountToUnlink) return;
    setUnlinkLoading(accountToUnlink.provider);
    try {
      await profileService.unlinkSocialAccount(user.id, accountToUnlink.provider);
      setSocialAccounts(socialAccounts.filter(acc => acc.provider !== accountToUnlink.provider));
      Alert.alert('Thành công', `Tài khoản ${accountToUnlink.provider} đã được hủy liên kết.`);
    } catch (error) {
      Alert.alert('Lỗi', `Không thể hủy liên kết tài khoản ${accountToUnlink.provider}.`);
    } finally {
      setUnlinkLoading(null);
      setUnlinkDialogVisible(false);
      setAccountToUnlink(null);
    }
  };

  const openUnlinkDialog = (account) => {
    setAccountToUnlink(account);
    setUnlinkDialogVisible(true);
  };

  const handleDeleteAccount = async () => {
    setDialogVisible(false);
    setLoading('delete');
    try {
      await profileService.deleteAccount(user.id);
      Alert.alert('Thành công', 'Tài khoản của bạn đã được xóa.', [
        { text: 'OK', onPress: () => dispatch(logoutAsync()) },
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
        <List.Subheader>Thông báo</List.Subheader>
        <List.Item
          title="Thông báo đẩy"
          right={() => (
            <Switch
              value={notificationSettings?.push_notifications ?? true}
              onValueChange={(value) => handleSettingChange('push_notifications', value)}
              disabled={settingsLoading}
            />
          )}
        />
        <List.Item
          title="Thông báo Email"
          right={() => (
            <Switch
              value={notificationSettings?.email_notifications ?? true}
              onValueChange={(value) => handleSettingChange('email_notifications', value)}
              disabled={settingsLoading}
            />
          )}
        />
        <List.Item
          title="Thông báo SMS"
          right={() => (
            <Switch
              value={notificationSettings?.sms_notifications ?? false}
              onValueChange={(value) => handleSettingChange('sms_notifications', value)}
              disabled={settingsLoading}
            />
          )}
        />
      </List.Section>

      <Divider />

      <List.Section>
        <List.Subheader>Tài khoản Liên kết</List.Subheader>
        {socialAccounts.map(account => (
          <List.Item
            key={account.provider}
            title={account.provider.charAt(0).toUpperCase() + account.provider.slice(1)}
            description={account.username || `ID: ${account.provider_user_id}`}
            left={(props) => <List.Icon {...props} icon={account.provider === 'google' ? 'google' : 'facebook'} />}
            right={() => (
              <Button
                mode="outlined"
                color={colors.error}
                onPress={() => openUnlinkDialog(account)}
                loading={unlinkLoading === account.provider}
                disabled={unlinkLoading}
              >
                Hủy liên kết
              </Button>
            )}
          />
        ))}
        {socialAccounts.length === 0 && (
          <Text style={{ paddingHorizontal: 16, color: colors.onSurface, opacity: 0.7 }}>
            Chưa có tài khoản nào được liên kết.
          </Text>
        )}
      </List.Section>

      <Divider />

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

        <Dialog visible={unlinkDialogVisible} onDismiss={() => setUnlinkDialogVisible(false)}>
          <Dialog.Title>Xác nhận Hủy liên kết</Dialog.Title>
          <Dialog.Content>
            <Text>Bạn có chắc chắn muốn hủy liên kết tài khoản {accountToUnlink?.provider}?</Text>
          </Dialog.Content>
          <Dialog.Actions>
            <Button onPress={() => setUnlinkDialogVisible(false)}>Hủy</Button>
            <Button color={colors.error} onPress={handleUnlinkAccount}>Hủy liên kết</Button>
          </Dialog.Actions>
        </Dialog>
      </Portal>
    </View>
  );
}



