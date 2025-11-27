import React from 'react';
import { View, StyleSheet, TouchableOpacity } from 'react-native';
import { Card, Text, Button, useTheme, Chip } from 'react-native-paper';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';

/**
 * PlanCard Component
 * Displays a subscription plan with details and action button
 * 
 * @param {Object} props
 * @param {Object} props.plan - Plan data object
 * @param {string} props.plan.id - Plan ID
 * @param {string} props.plan.name - Plan name
 * @param {string} props.plan.description - Plan description
 * @param {number} props.plan.price - Price in VND
 * @param {string} props.plan.duration - Duration text (e.g., "1 month")
 * @param {boolean} props.isActive - Whether user has active subscription to this plan
 * @param {Function} props.onSubscribe - Callback when subscribe button pressed
 * @param {Function} props.onCancel - Callback when cancel button pressed
 * @param {boolean} props.loading - Loading state
 */
const PlanCard = ({
  plan,
  isActive = false,
  onSubscribe,
  onCancel,
  loading = false,
}) => {
  const { colors } = useTheme();
  const styles = getStyles(colors);

  if (!plan) return null;

  const formatPrice = (price) => {
    return new Intl.NumberFormat('vi-VN', {
      style: 'currency',
      currency: 'VND',
      minimumFractionDigits: 0,
    }).format(price);
  };

  return (
    <Card style={[styles.card, isActive && styles.activeCard]}>
      {/* Active Badge */}
      {isActive && (
        <View style={styles.activeBadge}>
          <MaterialCommunityIcons
            name="check-circle"
            size={16}
            color={colors.success}
            style={{ marginRight: 4 }}
          />
          <Text style={styles.activeBadgeText}>Đang sử dụng</Text>
        </View>
      )}

      <Card.Content style={styles.content}>
        {/* Plan Name */}
        <Text variant="headlineSmall" style={styles.planName}>
          {plan.name}
        </Text>

        {/* Plan Description */}
        <Text variant="bodyMedium" style={styles.description}>
          {plan.description}
        </Text>

        {/* Price and Duration */}
        <View style={styles.priceSection}>
          <View>
            <Text variant="labelSmall" style={styles.priceLabel}>
              Giá
            </Text>
            <Text variant="headlineMedium" style={styles.price}>
              {formatPrice(plan.price)}
            </Text>
          </View>
          <View style={styles.durationBadge}>
            <MaterialCommunityIcons
              name="calendar-month"
              size={16}
              color={colors.primary}
              style={{ marginRight: 4 }}
            />
            <Text style={styles.durationText}>
              {plan.duration || 'Không giới hạn'}
            </Text>
          </View>
        </View>

        {/* Benefits/Features */}
        {plan.features && plan.features.length > 0 && (
          <View style={styles.featuresSection}>
            <Text variant="labelMedium" style={styles.featuresTitle}>
              Quyền lợi:
            </Text>
            {plan.features.map((feature, index) => (
              <View key={index} style={styles.featureItem}>
                <MaterialCommunityIcons
                  name="check"
                  size={16}
                  color={colors.success}
                  style={{ marginRight: 8 }}
                />
                <Text variant="bodySmall" style={styles.featureText}>
                  {feature}
                </Text>
              </View>
            ))}
          </View>
        )}

        {/* Action Button */}
        <View style={styles.actionSection}>
          {isActive ? (
            <Button
              mode="outlined"
              icon="close-circle-outline"
              onPress={onCancel}
              loading={loading}
              disabled={loading}
              textColor={colors.error}
              style={styles.cancelButton}
            >
              Hủy đăng ký
            </Button>
          ) : (
            <Button
              mode="contained"
              icon="plus-circle"
              onPress={onSubscribe}
              loading={loading}
              disabled={loading}
              style={styles.subscribeButton}
            >
              Đăng ký ngay
            </Button>
          )}
        </View>
      </Card.Content>
    </Card>
  );
};

const getStyles = (colors) =>
  StyleSheet.create({
    card: {
      marginHorizontal: 16,
      marginVertical: 8,
      backgroundColor: colors.surface,
      borderRadius: 12,
      overflow: 'hidden',
      borderWidth: 1,
      borderColor: colors.outlineVariant,
    },
    activeCard: {
      borderColor: colors.success,
      borderWidth: 2,
      backgroundColor: colors.success + '08',
    },
    activeBadge: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: colors.success + '20',
      paddingHorizontal: 12,
      paddingVertical: 6,
      marginBottom: 12,
    },
    activeBadgeText: {
      color: colors.success,
      fontSize: 12,
      fontWeight: '600',
    },
    content: {
      paddingVertical: 16,
    },
    planName: {
      color: colors.onSurface,
      fontWeight: 'bold',
      marginBottom: 8,
    },
    description: {
      color: colors.onSurfaceVariant,
      marginBottom: 16,
      lineHeight: 20,
    },
    priceSection: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginBottom: 16,
      paddingBottom: 12,
      borderBottomWidth: 1,
      borderBottomColor: colors.outlineVariant,
    },
    priceLabel: {
      color: colors.onSurfaceVariant,
      marginBottom: 4,
    },
    price: {
      color: colors.primary,
      fontWeight: 'bold',
    },
    durationBadge: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: colors.primary + '15',
      paddingHorizontal: 12,
      paddingVertical: 8,
      borderRadius: 8,
    },
    durationText: {
      color: colors.primary,
      fontSize: 12,
      fontWeight: '600',
    },
    featuresSection: {
      marginVertical: 12,
    },
    featuresTitle: {
      color: colors.onSurface,
      fontWeight: '600',
      marginBottom: 8,
    },
    featureItem: {
      flexDirection: 'row',
      alignItems: 'center',
      marginVertical: 4,
    },
    featureText: {
      color: colors.onSurfaceVariant,
      flex: 1,
    },
    actionSection: {
      marginTop: 16,
    },
    subscribeButton: {
      backgroundColor: colors.primary,
    },
    cancelButton: {
      borderColor: colors.error,
    },
  });

export default PlanCard;

