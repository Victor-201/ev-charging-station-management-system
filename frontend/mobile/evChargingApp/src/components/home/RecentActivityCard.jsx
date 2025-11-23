import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { useTheme } from 'react-native-paper';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';

const ActivityItem = ({ icon, title, subtitle, time, iconBg, iconColor }) => {
  const { colors } = useTheme();

  return (
    <View style={styles.activityItem}>
      <View style={[styles.iconCircle, { backgroundColor: iconBg || colors.primaryContainer }]}>
        <Icon name={icon} size={24} color={iconColor || colors.primary} />
      </View>
      <View style={styles.activityContent}>
        <Text style={[styles.activityTitle, { color: colors.onBackground }]}>
          {title}
        </Text>
        <Text style={[styles.activitySubtitle, { color: colors.onSurfaceVariant }]}>
          {subtitle}
        </Text>
      </View>
      <Text style={[styles.activityTime, { color: colors.onSurfaceVariant }]}>
        {time}
      </Text>
    </View>
  );
};

export default function RecentActivityCard({ activities, onViewAll }) {
  const { colors } = useTheme();

  if (!activities || activities.length === 0) {
    return null;
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={[styles.sectionTitle, { color: colors.onBackground }]}>
          Hoạt động gần đây
        </Text>
        <TouchableOpacity onPress={onViewAll} activeOpacity={0.7}>
          <Text style={[styles.viewAllText, { color: colors.primary }]}>
            Xem tất cả
          </Text>
        </TouchableOpacity>
      </View>

      <View style={[styles.card, { backgroundColor: colors.surface }]}>
        {activities.map((activity, index) => (
          <React.Fragment key={index}>
            <ActivityItem {...activity} />
            {index < activities.length - 1 && (
              <View style={[styles.divider, { backgroundColor: colors.outlineVariant }]} />
            )}
          </React.Fragment>
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: 20,
    marginBottom: 20,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
  },
  viewAllText: {
    fontSize: 14,
    fontWeight: '600',
  },
  card: {
    borderRadius: 16,
    padding: 16,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  activityItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
  },
  iconCircle: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  activityContent: {
    flex: 1,
  },
  activityTitle: {
    fontSize: 15,
    fontWeight: '600',
    marginBottom: 4,
  },
  activitySubtitle: {
    fontSize: 13,
  },
  activityTime: {
    fontSize: 12,
  },
  divider: {
    height: 1,
    marginVertical: 4,
  },
});

