import React from 'react';
import { View, StyleSheet } from 'react-native';
import { Card, Text, Title, IconButton } from 'react-native-paper';
import { theme } from '../../config/theme';

const SessionCard = ({ session, onPress }) => {
  if (!session) return null;

  const formatDate = (dateString) => {
    const options = { year: 'numeric', month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit' };
    return new Date(dateString).toLocaleDateString('vi-VN', options);
  };

  return (
    <Card style={styles.card} onPress={onPress}>
      <View style={styles.cardContent}>
        <View style={styles.iconContainer}>
          <IconButton
            icon="history"
            size={32}
            color={theme.colors.primary}
            style={styles.icon}
          />
        </View>
        <View style={styles.detailsContainer}>
          <Title style={styles.title}>{session.station_name}</Title>
          <Text style={styles.date}>{formatDate(session.start_time)}</Text>
          <View style={styles.statsRow}>
            <View style={styles.statItem}>
              <IconButton icon="flash" size={16} color={theme.colors.onSurface + '80'} style={styles.statIcon} />
              <Text style={styles.statText}>{session.energy_consumed?.toFixed(2)} kWh</Text>
            </View>
            <View style={styles.statItem}>
              <IconButton icon="cash" size={16} color={theme.colors.onSurface + '80'} style={styles.statIcon} />
              <Text style={styles.statText}>{session.cost?.toLocaleString('vi-VN')} ₫</Text>
            </View>
          </View>
        </View>
        <View style={styles.chevronContainer}>
          <IconButton
            icon="chevron-right"
            size={28}
            color={theme.colors.onSurface + '40'}
          />
        </View>
      </View>
    </Card>
  );
};

const styles = StyleSheet.create({
  card: {
    marginBottom: 16,
    backgroundColor: theme.colors.surface,
  },
  cardContent: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
  },
  iconContainer: {
    marginRight: 12,
  },
  icon: {
    backgroundColor: theme.colors.primary + '20',
  },
  detailsContainer: {
    flex: 1,
  },
  title: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  date: {
    fontSize: 14,
    color: theme.colors.onSurface + '90',
    marginBottom: 8,
  },
  statsRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  statItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginRight: 16,
  },
  statIcon: {
    margin: 0,
    marginRight: 4,
  },
  statText: {
    fontSize: 14,
    fontWeight: '500',
  },
  chevronContainer: {
    justifyContent: 'center',
  },
});

export default SessionCard;

