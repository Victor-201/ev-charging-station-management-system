import { useEffect, useMemo, useRef, useState, useCallback } from 'react';
import { View, Text, ActivityIndicator, Platform, Alert, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import MapView, { Marker } from 'react-native-maps';
import WebView from 'react-native-webview';
import Geolocation from '@react-native-community/geolocation';
import { useTheme } from 'react-native-paper';
import { useBottomTabBarHeight } from '@react-navigation/bottom-tabs';
import stationService from '../../services/stationService';
import StationsBottomSheet from '../../components/station/StationsBottomSheet';
import mapService from '../../services/mapService';
import AnimatedFAB from '../../components/common/AnimatedFAB';
import useDebounce from '../../hooks/useDebounce';
import useRealTimeUpdates from '../../hooks/useRealTimeUpdates';
import { logger } from '../../utils/logger';
import { GEOLOCATION, MAP_CONFIG, TIMING } from '../../config/constants';

const DEFAULT_REGION = {
  latitude: GEOLOCATION.DEFAULT_LATITUDE,
  longitude: GEOLOCATION.DEFAULT_LONGITUDE,
  latitudeDelta: GEOLOCATION.DEFAULT_LATITUDE_DELTA,
  longitudeDelta: GEOLOCATION.DEFAULT_LONGITUDE_DELTA
};

const getStyles = (colors) => StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  map: { width: '100%', height: '100%' },
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
  const [searchCoords, setSearchCoords] = useState(null); // Coordinates to search for stations

  const tabBarHeight = useBottomTabBarHeight();

  // Debounce search coordinates to avoid excessive API calls
  const debouncedSearchCoords = useDebounce(searchCoords, TIMING.DEBOUNCE_DELAY);

  const goToMyLocation = () => {
    Geolocation.getCurrentPosition(
      (pos) => {
        const { latitude, longitude } = pos.coords;
        const newLocation = { latitude, longitude };
        setUserLocation(newLocation);

        const newRegion = { ...newLocation, latitudeDelta: 0.02, longitudeDelta: 0.02 };
        mapRef.current?.animateToRegion(newRegion, TIMING.MAP_ANIMATION_DURATION);
        setSearchCoords({ lat: latitude, lng: longitude });
      },
      (error) => {
        logger.error('Geolocation error:', error?.message || error);
        Alert.alert(
          'Lỗi vị trí',
          'Không thể lấy vị trí hiện tại của bạn. Sử dụng vị trí mặc định.'
        );
        // Use default region as fallback
        if (region) {
          setSearchCoords({ lat: region.latitude, lng: region.longitude });
        }
      },
      {
        enableHighAccuracy: GEOLOCATION.ENABLE_HIGH_ACCURACY,
        timeout: GEOLOCATION.TIMEOUT,
        maximumAge: GEOLOCATION.MAXIMUM_AGE
      }
    );
  };

  const findNearbyStations = () => {
    if (userLocation) {
      setSearchCoords({ lat: userLocation.latitude, lng: userLocation.longitude });
    } else {
      // Fallback if user location is not yet available
      goToMyLocation();
    }
  };

  const fetchStations = async (lat, lng, radiusKm = GEOLOCATION.SEARCH_RADIUS_KM) => {
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

  // Initial location fetch
  useEffect(() => {
    Geolocation.getCurrentPosition(
      (pos) => {
        const { latitude, longitude } = pos.coords;
        const location = { latitude, longitude };
        setUserLocation(location);
        setRegion({ ...location, latitudeDelta: 0.05, longitudeDelta: 0.05 });
        setSearchCoords({ lat: latitude, lng: longitude });
      },
      (error) => {
        logger.warn('Could not get initial location, using default:', error?.message);
        // Fallback to default region
        setRegion(DEFAULT_REGION);
        setSearchCoords({ lat: DEFAULT_REGION.latitude, lng: DEFAULT_REGION.longitude });
      },
      {
        enableHighAccuracy: GEOLOCATION.ENABLE_HIGH_ACCURACY,
        timeout: GEOLOCATION.TIMEOUT,
        maximumAge: GEOLOCATION.MAXIMUM_AGE
      }
    );
  }, []);

  // Fetch stations when debounced search coordinates change
  useEffect(() => {
    if (debouncedSearchCoords) {
      fetchStations(debouncedSearchCoords.lat, debouncedSearchCoords.lng, 5);
    }
  }, [debouncedSearchCoords]);

  // Socket events for real-time station availability updates
  const socketEventHandlers = useMemo(() => ({
    'station_availability_updated': (data) => {
      // Update station availability in real-time
      setStations(prevStations =>
        prevStations.map(station =>
          station.id === data.stationId
            ? { ...station, available_ports: data.availablePorts, status: data.status }
            : station
        )
      );
    },
    'station_status_changed': (data) => {
      // Update station status (online/offline/maintenance)
      setStations(prevStations =>
        prevStations.map(station =>
          station.id === data.stationId
            ? { ...station, status: data.status }
            : station
        )
      );
    },
  }), []);

  // Subscribe to real-time station updates
  useRealTimeUpdates(socketEventHandlers, true);

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
      const messageData = e?.nativeEvent?.data;

      // Validate message data exists before parsing
      if (!messageData || typeof messageData !== 'string') {
        logger.warn('Invalid WebView message data:', messageData);
        return;
      }

      const data = JSON.parse(messageData);

      // Validate parsed data structure
      if (!data || typeof data !== 'object') {
        logger.warn('Invalid WebView message structure:', data);
        return;
      }

      // Handle station tap event
      if (data.t === 'tap' && data.id) {
        const stationId = String(data.id).trim();
        if (stationId) {
          navigation.navigate('StationDetailScreen', { stationId });
        } else {
          logger.warn('Invalid station ID from WebView tap:', data.id);
        }
      }

      // Handle map move event
      if (data.t === 'move' && typeof data.lat === 'number' && typeof data.lng === 'number') {
        setSearchCoords({ lat: data.lat, lng: data.lng });
      }
    } catch (error) {
      logger.error('Error parsing WebView message:', error?.message || error);
    }
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
        <AnimatedFAB
          icon="my-location"
          onPress={goToMyLocation}
          accessibilityLabel="Vị trí của tôi"
          accessibilityHint="Đưa bản đồ về vị trí hiện tại và nạp trạm gần"
        />

        {/* Danh sách trạm gần */}
        <AnimatedFAB
          icon="place"
          onPress={() => { findNearbyStations(); setSheetVisible(true); }}
          accessibilityLabel="Trạm gần tôi"
          accessibilityHint="Hiển thị danh sách trạm sạc gần vị trí hiện tại"
        />

        {/* Lịch sử phiên sạc */}
        <AnimatedFAB
          icon="history"
          onPress={() => navigation.navigate('History', { screen: 'ChargingHistory' })}
          accessibilityLabel="Lịch sử sạc"
          accessibilityHint="Xem lịch sử các phiên sạc"
        />

        {/* Lịch sử đặt chỗ */}
        <AnimatedFAB
          icon="event-note"
          onPress={() => navigation.navigate('MyBookingsScreen')}
          accessibilityLabel="Lịch sử đặt chỗ"
          accessibilityHint="Xem danh sách các đặt chỗ của tôi"
        />
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

