import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { useTheme } from 'react-native-paper';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';

const TimelineEvent = ({ icon, title, time, isFirst, isLast, color }) => {
  const { colors } = useTheme();
  return (
    <View style={styles.eventContainer}>
      <View style={styles.iconColumn}>
        {!isFirst && <View style={[styles.line, { backgroundColor: colors.outline }]} />}
        <View style={[styles.iconWrapper, { backgroundColor: color + '20' }]}>
          <Icon name={icon} size={20} color={color} />
        </View>
        {!isLast && <View style={[styles.line, { backgroundColor: colors.outline }]} />}
      </View>
      <View style={styles.details}>
        <Text style={[styles.eventTitle, { color: colors.onSurface }]}>{title}</Text>
        <Text style={[styles.eventTime, { color: colors.onSurfaceVariant }]}>{time}</Text>
      </View>
    </View>
  );
};

export default function SessionTimeline({ events = [] }) {
  const { colors } = useTheme();

  const eventMap = {
    session_start: { icon: 'play-circle', title: 'Bắt đầu phiên sạc', color: colors.primary },
    charging_progress: { icon: 'flash', title: 'Đang sạc', color: colors.primary },
    session_stop: { icon: 'stop-circle', title: 'Kết thúc phiên sạc', color: colors.error },
    // Add other event types as needed
  };

  if (events.length === 0) return null;

  return (
    <View style={styles.container}>
      <Text style={[styles.title, { color: colors.onBackground }]}>Dòng thời gian</Text>
      <View style={[styles.card, { backgroundColor: colors.surface }]}>
        {events.map((event, index) => {
          const config = eventMap[event.event_type] || { icon: 'help-circle', title: event.event_type, color: colors.onSurfaceVariant };
          return (
            <TimelineEvent 
              key={index}
              icon={config.icon}
              title={config.title}
              time={new Date(event.timestamp).toLocaleTimeString('vi-VN')}
              color={config.color}
              isFirst={index === 0}
              isLast={index === events.length - 1}
            />
          );
        })}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { paddingHorizontal: 16, marginTop: 16 },
  title: { fontSize: 18, fontWeight: '700', marginBottom: 12 },
  card: { borderRadius: 12, paddingVertical: 8, paddingHorizontal: 16 },
  eventContainer: { flexDirection: 'row', alignItems: 'stretch' },
  iconColumn: { alignItems: 'center' },
  line: { flex: 1, width: 2 },
  iconWrapper: { width: 40, height: 40, borderRadius: 20, justifyContent: 'center', alignItems: 'center', marginVertical: 4 },
  details: { flex: 1, justifyContent: 'center', marginLeft: 16 },
  eventTitle: { fontSize: 15, fontWeight: '600' },
  eventTime: { fontSize: 13, marginTop: 2 },
});

