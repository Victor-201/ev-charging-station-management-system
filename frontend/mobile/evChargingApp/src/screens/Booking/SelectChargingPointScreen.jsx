import { useEffect, useState } from 'react';
import { View, Text, ActivityIndicator, Alert, TouchableOpacity, StyleSheet, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useTheme } from 'react-native-paper';
import Icon from 'react-native-vector-icons/MaterialIcons';
import stationService from '../../services/stationService';

const getStyles = (colors) => StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  header: { padding: 16, borderBottomWidth: 1, borderBottomColor: colors.outline },
  title: { fontSize: 18, fontWeight: '700', color: colors.onSurface },
  section: { backgroundColor: colors.surface, margin: 16, borderRadius: 12, padding: 16 },
  point: { padding: 12, borderRadius: 10, borderWidth: 1, borderColor: colors.outline, marginBottom: 10 },
  row: { flexDirection: 'row', justifyContent: 'space-between' },
  label: { color: colors.onSurface, fontWeight: '600' },
  value: { color: colors.onSurfaceVariant },
  btn: { marginTop: 12, backgroundColor: colors.primary, paddingVertical: 12, borderRadius: 8, alignItems: 'center' },
  btnText: { color: colors.onPrimary, fontWeight: '700' },
});

export default function SelectChargingPointScreen({ route, navigation }) {
  const { colors } = useTheme();
  const styles = getStyles(colors);
  const stationId = route.params?.stationId;

  const [loading, setLoading] = useState(true);
  const [station, setStation] = useState(null);
  const [points, setPoints] = useState([]);

  const load = async () => {
    try {
      setLoading(true);
      const [s, p] = await Promise.all([
        stationService.getStationById(stationId),
        stationService.getStationConnectors(stationId),
      ]);
      setStation(s);
      setPoints(Array.isArray(p) ? p : []);
    } catch (e) {
      console.error('SelectChargingPoint load error:', e);
      Alert.alert('Lỗi', 'Không thể tải danh sách điểm sạc');
    } finally { setLoading(false); }
  };

  useEffect(() => { if (stationId) load(); }, [stationId]);

  const onSelect = (pt) => {
    navigation.navigate('SelectTimeSlotScreen', {
      stationId: stationId,
      pointId: pt.point_id || pt.id,
      station,
      point: pt,
    });
  };

  if (loading) {
    return (
      <SafeAreaView style={[styles.container, { justifyContent: 'center', alignItems: 'center' }]}> 
        <ActivityIndicator size="large" color={colors.primary} />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}><Text style={styles.title}>Chọn điểm sạc</Text></View>
      <ScrollView contentContainerStyle={{ padding: 16 }}>
        {points.map((pt) => (
          <TouchableOpacity key={pt.point_id || pt.id} style={styles.point} onPress={() => onSelect(pt)}>
            <View style={styles.row}>
              <Text style={styles.label}>{pt.name || pt.point_code || 'Điểm sạc'}</Text>
              <Text style={[styles.value, { color: pt.status==='available'?colors.success: (pt.status==='occupied'?colors.warning:colors.error) }]}>{pt.status}</Text>
            </View>
            <Text style={styles.value}>Loại: {pt.connector_type || 'N/A'} • Công suất: {pt.max_power_kw || pt.power_kw || 'N/A'} kW</Text>
            <View style={[styles.btn, { marginTop: 10 }]}>
              <Text style={styles.btnText}>Chọn</Text>
            </View>
          </TouchableOpacity>
        ))}
      </ScrollView>
    </SafeAreaView>
  );
}

