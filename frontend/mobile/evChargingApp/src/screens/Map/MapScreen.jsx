import { useEffect, useMemo, useRef, useState } from 'react';
import { View, Text, TouchableOpacity, ActivityIndicator, Platform, Alert, StyleSheet } from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import MapView, { Marker } from 'react-native-maps';
import WebView from 'react-native-webview';
import Geolocation from '@react-native-community/geolocation';
import Icon from 'react-native-vector-icons/MaterialIcons';
import { useTheme } from 'react-native-paper';
import stationService from '../../services/stationService';
import StationsBottomSheet from '../../components/station/StationsBottomSheet';
import mapService from '../../services/mapService';

const DEFAULT_REGION = { latitude: 10.77978, longitude: 106.699, latitudeDelta: 0.05, longitudeDelta: 0.05 };

const getStyles = (colors) => StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  map: { width: '100%', height: '100%' },
  fab: { position: 'absolute', right: 16, backgroundColor: colors.surface, padding: 12, borderRadius: 24, elevation: 3 },
  fabText: { color: colors.accent },
});

export default function MapScreen({ navigation }) {
  const { colors } = useTheme();
  const styles = getStyles(colors);
  const mapRef = useRef(null);

  const [region, setRegion] = useState(null);
  const [loading, setLoading] = useState(true);
  const [stations, setStations] = useState([]);
  const [sheetVisible, setSheetVisible] = useState(false);
  const insets = useSafeAreaInsets();

  const fetchStations = async (lat, lng, radiusKm = 5) => {
    try {
      setLoading(true);
      const list = await stationService.searchStations(lat, lng, radiusKm);

      const stationsWithDistance = (Array.isArray(list) ? list : [])
        .map(s => ({
          ...s,
          // Calculate distance for display and sorting purposes
          distanceKm: stationService.calculateDistance(lat, lng, s.latitude, s.longitude)
        }))
        .sort((a, b) => (a.distanceKm ?? 0) - (b.distanceKm ?? 0));

      setStations(stationsWithDistance);
    } catch (e) {
      console.error('fetchStations error:', e);
      Alert.alert('Lỗi', 'Không thể tải danh sách trạm sạc');
    } finally { setLoading(false); }
  };

  useEffect(() => {
    Geolocation.getCurrentPosition(
      (pos) => {
        const { latitude, longitude } = pos.coords;
        const r = { latitude, longitude, latitudeDelta: 0.05, longitudeDelta: 0.05 };
        setRegion(r);
        fetchStations(latitude, longitude, 5);
      },
      () => {
        setRegion(DEFAULT_REGION);
        fetchStations(DEFAULT_REGION.latitude, DEFAULT_REGION.longitude, 5);
      },
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 5000 }
    );
  }, []);

  const getPinColor = (s) => {
    if (s.status === 'maintenance' || s.status === 'offline') return colors.error;
    if ((s.available_ports || 0) === 0) return colors.warning;
    return colors.success;
  };

  const leafletHtml = useMemo(() => {
    const c = region || DEFAULT_REGION;
    return `<!doctype html><html><head><meta name=viewport content="width=device-width,initial-scale=1" />
    <link rel="stylesheet" href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css" />
    <style>html,body,#map{height:100%;margin:0}.leaflet-container{background:${colors.background}}</style></head>
    <body><div id="map"></div><script src="https://unpkg.com/leaflet@1.9.4/dist/leaflet.js"></script>
    <script>(function(){var map=L.map('map').setView([${c.latitude},${c.longitude}],13);
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png',{maxZoom:19}).addTo(map);
    var stations=${JSON.stringify(stations)};stations.forEach(function(s){
      if(typeof s.latitude!=='number'||typeof s.longitude!=='number')return;
      var m=L.marker([s.latitude,s.longitude],{title:s.name||'EV Station'}).addTo(map);
      m.on('click',function(){window.ReactNativeWebView&&window.ReactNativeWebView.postMessage(JSON.stringify({t:'tap',id:s.id||s.station_id}))});
    });
    map.on('moveend',function(){var c=map.getCenter();window.ReactNativeWebView&&window.ReactNativeWebView.postMessage(JSON.stringify({t:'move',lat:c.lat,lng:c.lng}))});})();</script>
    </body></html>`;
  }, [region, stations, colors.background]);

  const onWebMessage = (e) => {
    try {
      const data = JSON.parse(e?.nativeEvent?.data || '{}');
      if (data.t === 'tap' && data.id) navigation.navigate('StationDetailScreen', { stationId: String(data.id) });
      if (data.t === 'move' && typeof data.lat === 'number' && typeof data.lng === 'number') fetchStations(data.lat, data.lng, 5);
    } catch {}
  };

  if (!region) return (
    <SafeAreaView style={[styles.container, { justifyContent: 'center', alignItems: 'center' }]}> 
      <ActivityIndicator size="large" color={colors.primary} />
      <Text style={{ marginTop: 8, color: colors.onSurfaceVariant }}>Đang xác định vị trí...</Text>
    </SafeAreaView>
  );

  const handleDirections = async (station) => {
    try {
      const to = { lat: station.latitude, lng: station.longitude };
      let from = null;
      try {
        const pos = await new Promise((resolve, reject)=>{
          Geolocation.getCurrentPosition(resolve, reject, { enableHighAccuracy:true, timeout:8000, maximumAge:5000 });
        });
        from = { lat: pos.coords.latitude, lng: pos.coords.longitude };
      } catch (_) {
        if (region) from = { lat: region.latitude, lng: region.longitude };
      }
      await mapService.openDirections({ from, to, name: station.name });
    } catch (e) {
      Alert.alert('Không thể mở bản đồ', e?.message || 'Vui lòng thử lại');
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      {Platform.OS === 'ios' ? (
        <MapView ref={mapRef} style={styles.map} initialRegion={region} showsUserLocation onRegionChangeComplete={(r)=>{
          setRegion(r); fetchStations(r.latitude, r.longitude, Math.max(3, Math.round(r.latitudeDelta*111)));}}
        >
          {stations.filter(s=>typeof s.latitude==='number'&&typeof s.longitude==='number').map((s)=>(
            <Marker key={s.id||s.station_id} coordinate={{ latitude:s.latitude, longitude:s.longitude }} title={s.name} description={s.address} pinColor={getPinColor(s)} onPress={()=>navigation.navigate('StationDetailScreen',{ stationId:String(s.id||s.station_id) })} />
          ))}
        </MapView>
      ) : (
        <WebView originWhitelist={["*"]} source={{ html: leafletHtml }} onMessage={onWebMessage} />
      )}

      {/* FABs with SafeArea spacing */}
      <View style={{ position:'absolute', right:16, bottom: Math.max(16, insets.bottom + 8), gap: 12 }}>
        {/* Gần tôi: mở bottom sheet danh sách đã sort theo khoảng cách */}
        <TouchableOpacity style={styles.fab} onPress={()=> setSheetVisible(true)} accessibilityLabel="Trạm gần tôi" accessibilityHint="Hiển thị danh sách trạm sạc gần vị trí hiện tại">
          <Icon name="place" size={22} color={colors.accent} />
        </TouchableOpacity>
        {/* Vị trí hiện tại: recenter + refresh */}
        <TouchableOpacity style={styles.fab} onPress={()=>{
          Geolocation.getCurrentPosition(
            (pos)=>{ const { latitude, longitude } = pos.coords; setRegion({ latitude, longitude, latitudeDelta: 0.05, longitudeDelta: 0.05 }); fetchStations(latitude, longitude, 5); },
            ()=>{ Alert.alert('Lỗi vị trí', 'Không thể lấy vị trí hiện tại'); },
            { enableHighAccuracy: true, timeout: 10000, maximumAge: 5000 }
          );
        }} accessibilityLabel="Vị trí của tôi" accessibilityHint="Đưa bản đồ về vị trí hiện tại và nạp trạm gần">
          <Icon name="my-location" size={22} color={colors.accent} />
        </TouchableOpacity>
      </View>

      {/* Bottom sheet danh sách trạm */}
      <StationsBottomSheet
        visible={sheetVisible}
        onClose={()=> setSheetVisible(false)}
        stations={stations}
        onSelect={(s)=> navigation.navigate('StationDetailScreen', { stationId: String(s.id || s.station_id) })}
        onDirections={handleDirections}
      />

      {loading && (
        <View style={{ position:'absolute', left:0, right:0, top:0, bottom:0, justifyContent:'center', alignItems:'center' }}>
          <ActivityIndicator size="large" color={colors.primary} />
        </View>
      )}
    </SafeAreaView>
  );
}

