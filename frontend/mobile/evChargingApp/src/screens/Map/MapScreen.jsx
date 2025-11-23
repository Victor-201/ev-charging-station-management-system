import { useEffect, useMemo, useRef, useState } from 'react';
import { View, Text, TouchableOpacity, ActivityIndicator, Platform, Alert, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import MapView, { Marker } from 'react-native-maps';
import WebView from 'react-native-webview';
import Geolocation from '@react-native-community/geolocation';
import Icon from 'react-native-vector-icons/MaterialIcons';
import { useTheme } from 'react-native-paper';
import { useBottomTabBarHeight } from '@react-navigation/bottom-tabs';
import stationService from '../../services/stationService';
import StationsBottomSheet from '../../components/station/StationsBottomSheet';
import mapService from '../../services/mapService';

const DEFAULT_REGION = { latitude: 10.77978, longitude: 106.699, latitudeDelta: 0.05, longitudeDelta: 0.05 };

const getStyles = (colors) => StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  map: { width: '100%', height: '100%' },
  fab: { backgroundColor: colors.surface, padding: 12, borderRadius: 24, elevation: 3 },
  fabText: { color: colors.accent },
});

export default function MapScreen({ navigation }) {
  const { colors } = useTheme();
  const styles = getStyles(colors);
  const mapRef = useRef(null);

  const [region, setRegion] = useState(null);
  const [userLocation, setUserLocation] = useState(null); // To store user's actual GPS location
  const [loading, setLoading] = useState(true);
  const [stations, setStations] = useState([]);
  const [sheetVisible, setSheetVisible] = useState(false);

  const tabBarHeight = useBottomTabBarHeight();

  const goToMyLocation = () => {
    Geolocation.getCurrentPosition(
      (pos) => {
        const { latitude, longitude } = pos.coords;
        const newLocation = { latitude, longitude };
        setUserLocation(newLocation);

        const newRegion = { ...newLocation, latitudeDelta: 0.02, longitudeDelta: 0.02 };
        mapRef.current?.animateToRegion(newRegion, 1000);
        fetchStations(latitude, longitude);
      },
      () => {
        Alert.alert('Lỗi vị trí', 'Không thể lấy vị trí hiện tại của bạn.');
      },
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 3000 }
    );
  };

  const findNearbyStations = () => {
    if (userLocation) {
      fetchStations(userLocation.latitude, userLocation.longitude);
    } else {
      // Fallback if user location is not yet available
      goToMyLocation();
    }
  };

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
        const location = { latitude, longitude };
        setUserLocation(location);
        setRegion({ ...location, latitudeDelta: 0.05, longitudeDelta: 0.05 });
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
        <MapView ref={mapRef} style={styles.map} initialRegion={region} showsUserLocation onRegionChangeComplete={setRegion}>
          {stations.filter(s=>typeof s.latitude==='number'&&typeof s.longitude==='number').map((s)=>(
            <Marker key={s.id||s.station_id} coordinate={{ latitude:s.latitude, longitude:s.longitude }} title={s.name} description={s.address} pinColor={getPinColor(s)} onPress={()=>navigation.navigate('StationDetailScreen',{ stationId:String(s.id||s.station_id) })} />
          ))}
        </MapView>
      ) : (
        <WebView originWhitelist={["*"]} source={{ html: leafletHtml }} onMessage={onWebMessage} />
      )}

      {/* FABs with SafeArea spacing - moved to left */}
      <View style={{ position:'absolute', left:16, bottom: tabBarHeight + 16, gap: 12 }}>
        {/* Vị trí hiện tại: recenter + refresh */}
        <TouchableOpacity style={styles.fab} onPress={()=>{
          goToMyLocation();
        }} accessibilityLabel="Vị trí của tôi" accessibilityHint="Đưa bản đồ về vị trí hiện tại và nạp trạm gần">
          <Icon name="my-location" size={22} color={colors.accent} />
        </TouchableOpacity>
        {/* Danh sách trạm gần */}
        <TouchableOpacity style={styles.fab} onPress={() => { findNearbyStations(); setSheetVisible(true); }} accessibilityLabel="Trạm gần tôi" accessibilityHint="Hiển thị danh sách trạm sạc gần vị trí hiện tại">
          <Icon name="place" size={22} color={colors.accent} />
        </TouchableOpacity>
        {/* Lịch sử phiên sạc */}
        <TouchableOpacity style={styles.fab} onPress={()=> navigation.navigate('History', { screen: 'ChargingHistory' })} accessibilityLabel="Lịch sử sạc" accessibilityHint="Xem lịch sử các phiên sạc">
          <Icon name="history" size={22} color={colors.accent} />
        </TouchableOpacity>
        {/* Lịch sử đặt chỗ */}
        <TouchableOpacity style={styles.fab} onPress={()=> navigation.navigate('MyBookingsScreen')} accessibilityLabel="Lịch sử đặt chỗ" accessibilityHint="Xem danh sách các đặt chỗ của tôi">
          <Icon name="event-note" size={22} color={colors.accent} />
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

