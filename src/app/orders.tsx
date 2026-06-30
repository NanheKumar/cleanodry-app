import { use, useEffect, useState } from 'react';
import { Text, type TextStyle, View } from 'react-native';

import { AppCard, AppShell, EmptyState } from '@/components/app-shell';
import { Message, brand } from '@/components/cleanodry-ui';
import { ApiError, getCustomerOrders } from '@/lib/api';
import { AuthContext } from '@/lib/auth-context';
import { formatDate, formatInr } from '@/lib/format';

type StatusTone = 'success' | 'warning' | 'neutral';

const tabularNums: TextStyle['fontVariant'] = ['tabular-nums'];

function textValue(value: unknown, fallback = 'Not available') {
  const text = String(value ?? '').trim();
  return text || fallback;
}

function getStatusTone(status: string): StatusTone {
  const normalized = status.toLowerCase();
  if (normalized.includes('delivered') || normalized.includes('complete') || normalized.includes('paid')) {
    return 'success';
  }
  if (normalized.includes('pending') || normalized.includes('process') || normalized.includes('unpaid')) {
    return 'warning';
  }
  return 'neutral';
}

function StatusPill({ label, tone }: { label: string; tone: StatusTone }) {
  return (
    <View style={[styles.statusPill, styles[`${tone}Pill`]]}>
      <View style={[styles.statusDot, styles[`${tone}Dot`]]} />
      <Text style={[styles.statusText, styles[`${tone}Text`]]}>{label}</Text>
    </View>
  );
}

function DetailItem({ label, value }: { label: string; value: string }) {
  return (
    <View style={styles.detailItem}>
      <Text style={styles.detailLabel}>{label}</Text>
      <Text selectable style={styles.detailValue}>
        {value}
      </Text>
    </View>
  );
}

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
      .catch((error) => {
        if (error instanceof ApiError && error.status === 401) {
          auth.signOut();
          return;
        }
        setMessage(error instanceof Error ? error.message : 'Could not load orders.');
      });
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
        const orderNumber = textValue(order.order_number || `#${order.id ?? ''}`, 'Order');
        const status = textValue(order.status, 'In progress');
        const paymentStatus = textValue(order.payment_status, 'Pending');
        const total = formatInr(amounts?.display_total ?? amounts?.total ?? 0);
        const createdAt = formatDate(order.created_at) || 'Date not available';
        const itemCount = textValue(order.qty, '0');

        return (
          <AppCard key={String(order.id)}>
            <View style={styles.cardHeader}>
              <View style={styles.orderTitleWrap}>
                <Text style={styles.orderLabel}>Order</Text>
                <Text selectable style={styles.orderTitle}>
                  {orderNumber}
                </Text>
              </View>
              <StatusPill label={status} tone={getStatusTone(status)} />
            </View>

            <View style={styles.amountBand}>
              <View style={styles.amountCopy}>
                <Text style={styles.amountLabel}>Total Amount</Text>
                <Text selectable style={styles.amountValue}>
                  {total}
                </Text>
              </View>
              <View style={styles.itemBadge}>
                <Text style={styles.itemBadgeCount}>{itemCount}</Text>
                <Text style={styles.itemBadgeLabel}>Items</Text>
              </View>
            </View>

            <View style={styles.detailGrid}>
              <DetailItem label="Store" value={textValue(store?.name)} />
              <DetailItem label="Payment" value={paymentStatus} />
              <DetailItem label="Created" value={createdAt} />
            </View>
          </AppCard>
        );
      })}
    </AppShell>
  );
}

const styles = {
  cardHeader: {
    alignItems: 'flex-start' as const,
    flexDirection: 'row' as const,
    gap: 12,
    justifyContent: 'space-between' as const,
  },
  orderTitleWrap: {
    flex: 1,
    gap: 3,
  },
  orderLabel: {
    color: '#74806F',
    fontSize: 11,
    fontWeight: '800' as const,
    textTransform: 'uppercase' as const,
  },
  orderTitle: {
    color: '#111B0D',
    fontSize: 18,
    fontWeight: '900' as const,
    lineHeight: 24,
  },
  statusPill: {
    alignItems: 'center' as const,
    borderRadius: 999,
    flexDirection: 'row' as const,
    gap: 6,
    maxWidth: 150,
    paddingHorizontal: 10,
    paddingVertical: 7,
  },
  statusDot: {
    borderRadius: 999,
    height: 7,
    width: 7,
  },
  statusText: {
    flexShrink: 1,
    fontSize: 11,
    fontWeight: '900' as const,
  },
  successPill: {
    backgroundColor: '#EAF7E4',
  },
  warningPill: {
    backgroundColor: '#FFF5DC',
  },
  neutralPill: {
    backgroundColor: '#EEF2F5',
  },
  successDot: {
    backgroundColor: brand.green,
  },
  warningDot: {
    backgroundColor: '#C77A00',
  },
  neutralDot: {
    backgroundColor: '#60717D',
  },
  successText: {
    color: brand.greenDark,
  },
  warningText: {
    color: '#8A5300',
  },
  neutralText: {
    color: '#40525E',
  },
  amountBand: {
    alignItems: 'center' as const,
    backgroundColor: '#F3FAEE',
    borderColor: 'rgba(52, 122, 0, 0.10)',
    borderRadius: 18,
    borderWidth: 1,
    flexDirection: 'row' as const,
    justifyContent: 'space-between' as const,
    padding: 14,
  },
  amountCopy: {
    flex: 1,
    gap: 4,
  },
  amountLabel: {
    color: '#6D7B66',
    fontSize: 12,
    fontWeight: '800' as const,
  },
  amountValue: {
    color: '#111B0D',
    fontSize: 24,
    fontVariant: tabularNums,
    fontWeight: '900' as const,
  },
  itemBadge: {
    alignItems: 'center' as const,
    backgroundColor: brand.white,
    borderColor: 'rgba(52, 122, 0, 0.12)',
    borderRadius: 16,
    borderWidth: 1,
    minWidth: 72,
    paddingHorizontal: 12,
    paddingVertical: 10,
  },
  itemBadgeCount: {
    color: brand.green,
    fontSize: 18,
    fontVariant: tabularNums,
    fontWeight: '900' as const,
  },
  itemBadgeLabel: {
    color: '#667061',
    fontSize: 11,
    fontWeight: '800' as const,
  },
  detailGrid: {
    borderColor: 'rgba(52, 122, 0, 0.10)',
    borderRadius: 18,
    borderWidth: 1,
    overflow: 'hidden' as const,
  },
  detailItem: {
    backgroundColor: brand.white,
    borderBottomColor: 'rgba(52, 122, 0, 0.10)',
    borderBottomWidth: 1,
    gap: 4,
    paddingHorizontal: 14,
    paddingVertical: 12,
  },
  detailLabel: {
    color: '#74806F',
    fontSize: 11,
    fontWeight: '900' as const,
    textTransform: 'uppercase' as const,
  },
  detailValue: {
    color: '#26311F',
    fontSize: 14,
    fontWeight: '800' as const,
    lineHeight: 20,
  },
};
