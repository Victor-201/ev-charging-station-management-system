import { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useTheme } from 'react-native-paper';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';

const ISSUE_TYPES = [
  { id: 'not_working', label: 'Trạm không hoạt động', icon: 'alert-circle' },
  { id: 'connector_fault', label: 'Đầu sạc bị lỗi', icon: 'power-plug-off' },
  { id: 'payment_issue', label: 'Lỗi thanh toán', icon: 'credit-card-off' },
  { id: 'slow_charging', label: 'Sạc chậm', icon: 'speedometer-slow' },
  { id: 'dirty', label: 'Trạm bẩn/hư hỏng', icon: 'broom' },
  { id: 'occupied', label: 'Bị chiếm chỗ', icon: 'car-off' },
  { id: 'other', label: 'Vấn đề khác', icon: 'dots-horizontal' },
];

const ReportIssueScreen = ({ route, navigation }) => {
  const { colors } = useTheme();
  const { station } = route.params || {};

  const [selectedIssue, setSelectedIssue] = useState(null);
  const [description, setDescription] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async () => {
    if (!selectedIssue) {
      Alert.alert('Lỗi', 'Vui lòng chọn loại vấn đề');
      return;
    }

    if (!description.trim()) {
      Alert.alert('Lỗi', 'Vui lòng mô tả chi tiết vấn đề');
      return;
    }

    setIsSubmitting(true);

    // Simulate API call
    setTimeout(() => {
      setIsSubmitting(false);
      Alert.alert(
        'Thành công',
        'Báo cáo của bạn đã được gửi. Chúng tôi sẽ xử lý trong thời gian sớm nhất.',
        [
          {
            text: 'OK',
            onPress: () => navigation.goBack(),
          },
        ]
      );
    }, 1500);
  };

  const styles = StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: colors.background,
    },
    scrollContent: {
      padding: 16,
    },
    section: {
      marginBottom: 24,
    },
    sectionTitle: {
      fontSize: 16,
      fontWeight: '600',
      color: colors.onSurface,
      marginBottom: 12,
    },
    stationInfo: {
      backgroundColor: colors.surface,
      padding: 16,
      borderRadius: 12,
      marginBottom: 24,
    },
    stationName: {
      fontSize: 18,
      fontWeight: '600',
      color: colors.onSurface,
      marginBottom: 4,
    },
    stationAddress: {
      fontSize: 14,
      color: colors.onSurfaceVariant,
    },
    issueGrid: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      gap: 12,
    },
    issueCard: {
      width: '48%',
      backgroundColor: colors.surface,
      padding: 16,
      borderRadius: 12,
      borderWidth: 2,
      borderColor: 'transparent',
      alignItems: 'center',
    },
    issueCardSelected: {
      borderColor: colors.primary,
      backgroundColor: colors.primaryContainer,
    },
    issueIcon: {
      marginBottom: 8,
    },
    issueLabel: {
      fontSize: 13,
      color: colors.onSurface,
      textAlign: 'center',
    },
    issueLabelSelected: {
      color: colors.primary,
      fontWeight: '600',
    },
    textInput: {
      backgroundColor: colors.surface,
      borderRadius: 12,
      padding: 16,
      fontSize: 15,
      color: colors.onSurface,
      minHeight: 120,
      textAlignVertical: 'top',
      borderWidth: 1,
      borderColor: colors.outline,
    },
    textInputFocused: {
      borderColor: colors.primary,
    },
    charCount: {
      fontSize: 12,
      color: colors.onSurfaceVariant,
      textAlign: 'right',
      marginTop: 8,
    },
    submitButton: {
      backgroundColor: colors.primary,
      padding: 16,
      borderRadius: 12,
      alignItems: 'center',
      marginTop: 24,
    },
    submitButtonDisabled: {
      backgroundColor: colors.surfaceVariant,
    },
    submitButtonText: {
      fontSize: 16,
      fontWeight: '600',
      color: colors.onPrimary,
    },
    submitButtonTextDisabled: {
      color: colors.onSurfaceVariant,
    },
    noteBox: {
      backgroundColor: colors.secondaryContainer,
      padding: 12,
      borderRadius: 8,
      flexDirection: 'row',
      gap: 12,
    },
    noteText: {
      flex: 1,
      fontSize: 13,
      color: colors.onSecondaryContainer,
      lineHeight: 18,
    },
  });

  return (
    <SafeAreaView style={styles.container} edges={['bottom']}>
      <ScrollView
        style={styles.container}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Station Info */}
        {station && (
          <View style={styles.stationInfo}>
            <Text style={styles.stationName}>{station.name}</Text>
            <Text style={styles.stationAddress}>{station.address}</Text>
          </View>
        )}

        {/* Issue Type Selection */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Loại vấn đề *</Text>
          <View style={styles.issueGrid}>
            {ISSUE_TYPES.map((issue) => (
              <TouchableOpacity
                key={issue.id}
                style={[
                  styles.issueCard,
                  selectedIssue === issue.id && styles.issueCardSelected,
                ]}
                onPress={() => setSelectedIssue(issue.id)}
              >
                <Icon
                  name={issue.icon}
                  size={32}
                  color={
                    selectedIssue === issue.id
                      ? colors.primary
                      : colors.onSurfaceVariant
                  }
                  style={styles.issueIcon}
                />
                <Text
                  style={[
                    styles.issueLabel,
                    selectedIssue === issue.id && styles.issueLabelSelected,
                  ]}
                >
                  {issue.label}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Description */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Mô tả chi tiết *</Text>
          <TextInput
            style={styles.textInput}
            placeholder="Vui lòng mô tả chi tiết vấn đề bạn gặp phải..."
            placeholderTextColor={colors.onSurfaceVariant}
            multiline
            numberOfLines={6}
            maxLength={500}
            value={description}
            onChangeText={setDescription}
          />
          <Text style={styles.charCount}>{description.length}/500</Text>
        </View>

        {/* Note */}
        <View style={styles.noteBox}>
          <Icon
            name="information"
            size={20}
            color={colors.onSecondaryContainer}
          />
          <Text style={styles.noteText}>
            Báo cáo của bạn sẽ được gửi đến đội ngũ vận hành. Chúng tôi sẽ xử
            lý và phản hồi trong vòng 24 giờ.
          </Text>
        </View>

        {/* Submit Button */}
        <TouchableOpacity
          style={[
            styles.submitButton,
            (!selectedIssue || !description.trim() || isSubmitting) &&
              styles.submitButtonDisabled,
          ]}
          onPress={handleSubmit}
          disabled={!selectedIssue || !description.trim() || isSubmitting}
        >
          <Text
            style={[
              styles.submitButtonText,
              (!selectedIssue || !description.trim() || isSubmitting) &&
                styles.submitButtonTextDisabled,
            ]}
          >
            {isSubmitting ? 'Đang gửi...' : 'Gửi báo cáo'}
          </Text>
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
};

export default ReportIssueScreen;

