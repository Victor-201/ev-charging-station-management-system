import { useMemo } from 'react';
import { Modal, View, Text, TouchableOpacity, FlatList, StyleSheet } from 'react-native';
import { useTheme } from 'react-native-paper';

const getStyles = (colors) => StyleSheet.create({
  overlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.25)', justifyContent: 'flex-end' },
  sheet: { backgroundColor: colors.surface, borderTopLeftRadius: 16, borderTopRightRadius: 16, paddingTop: 8 },
  handle: { alignSelf: 'center', width: 48, height: 5, borderRadius: 3, backgroundColor: colors.outline, marginVertical: 8 },
  header: { paddingHorizontal: 16, paddingBottom: 8, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  title: { color: colors.onSurface, fontWeight: '700', fontSize: 16 },
  close: { color: colors.primary, fontWeight: '700' },
  item: { paddingHorizontal: 16, paddingVertical: 12, borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: colors.outline },
  name: { color: colors.onSurface, fontWeight: '600' },
  addr: { color: colors.onSurfaceVariant, marginTop: 2 },
  meta: { color: colors.onSurfaceVariant, marginTop: 4, fontSize: 12 },
  status: { fontWeight: '700' },
  actions: { flexDirection: 'row', marginTop: 8, gap: 12 },
  actionBtn: { paddingVertical: 8, paddingHorizontal: 12, borderRadius: 8, backgroundColor: colors.secondaryContainer },
  actionText: { color: colors.onSecondaryContainer, fontWeight: '700' },
});

export default function StationsBottomSheet({ visible, onClose, stations = [], onSelect, onDirections }) {
  const { colors } = useTheme();
  const styles = getStyles(colors);

  const data = useMemo(() => {
    return (stations || []).filter(s => typeof s.latitude === 'number' && typeof s.longitude === 'number');
  }, [stations]);

  const renderItem = ({ item }) => (
    <View style={styles.item}>
      <TouchableOpacity onPress={() => { onClose?.(); onSelect?.(item); }}>
        <Text style={styles.name} numberOfLines={1}>{item.name || 'Trạm sạc'}</Text>
        <Text style={styles.addr} numberOfLines={1}>{item.address || item.city || item.region || ''}</Text>
        <Text style={styles.meta}>
          {(item.distanceKm != null ? `${item.distanceKm.toFixed(2)} km` : '')}
          {`  •  `}
          <Text style={[styles.status, { color: item.status === 'maintenance' || item.status==='offline' ? colors.error : colors.success }]}>{item.status || 'active'}</Text>
        </Text>
      </TouchableOpacity>
      <View style={styles.actions}>
        {onDirections && (
          <TouchableOpacity style={styles.actionBtn} onPress={() => { onDirections(item); }}>
            <Text style={styles.actionText}>Chỉ đường</Text>
          </TouchableOpacity>
        )}
        <TouchableOpacity style={[styles.actionBtn, { backgroundColor: colors.primary }]} onPress={() => { onClose?.(); onSelect?.(item); }}>
          <Text style={{ color: colors.onPrimary, fontWeight: '700' }}>Chi tiết</Text>
        </TouchableOpacity>
      </View>
    </View>
  );

  return (
    <Modal visible={visible} animationType="slide" transparent onRequestClose={onClose}>
      <View style={styles.overlay}>
        <View style={[styles.sheet, { maxHeight: '70%' }] }>
          <View style={styles.handle} />
          <View style={styles.header}>
            <Text style={styles.title}>Trạm gần bạn</Text>
            <TouchableOpacity onPress={onClose}><Text style={styles.close}>Đóng</Text></TouchableOpacity>
          </View>
          <FlatList
            data={data}
            keyExtractor={(it, idx) => String(it.id || it.station_id || idx)}
            renderItem={renderItem}
            keyboardShouldPersistTaps="handled"
          />
        </View>
      </View>
    </Modal>
  );
}

