import { use, useEffect, useState } from 'react';

import { AppCard, AppShell, EmptyState } from '@/components/app-shell';
import { Message, Row } from '@/components/cleanodry-ui';
import { getCustomerOrders } from '@/lib/api';
import { AuthContext } from '@/lib/auth-context';
import { formatDate, formatInr } from '@/lib/format';

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

  return (
    <AppShell title="My Orders" subtitle="Track your Cleanodry orders and payment status." icon="orders">
      <Message text={message} />
      {orders.length === 0 && !message ? (
        <EmptyState title="No orders found" subtitle="Your completed Cleanodry orders will appear here." />
      ) : null}
      {orders.map((order) => {
        const store = order.store as Record<string, unknown> | null | undefined;
        const amounts = order.amounts as Record<string, unknown> | null | undefined;
        return (
          <AppCard key={String(order.id)}>
            <Row label="Order" value={String(order.order_number || `#${order.id ?? ''}`)} />
            <Row label="Status" value={String(order.status ?? '')} />
            <Row label="Store" value={String(store?.name ?? '')} />
            <Row label="Items" value={String(order.qty ?? 0)} />
            <Row label="Total" value={formatInr(amounts?.display_total ?? amounts?.total ?? 0)} />
            <Row label="Payment" value={String(order.payment_status ?? 'Pending')} />
            <Row label="Created" value={formatDate(order.created_at)} />
          </AppCard>
        );
      })}
    </AppShell>
  );
}
