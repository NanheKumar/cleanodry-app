import { router } from 'expo-router';
import { use, useEffect, useState } from 'react';

import { AppCard, AppShell, EmptyState } from '@/components/app-shell';
import { Message, Row } from '@/components/cleanodry-ui';
import { ApiError, getCustomerPickups } from '@/lib/api';
import { AuthContext } from '@/lib/auth-context';
import { formatDate } from '@/lib/format';

export default function PickupsScreen() {
  const auth = use(AuthContext);
  const [pickups, setPickups] = useState<Record<string, unknown>[]>([]);
  const [message, setMessage] = useState('');

  useEffect(() => {
    if (!auth.user) {
      return;
    }
    getCustomerPickups(auth.user.token)
      .then((data) => setPickups(data.pickups))
      .catch((error) => {
        if (error instanceof ApiError && error.status === 401) {
          auth.signOut();
          return;
        }
        setMessage(error instanceof Error ? error.message : 'Could not load pickups.');
      });
  }, [auth.user]);

  return (
    <AppShell title="My Pickups" subtitle="Upcoming pickup requests linked with your account." icon="pickup">
      <Message text={message} />
      {pickups.length === 0 && !message ? (
        <EmptyState
          title="No pickups found"
          subtitle="Scheduled pickup requests will appear here."
          actionTitle="Schedule Pickup"
          onAction={() => router.push('/pickup')}
        />
      ) : null}
      {pickups.map((pickup) => {
        const store = pickup.store as Record<string, unknown> | null | undefined;
        return (
          <AppCard key={String(pickup.id)}>
            <Row label="Pickup" value={`#${pickup.id ?? ''} ${pickup.name ?? ''}`} />
            <Row label="Status" value={String(pickup.status ?? 'Pending')} />
            <Row label="Date and Time" value={`${formatDate(pickup.date)} ${pickup.time ?? ''}`} />
            <Row label="Store" value={String(store?.name ?? '')} />
            <Row label="Address" value={String(pickup.address ?? '')} />
            {pickup.instruction ? <Row label="Instruction" value={String(pickup.instruction)} /> : null}
          </AppCard>
        );
      })}
    </AppShell>
  );
}
