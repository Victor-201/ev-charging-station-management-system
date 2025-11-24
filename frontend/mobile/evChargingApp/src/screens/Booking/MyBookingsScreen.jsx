import { useState, useCallback } from 'react';
import { View, Text, FlatList, ActivityIndicator, TouchableOpacity, Alert, RefreshControl } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useTheme } from 'react-native-paper';
import { useSelector } from 'react-redux';
import { useFocusEffect } from '@react-navigation/native';
import Icon from 'react-native-vector-icons/MaterialIcons';
import bookingService from '../../services/bookingService';

function BookingItem({ item, colors, onCancel, onOpen }) {
  const canCancel = item.status === 'pending' || item.status === 'confirmed';
  return (
    <TouchableOpacity onPress={() => onOpen(item)} style={{ backgroundColor: colors.surface, marginHorizontal: 16, marginBottom: 12, padding: 16, borderRadius: 12 }}>
      <Text style={{ color: colors.onSurface, fontWeight: '700' }} numberOfLines={1} ellipsizeMode="middle">{item.reservation_id || item.id}</Text>
      <Text style={{ color: colors.onSurfaceVariant, marginTop: 4 }} numberOfLines={1}>{item.station_name || item.station_id}</Text>
      <Text style={{ color: colors.onSurfaceVariant, marginTop: 2 }}>{new Date(item.start_time).toLocaleString('vi-VN')} - {new Date(item.end_time).toLocaleTimeString('vi-VN')}</Text>
      <View style={{ flexDirection:'row', justifyContent:'space-between', marginTop: 10 }}>
        <Text style={{ color: colors.onSurfaceVariant, fontWeight: '600' }}>{item.status}</Text>
        {canCancel && (
          <TouchableOpacity onPress={() => onCancel(item)}>
            <Text style={{ color: colors.error, fontWeight: '700' }}>Hủy</Text>
          </TouchableOpacity>
        )}
      </View>
    </TouchableOpacity>
  );
}

export default function MyBookingsScreen({ navigation }) {
  const { colors } = useTheme();
  const user = useSelector((s) => s.auth.user);

  const [loading, setLoading] = useState(true);
  const [list, setList] = useState([]);

  const load = useCallback(async () => {
    try {
      setLoading(true);
      const userId = user?.id || user?.user_id || user?.sub;
      if (!userId) throw new Error('Chưa đăng nhập');
      const res = await bookingService.getUserBookings(userId);
      setList(Array.isArray(res) ? res : []);
    } catch (e) {
      console.error('getUserBookings error:', e);
      Alert.alert('Lỗi', e?.response?.data?.error || e.message || 'Không thể tải danh sách');
    } finally { setLoading(false); }
  }, [user]);

  // Load bookings when screen comes into focus
  useFocusEffect(
    useCallback(() => {
      load();
    }, [load])
  );

  const onCancel = async (item) => {
    try {
      const id = item.reservation_id || item.id;
      if (!id) return;
      await bookingService.cancelBooking(id);
      Alert.alert('Thành công', 'Đã hủy đặt chỗ');
      load();
    } catch (e) {
      Alert.alert('Hủy thất bại', e?.response?.data?.error || e.message || 'Vui lòng thử lại');
    }
  };

  const onOpen = (item) => {
    const id = item.reservation_id || item.id;
    if (!id) return;
    navigation.navigate('BookingConfirmationScreen', { reservationId: id, station: { name: item.station_name || 'Trạm' , address: item.station_address || '' }, point: { name: item.point_id }, slot: { time: new Date(item.start_time).toLocaleTimeString('vi-VN') } });
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.background }}>
      <View style={{ padding: 16, borderBottomWidth: 1, borderBottomColor: colors.outline, flexDirection:'row', alignItems:'center', gap: 8 }}>
        <Icon name="event" size={22} color={colors.primary} />
        <Text style={{ color: colors.onSurface, fontWeight: '700', fontSize: 18 }}>Đặt chỗ của tôi</Text>
      </View>

      {loading ? (
        <View style={{ flex:1, justifyContent:'center', alignItems:'center' }}>
          <ActivityIndicator size="large" color={colors.primary} />
        </View>
      ) : (
        <FlatList
          data={list}
          keyExtractor={(item, idx) => String(item.reservation_id || item.id || idx)}
          renderItem={({ item }) => (
            <BookingItem item={item} colors={colors} onCancel={onCancel} onOpen={onOpen} />
          )}
          contentContainerStyle={{ paddingVertical: 12, flexGrow: 1 }}
          ListEmptyComponent={
            <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
              <Text style={{ color: colors.onSurfaceVariant, textAlign: 'center' }}>Chưa có đặt chỗ</Text>
            </View>
          }
          refreshControl={<RefreshControl refreshing={loading} onRefresh={load} colors={[colors.primary]} tintColor={colors.primary} />}
        />
      )}
    </SafeAreaView>
  );
}

