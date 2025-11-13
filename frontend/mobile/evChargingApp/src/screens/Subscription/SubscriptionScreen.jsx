import React, { useEffect } from 'react';
import { View, Text, StyleSheet, FlatList } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Button, Card, Title, Paragraph, ActivityIndicator, useTheme } from 'react-native-paper';
import { useDispatch, useSelector } from 'react-redux';
import { getSubscriptions, subscribeToPlan, cancelSubscription } from '../../store/slices/subscriptionSlice';

const SubscriptionScreen = () => {
  const { colors } = useTheme();
  const dispatch = useDispatch();
  const { user } = useSelector((state) => state.auth);
  const { subscriptions, loading, error } = useSelector((state) => state.subscriptions);

  useEffect(() => {
    if (user?.id) {
      dispatch(getSubscriptions(user.id));
    }
  }, [dispatch, user?.id]);

  const handleSubscribe = (planId) => {
    dispatch(subscribeToPlan({ userId: user.id, planId }));
  };

  const handleCancel = (subscriptionId) => {
    dispatch(cancelSubscription({ userId: user.id, subscriptionId }));
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.centered} edges={['top', 'bottom']}>
        <ActivityIndicator />
      </SafeAreaView>
    );
  }

  if (error) {
    return (
      <SafeAreaView style={styles.centered} edges={['top', 'bottom']}>
        <Text>{error}</Text>
      </SafeAreaView>
    );
  }

  const renderItem = ({ item }) => (
    <Card style={styles.card}>
      <Card.Content>
        <Title>{item.plan.name}</Title>
        <Paragraph>{item.plan.description}</Paragraph>
        <Paragraph>Price: {item.plan.price}</Paragraph>
        {item.isActive ? (
          <Button onPress={() => handleCancel(item.id)}>Cancel</Button>
        ) : (
          <Button onPress={() => handleSubscribe(item.plan.id)}>Subscribe</Button>
        )}
      </Card.Content>
    </Card>
  );

  return (
    <SafeAreaView style={styles.container} edges={['top', 'bottom']}>
      <FlatList
        data={subscriptions}
        renderItem={renderItem}
        keyExtractor={(item) => item.id.toString()}
      />
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
  },
  centered: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  card: {
    marginBottom: 16,
  },
});

export default SubscriptionScreen;

