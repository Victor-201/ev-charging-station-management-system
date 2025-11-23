import { useEffect, useState } from 'react';
import { View, FlatList, ActivityIndicator, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useTheme } from 'react-native-paper';
import Geolocation from '@react-native-community/geolocation';
import StationCard from '../../components/station/StationCard';
import stationService from '../../services/stationService';

export default function StationListScreen({ route, navigation }) {
  const { colors } = useTheme();
  const [loading, setLoading] = useState(true);
  const [stations, setStations] = useState(route.params?.stations || []);

  const fetchNearby = async (lat, lng) => {
    try {
      setLoading(true);
      const list = await stationService.searchStations(lat, lng, 5);
      setStations(list);
    } catch (e) {
      console.error('fetchNearby error:', e);
      Alert.alert('Lỗi', 'Không thể tải danh sách trạm sạc');
    } finally { setLoading(false); }
  };

  useEffect(() => {
    if (stations.length === 0) {
      Geolocation.getCurrentPosition(
        (pos) => fetchNearby(pos.coords.latitude, pos.coords.longitude),
        () => fetchNearby(10.77978, 106.699)
      );
    } else {
      setLoading(false);
    }
  }, []);

  const onBook = (station) => navigation.navigate('StationDetailScreen', { stationId: String(station.id || station.station_id) });
  const onDirections = (station) => navigation.navigate('MapMain', { focusStationId: String(station.id || station.station_id) });
  const onPress = (station) => navigation.navigate('StationDetailScreen', { stationId: String(station.id || station.station_id) });

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.background }}>
      {loading ? (
        <View style={{ flex:1, justifyContent:'center', alignItems:'center' }}>
          <ActivityIndicator size="large" color={colors.primary} />
        </View>
      ) : (
        <FlatList
          data={stations}
          keyExtractor={(item) => String(item.id || item.station_id)}
          renderItem={({ item }) => (
            <StationCard station={item} onBook={onBook} onDirections={onDirections} onPress={onPress} />
          )}
          contentContainerStyle={{ padding: 16 }}
        />
      )}
    </SafeAreaView>
  );
}

