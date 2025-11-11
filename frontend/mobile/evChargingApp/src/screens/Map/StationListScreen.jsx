import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  TextInput,
  ActivityIndicator,
  RefreshControl,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import Icon from 'react-native-vector-icons/MaterialIcons';
import { useTheme } from 'react-native-paper';
import stationService from '../../services/stationService';

const StationListScreen = () => {
  const navigation = useNavigation();
  const { colors } = useTheme();
  const styles = getStyles(colors);

  const [stations, setStations] = useState([]);
  const [filteredStations, setFilteredStations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState('distance'); // distance, name, rating, availability

  useEffect(() => {
    loadStations();
  }, []);

  useEffect(() => {
    filterAndSortStations();
  }, [searchQuery, sortBy, stations]);

  const loadStations = async () => {
    try {
      setLoading(true);
      const response = await stationService.getNearby(10.7769, 106.7009, 50);
      setStations(response.data || []);
    } catch (error) {
      console.error('Error loading stations:', error);
    } finally {
      setLoading(false);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await loadStations();
    setRefreshing(false);
  };

  const filterAndSortStations = () => {
    let result = [...stations];

    // Filter by search query
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      result = result.filter(
        (station) =>
          station.name.toLowerCase().includes(query) ||
          station.address.toLowerCase().includes(query)
      );
    }

    // Sort
    switch (sortBy) {
      case 'distance':
        result.sort((a, b) => (a.distance || 0) - (b.distance || 0));
        break;
      case 'name':
        result.sort((a, b) => a.name.localeCompare(b.name));
        break;
      case 'rating':
        result.sort((a, b) => (b.rating || 0) - (a.rating || 0));
        break;
      case 'availability':
        result.sort((a, b) => (b.available_ports || 0) - (a.available_ports || 0));
        break;
      default:
        break;
    }

    setFilteredStations(result);
  };

  const handleStationPress = (station) => {
    navigation.navigate('StationDetail', { id: station.id, station });
  };

  const getStatusColor = (station) => {
    if (station.status !== 'active') return colors.error;
    if (station.available_ports === 0) return colors.warning;
    return colors.success;
  };

  const getStatusText = (station) => {
    if (station.status !== 'active') return 'Bảo trì';
    if (station.available_ports === 0) return 'Hết chỗ';
    return 'Có sẵn';
  };

  const renderSortButton = (label, value) => (
    <TouchableOpacity
      style={[styles.sortButton, sortBy === value && styles.sortButtonActive]}
      onPress={() => setSortBy(value)}
    >
      <Text style={[styles.sortButtonText, sortBy === value && styles.sortButtonTextActive]}>
        {label}
      </Text>
    </TouchableOpacity>
  );

  const renderStationItem = ({ item }) => (
    <TouchableOpacity style={styles.stationCard} onPress={() => handleStationPress(item)}>
      <View style={styles.stationHeader}>
        <View style={styles.stationTitleRow}>
          <Icon name="ev-station" size={24} color={colors.primary} />
          <Text style={styles.stationName} numberOfLines={1}>
            {item.name}
          </Text>
        </View>
        <View style={[styles.statusBadge, { backgroundColor: getStatusColor(item) }]}>
          <Text style={styles.statusText}>{getStatusText(item)}</Text>
        </View>
      </View>

      <View style={styles.stationInfo}>
        <Icon name="location-on" size={16} color={colors.onSurfaceVariant} />
        <Text style={styles.addressText} numberOfLines={2}>
          {item.address}
        </Text>
      </View>

      <View style={styles.stationDetails}>
        <View style={styles.detailItem}>
          <Icon name="power" size={18} color={colors.primary} />
          <Text style={styles.detailText}>
            {item.available_ports}/{item.total_ports} cổng
          </Text>
        </View>

        {item.distance !== undefined && (
          <View style={styles.detailItem}>
            <Icon name="near-me" size={18} color={colors.primary} />
            <Text style={styles.detailText}>{item.distance.toFixed(1)} km</Text>
          </View>
        )}

        {item.rating && (
          <View style={styles.detailItem}>
            <Icon name="star" size={18} color={colors.warning} />
            <Text style={styles.detailText}>{item.rating.toFixed(1)}</Text>
          </View>
        )}

        {item.price_per_kwh && (
          <View style={styles.detailItem}>
            <Icon name="attach-money" size={18} color={colors.success} />
            <Text style={styles.detailText}>{item.price_per_kwh.toLocaleString()}đ/kWh</Text>
          </View>
        )}
      </View>

      {item.connector_types && item.connector_types.length > 0 && (
        <View style={styles.connectorTypes}>
          {item.connector_types.map((type, index) => (
            <View key={index} style={styles.connectorBadge}>
              <Text style={styles.connectorText}>{type}</Text>
            </View>
          ))}
        </View>
      )}
    </TouchableOpacity>
  );

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.primary} />
          <Text style={styles.loadingText}>Đang tải danh sách trạm sạc...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
          <Icon name="arrow-back" size={24} color={colors.onSurface} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Danh sách trạm sạc</Text>
        <View style={styles.placeholder} />
      </View>

      {/* Search Bar */}
      <View style={styles.searchContainer}>
        <Icon name="search" size={20} color={colors.onSurfaceVariant} style={styles.searchIcon} />
        <TextInput
          style={styles.searchInput}
          placeholder="Tìm kiếm trạm sạc..."
          placeholderTextColor={colors.onSurfaceVariant}
          value={searchQuery}
          onChangeText={setSearchQuery}
        />
        {searchQuery.length > 0 && (
          <TouchableOpacity onPress={() => setSearchQuery('')}>
            <Icon name="close" size={20} color={colors.onSurfaceVariant} />
          </TouchableOpacity>
        )}
      </View>

      {/* Sort Options */}
      <View style={styles.sortContainer}>
        <Text style={styles.sortLabel}>Sắp xếp:</Text>
        {renderSortButton('Khoảng cách', 'distance')}
        {renderSortButton('Tên', 'name')}
        {renderSortButton('Đánh giá', 'rating')}
        {renderSortButton('Có sẵn', 'availability')}
      </View>

      {/* Station List */}
      <FlatList
        data={filteredStations}
        renderItem={renderStationItem}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.listContainer}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={[colors.primary]} />}
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Icon name="search-off" size={64} color={colors.onSurfaceVariant} />
            <Text style={styles.emptyText}>Không tìm thấy trạm sạc nào</Text>
            <Text style={styles.emptySubtext}>Thử thay đổi từ khóa tìm kiếm</Text>
          </View>
        }
      />

      {/* Results Count */}
      {filteredStations.length > 0 && (
        <View style={styles.resultsCount}>
          <Text style={styles.resultsText}>
            Tìm thấy {filteredStations.length} trạm sạc
          </Text>
        </View>
      )}
    </SafeAreaView>
  );
};

const getStyles = (colors) =>
  StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: colors.background,
    },
    loadingContainer: {
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center',
    },
    loadingText: {
      marginTop: 16,
      fontSize: 16,
      color: colors.onSurfaceVariant,
    },
    header: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      paddingHorizontal: 16,
      paddingVertical: 12,
      borderBottomWidth: 1,
      borderBottomColor: colors.surfaceVariant,
    },
    backButton: {
      padding: 8,
    },
    headerTitle: {
      fontSize: 18,
      fontWeight: 'bold',
      color: colors.onSurface,
    },
    placeholder: {
      width: 40,
    },
    searchContainer: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: colors.surfaceVariant,
      marginHorizontal: 16,
      marginTop: 12,
      paddingHorizontal: 12,
      borderRadius: 12,
    },
    searchIcon: {
      marginRight: 8,
    },
    searchInput: {
      flex: 1,
      paddingVertical: 12,
      fontSize: 16,
      color: colors.onSurface,
    },
    sortContainer: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingHorizontal: 16,
      paddingVertical: 12,
      gap: 8,
    },
    sortLabel: {
      fontSize: 14,
      fontWeight: '600',
      color: colors.onSurface,
      marginRight: 4,
    },
    sortButton: {
      paddingHorizontal: 12,
      paddingVertical: 6,
      borderRadius: 16,
      backgroundColor: colors.surfaceVariant,
    },
    sortButtonActive: {
      backgroundColor: colors.primary,
    },
    sortButtonText: {
      fontSize: 13,
      color: colors.onSurfaceVariant,
      fontWeight: '500',
    },
    sortButtonTextActive: {
      color: colors.onPrimary,
    },
    listContainer: {
      padding: 16,
      paddingBottom: 80,
    },
    stationCard: {
      backgroundColor: colors.surface,
      borderRadius: 16,
      padding: 16,
      marginBottom: 12,
      elevation: 2,
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.1,
      shadowRadius: 4,
    },
    stationHeader: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'flex-start',
      marginBottom: 12,
    },
    stationTitleRow: {
      flexDirection: 'row',
      alignItems: 'center',
      flex: 1,
      gap: 8,
    },
    stationName: {
      fontSize: 16,
      fontWeight: 'bold',
      color: colors.onSurface,
      flex: 1,
    },
    statusBadge: {
      paddingHorizontal: 10,
      paddingVertical: 4,
      borderRadius: 12,
    },
    statusText: {
      fontSize: 11,
      fontWeight: '600',
      color: '#fff',
    },
    stationInfo: {
      flexDirection: 'row',
      alignItems: 'flex-start',
      marginBottom: 12,
      gap: 4,
    },
    addressText: {
      flex: 1,
      fontSize: 14,
      color: colors.onSurfaceVariant,
      lineHeight: 20,
    },
    stationDetails: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      gap: 12,
      marginBottom: 8,
    },
    detailItem: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 4,
    },
    detailText: {
      fontSize: 13,
      color: colors.onSurface,
      fontWeight: '500',
    },
    connectorTypes: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      gap: 6,
      marginTop: 8,
    },
    connectorBadge: {
      backgroundColor: colors.primaryContainer,
      paddingHorizontal: 10,
      paddingVertical: 4,
      borderRadius: 8,
    },
    connectorText: {
      fontSize: 11,
      fontWeight: '600',
      color: colors.onPrimaryContainer,
    },
    emptyContainer: {
      alignItems: 'center',
      justifyContent: 'center',
      paddingVertical: 60,
    },
    emptyText: {
      fontSize: 18,
      fontWeight: '600',
      color: colors.onSurface,
      marginTop: 16,
    },
    emptySubtext: {
      fontSize: 14,
      color: colors.onSurfaceVariant,
      marginTop: 8,
    },
    resultsCount: {
      position: 'absolute',
      bottom: 16,
      left: 16,
      right: 16,
      backgroundColor: colors.primary,
      paddingVertical: 12,
      paddingHorizontal: 16,
      borderRadius: 12,
      alignItems: 'center',
      elevation: 4,
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.2,
      shadowRadius: 4,
    },
    resultsText: {
      fontSize: 14,
      fontWeight: '600',
      color: colors.onPrimary,
    },
  });

export default StationListScreen;

