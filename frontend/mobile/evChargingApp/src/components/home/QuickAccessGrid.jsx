import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { useTheme } from 'react-native-paper';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';

const QuickAccessItem = ({ icon, label, onPress, iconColor, bgColor }) => {
  const { colors } = useTheme();

  return (
    <TouchableOpacity
      style={styles.item}
      onPress={onPress}
      activeOpacity={0.7}
    >
      <View style={[styles.iconWrapper, { backgroundColor: bgColor || colors.surface }]}>
        <Icon name={icon} size={28} color={iconColor || colors.primary} />
      </View>
      <Text style={[styles.label, { color: colors.onBackground }]} numberOfLines={2}>
        {label}
      </Text>
    </TouchableOpacity>
  );
};

export default function QuickAccessGrid({ items }) {
  const { colors } = useTheme();

  return (
    <View style={styles.container}>
      <Text style={[styles.sectionTitle, { color: colors.onBackground }]}>
        Truy cập nhanh
      </Text>
      <View style={styles.grid}>
        {items.map((item, index) => (
          <QuickAccessItem key={index} {...item} />
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: 20,
    paddingVertical: 16,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 16,
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  item: {
    width: '23%',
    alignItems: 'center',
    marginBottom: 20,
  },
  iconWrapper: {
    width: 60,
    height: 60,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  label: {
    fontSize: 12,
    textAlign: 'center',
    fontWeight: '500',
  },
});

