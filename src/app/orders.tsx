import { router } from 'expo-router';
import { use, useEffect, useState } from 'react';
import { Text } from 'react-native';

import { Button, Card, Hero, Message, Row, Screen, brand } from '@/components/cleanodry-ui';
import { getCustomerOrders } from '@/lib/api';
import { AuthContext } from '@/lib/auth-context';

export default function OrdersScreen() {
  const auth = use(AuthContext);
  const [orders, setOrders] = useState<Record<string, unknown>[]>([]);
  const [message, setMessage] = useState('');

  useEffect(() => {
    if (!auth.user) {
      return;
    }
    getCustomerOrders(auth.user.token)
      .then((data) => setOrders(data.orders))
      .catch((error) => setMessage(error instanceof Error ? error.message : 'Could not load orders.'));
  }, [auth.user]);

  if (!auth.user) {
    return (
      <Screen>
        <Hero eyebrow="My account" title="Login required" subtitle="Please login to view orders." />
        <Button title="Go to Login" onPress={() => router.replace('/')} />
      </Screen>
    );
  }

  return (
    <Screen>
      <Hero eyebrow="My account" title="My Orders" subtitle="Track your Cleanodry orders and payment status." />
      <Message text={message} />
      {orders.length === 0 && !message ? <Text style={local.empty}>No orders found.</Text> : null}
      {orders.map((order) => {
        const store = order.store as Record<string, unknown> | null | undefined;
        const amounts = order.amounts as Record<string, unknown> | null | undefined;
        return (
          <Card key={String(order.id)}>
            <Row label="Order" value={String(order.order_number || `#${order.id ?? ''}`)} />
            <Row label="Status" value={String(order.status ?? '')} />
            <Row label="Store" value={String(store?.name ?? '')} />
            <Row label="Items" value={String(order.qty ?? 0)} />
            <Row label="Total" value={`Rs. ${amounts?.display_total ?? amounts?.total ?? 0}`} />
            <Row label="Payment" value={String(order.payment_status ?? 'Pending')} />
            <Row label="Created" value={String(order.created_at ?? '')} />
          </Card>
        );
      })}
    </Screen>
  );
}

const local = {
  empty: {
    color: brand.gray,
    fontSize: 16,
    textAlign: 'center' as const,
  },
};
