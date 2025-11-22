import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { useTheme } from 'react-native-paper';
import Icon from 'react-native-vector-icons/MaterialIcons';

const getStyles = (colors) => StyleSheet.create({
  card: {
    backgroundColor: colors.surface,
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    elevation: 2,
    shadowColor: colors.onBackground,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },
  header: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 8 },
  name: { fontSize: 16, fontWeight: '700', color: colors.onSurface, flex: 1, marginRight: 8 },
  badge: { paddingHorizontal: 8, paddingVertical: 4, borderRadius: 12 },
  badgeText: { color: colors.onPrimary, fontSize: 12, fontWeight: '600' },
  row: { flexDirection: 'row', alignItems: 'center', marginTop: 6 },
  icon: { marginRight: 8 },
  text: { color: colors.onSurface, opacity: 0.85 },
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginTop: 8 },
  chip: { backgroundColor: colors.primaryContainer, borderRadius: 12, paddingHorizontal: 10, paddingVertical: 4 },
  chipText: { color: colors.onPrimaryContainer, fontSize: 12, fontWeight: '600' },
  actions: { flexDirection: 'row', gap: 8, marginTop: 12 },
  btn: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, paddingVertical: 10, borderRadius: 8 },
  primaryBtn: { backgroundColor: colors.primary },
  secondaryBtn: { backgroundColor: colors.secondaryContainer },
  btnText: { fontWeight: '700' },
  primaryText: { color: colors.onPrimary },
  secondaryText: { color: colors.onSecondaryContainer },
});

export default function StationCard({ station, onBook, onDirections, onPress }) {
  const { colors } = useTheme();
  const styles = getStyles(colors);

  const statusColor = station.status === 'active' && (station.available_ports || 0) > 0
    ? colors.success
    : (station.available_ports || 0) === 0
    ? colors.warning
    : colors.error;
  const statusText = station.status === 'active'
    ? ((station.available_ports || 0) > 0 ? 'Khả dụng' : 'Hết chỗ')
    : (station.status === 'maintenance' ? 'Bảo trì' : 'Ngoại tuyến');

  return (
    <TouchableOpacity style={styles.card} onPress={() => onPress?.(station)}>
      <View style={styles.header}>
        <Text style={styles.name} numberOfLines={2} ellipsizeMode="tail">{station.name}</Text>
        <View style={[styles.badge, { backgroundColor: statusColor }]}>
          <Text style={styles.badgeText}>{statusText}</Text>
        </View>
      </View>
      <View style={styles.row}>
        <Icon name="location-on" size={18} color={colors.onSurface} style={styles.icon} />
        <Text style={styles.text} numberOfLines={1} ellipsizeMode="tail">{station.address}</Text>
      </View>
      <View style={styles.row}>
        <Icon name="power" size={18} color={colors.onSurface} style={styles.icon} />
        <Text style={styles.text}>{station.available_ports || 0}/{station.total_ports || 0} cổng</Text>
      </View>
      {Array.isArray(station.connector_types) && station.connector_types.length > 0 && (
        <View style={styles.chips}>
          {station.connector_types.map((t, idx) => (
            <View key={`${t}-${idx}`} style={styles.chip}><Text style={styles.chipText}>{t}</Text></View>
          ))}
        </View>
      )}
      <View style={styles.actions}>
        <TouchableOpacity style={[styles.btn, styles.secondaryBtn]} onPress={() => onDirections?.(station)}>
          <Icon name="directions" size={18} color={colors.onSecondaryContainer} />
          <Text style={[styles.btnText, styles.secondaryText]}>Chỉ đường</Text>
        </TouchableOpacity>
        <TouchableOpacity style={[styles.btn, styles.primaryBtn]} onPress={() => onBook?.(station)} disabled={(station.available_ports||0)===0 || station.status!=='active'}>
          <Text style={[styles.btnText, styles.primaryText]}>Đặt chỗ</Text>
        </TouchableOpacity>
      </View>
    </TouchableOpacity>
  );
}

