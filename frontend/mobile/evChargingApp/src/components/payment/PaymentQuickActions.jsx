import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { useTheme } from 'react-native-paper';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';

const Action = ({ icon, label, color, onPress }) => {
  const { colors } = useTheme();
  return (
    <TouchableOpacity style={styles.item} onPress={onPress} activeOpacity={0.8}>
      <View style={[styles.iconWrap, { backgroundColor: (color || colors.primary) + '20' }]}> 
        <Icon name={icon} size={22} color={color || colors.primary} />
      </View>
      <Text style={[styles.label, { color: colors.onBackground }]} numberOfLines={2}>{label}</Text>
    </TouchableOpacity>
  );
};

export default function PaymentQuickActions({ actions = [] }) {
  const { colors } = useTheme();
  return (
    <View style={styles.container}>
      <Text style={[styles.title, { color: colors.onBackground }]}>Thao tác nhanh</Text>
      <View style={styles.row}>
        {actions.map((a, idx) => (
          <Action key={idx} {...a} />
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { paddingHorizontal: 20, paddingTop: 16, paddingBottom: 8 },
  title: { fontSize: 18, fontWeight: '700', marginBottom: 12 },
  row: { flexDirection: 'row', justifyContent: 'space-between' },
  item: { width: '23%', alignItems: 'center' },
  iconWrap: { width: 54, height: 54, borderRadius: 14, justifyContent: 'center', alignItems: 'center', marginBottom: 8 },
  label: { fontSize: 12, textAlign: 'center', fontWeight: '600' },
});

