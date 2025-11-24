import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { useTheme } from 'react-native-paper';
import InfoRow from '../common/InfoRow';

export default function SessionInfoCard({ session }) {
  const { colors } = useTheme();

  return (
    <View style={styles.container}>
      <Text style={[styles.title, { color: colors.onBackground }]}>Thông tin phiên sạc</Text>
      <View style={[styles.card, { backgroundColor: colors.surface }]}>
        <InfoRow 
          icon="map-marker-outline"
          label="Trạm sạc"
          value={session?.station_name || 'Không rõ'}
        />
        <InfoRow 
          icon="map-marker-distance"
          label="Địa chỉ"
          value={session?.station_address || 'Không rõ'}
        />
        <InfoRow 
          icon="clock-start"
          label="Bắt đầu"
          value={new Date(session?.start_time).toLocaleString('vi-VN')}
        />
        <InfoRow 
          icon="clock-end"
          label="Kết thúc"
          value={new Date(session?.end_time).toLocaleString('vi-VN')}
          isLast
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: 16,
    marginTop: 16,
  },
  title: {
    fontSize: 18,
    fontWeight: '700',
    marginBottom: 12,
  },
  card: {
    borderRadius: 12,
    padding: 16,
  },
});

