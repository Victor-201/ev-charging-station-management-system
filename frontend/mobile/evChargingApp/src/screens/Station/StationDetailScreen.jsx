import { useEffect, useState, useMemo, useRef } from 'react';
import { View, Text, ActivityIndicator, ScrollView, TouchableOpacity, Alert, StyleSheet, Animated, Platform, LayoutAnimation } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useTheme } from 'react-native-paper';
import Icon from 'react-native-vector-icons/MaterialIcons';
import stationService from '../../services/stationService';
import { LayoutAnimations, fadeIn } from '../../utils/animations';

const getStyles = (colors) => StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  header: { padding: 16, borderBottomWidth: 1, borderBottomColor: colors.outline },
  title: { fontSize: 20, fontWeight: '700', color: colors.onSurface },
  sub: { color: colors.onSurfaceVariant, marginTop: 4 },
  section: { backgroundColor: colors.surface, margin: 16, borderRadius: 12, padding: 16 },
  row: { flexDirection: 'row', alignItems: 'center', marginBottom: 8 },
  icon: { marginRight: 8 },
  label: { color: colors.onSurface, fontWeight: '600' },
  value: { color: colors.onSurfaceVariant },
  point: { padding: 12, borderRadius: 10, borderWidth: 1, borderColor: colors.outline, marginBottom: 10 },
  pointRow: { flexDirection: 'row', justifyContent: 'space-between' },
  actions: { flexDirection: 'row', gap: 12, marginTop: 16 },
  btn: { flex: 1, alignItems: 'center', paddingVertical: 12, borderRadius: 8 },
});

export default function StationDetailScreen({ route, navigation }) {
  const { colors } = useTheme();
  const styles = getStyles(colors);
  const stationId = route.params?.stationId;

  const [loading, setLoading] = useState(true);
  const [station, setStation] = useState(null);
  const [points, setPoints] = useState([]);

  // Animation values
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(30)).current;

  const load = async () => {
    try {
      setLoading(true);
      const [s, p] = await Promise.all([
        stationService.getStationById(stationId),
        stationService.getStationConnectors(stationId),
      ]);
      setStation(s);
      setPoints(Array.isArray(p) ? p : []);

      // Animate content in after loading (iOS only)
      if (Platform.OS === 'ios') {
        Animated.parallel([
          fadeIn(fadeAnim, 400),
          Animated.timing(slideAnim, {
            toValue: 0,
            duration: 400,
            useNativeDriver: true,
          }),
        ]).start();
      } else {
        fadeAnim.setValue(1);
        slideAnim.setValue(0);
      }
    } catch (e) {
      console.error('StationDetailScreen load error:', e);
      Alert.alert('Lỗi', 'Không thể tải chi tiết trạm sạc');
    } finally { setLoading(false); }
  };

  useEffect(() => {
    if (stationId) {
      // Reset animations
      fadeAnim.setValue(0);
      slideAnim.setValue(30);
      load();
    }
  }, [stationId]);

  // Animate list changes (iOS only)
  useEffect(() => {
    if (Platform.OS === 'ios' && points.length > 0 && !loading) {
      LayoutAnimation.configureNext(LayoutAnimations.spring);
    }
  }, [points.length, loading]);

  const availableCount = useMemo(() => points.filter(pt => pt.status === 'available').length, [points]);

  if (loading || !station) {
    return (
      <SafeAreaView style={[styles.container, { justifyContent: 'center', alignItems: 'center' }]}> 
        <ActivityIndicator size="large" color={colors.primary} />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <Animated.View
        style={[
          styles.header,
          {
            opacity: fadeAnim,
            transform: [{ translateY: slideAnim }],
          }
        ]}
      >
        <Text style={styles.title} numberOfLines={2}>{station.name}</Text>
        <Text style={styles.sub} numberOfLines={2}>{station.address}</Text>
      </Animated.View>
      <ScrollView>
        <Animated.View
          style={{
            opacity: fadeAnim,
            transform: [{ translateY: slideAnim }],
          }}
        >
          <View style={styles.section}>
            <View style={styles.row}><Icon name="power" size={18} color={colors.onSurface} style={styles.icon} /><Text style={styles.label}>Khả dụng: </Text><Text style={styles.value}>{availableCount}/{points.length} cổng</Text></View>
            {!!station.price_per_kwh && (
              <View style={styles.row}><Icon name="attach-money" size={18} color={colors.onSurface} style={styles.icon} /><Text style={styles.label}>Giá: </Text><Text style={styles.value}>{Number(station.price_per_kwh).toLocaleString()} VND/kWh</Text></View>
            )}
            {Array.isArray(station.connector_types) && station.connector_types.length>0 && (
              <View style={{ marginTop: 8 }}>
                <Text style={styles.label}>Loại đầu nối:</Text>
                <Text style={styles.value}>{station.connector_types.join(', ')}</Text>
              </View>
            )}
          </View>

          <View style={styles.section}>
            <Text style={[styles.label, { marginBottom: 8 }]}>Các điểm sạc</Text>
            {points.map((pt, index) => (
              <Animated.View
                key={pt.point_id || pt.id}
                style={[
                  styles.point,
                  Platform.OS === 'ios' && {
                    opacity: fadeAnim,
                    transform: [{
                      translateY: slideAnim.interpolate({
                        inputRange: [0, 30],
                        outputRange: [0, 30 + (index * 5)],
                      })
                    }],
                  }
                ]}
              >
                <View style={styles.pointRow}>
                  <Text style={styles.label}>{pt.name || pt.point_code || 'Điểm sạc'}</Text>
                  <Text style={[styles.value, { color: pt.status==='available'?colors.success: (pt.status==='occupied'?colors.warning:colors.error) }]}>
                    {pt.status}
                  </Text>
                </View>
                <Text style={styles.value}>Loại: {pt.connector_type || 'N/A'} • Công suất: {pt.max_power_kw || pt.power_kw || 'N/A'} kW</Text>
              </Animated.View>
            ))}

            <View style={styles.actions}>
              <TouchableOpacity style={[styles.btn, { backgroundColor: colors.primary }]} onPress={()=>navigation.navigate('SelectChargingPointScreen', { stationId })}>
                <Text style={{ color: colors.onPrimary, fontWeight: '700' }}>Chọn điểm sạc</Text>
              </TouchableOpacity>
            </View>
            <View style={[styles.actions, { marginTop: 8 }]}>
              <TouchableOpacity style={[styles.btn, { backgroundColor: colors.errorContainer, flex: 1 }]} onPress={() => {
                const mockReservation = {
                  id: 'res_mock_' + stationId,
                  station_name: station.name,
                  station_id: station.id,
                  charger_id: 'C-01 (Test)',
                  date: new Date().toLocaleDateString('vi-VN'),
                  time: new Date().toLocaleTimeString('vi-VN'),
                };
                navigation.navigate('Charging', {
                  screen: 'InitiateCharging',
                  params: { reservation: mockReservation }
                });
              }}>
                <Text style={{ color: colors.onErrorContainer, fontWeight: '700' }}>Bắt đầu sạc (Test)</Text>
              </TouchableOpacity>
            </View>
          </View>
        </Animated.View>
      </ScrollView>
    </SafeAreaView>
  );
}

