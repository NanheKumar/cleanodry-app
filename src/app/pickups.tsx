import { router } from 'expo-router';
import { use, useEffect, useState } from 'react';
import { Text } from 'react-native';

import { Button, Card, Hero, Message, Row, Screen, brand } from '@/components/cleanodry-ui';
import { getCustomerPickups } from '@/lib/api';
import { AuthContext } from '@/lib/auth-context';

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
      .catch((error) => setMessage(error instanceof Error ? error.message : 'Could not load pickups.'));
  }, [auth.user]);

  if (!auth.user) {
    return (
      <Screen>
        <Hero eyebrow="My account" title="Login required" subtitle="Please login to view pickups." />
        <Button title="Go to Login" onPress={() => router.replace('/')} />
      </Screen>
    );
  }

  return (
    <Screen>
      <Hero eyebrow="My account" title="My Pickups" subtitle="Upcoming pickup requests linked with your account." />
      <Message text={message} />
      {pickups.length === 0 && !message ? <Text style={local.empty}>No pickups found.</Text> : null}
      {pickups.map((pickup) => {
        const store = pickup.store as Record<string, unknown> | null | undefined;
        return (
          <Card key={String(pickup.id)}>
            <Row label="Pickup" value={`#${pickup.id ?? ''} ${pickup.name ?? ''}`} />
            <Row label="Status" value={String(pickup.status ?? 'Pending')} />
            <Row label="Date and Time" value={`${pickup.date ?? ''} ${pickup.time ?? ''}`} />
            <Row label="Store" value={String(store?.name ?? '')} />
            <Row label="Address" value={String(pickup.address ?? '')} />
            {pickup.instruction ? <Row label="Instruction" value={String(pickup.instruction)} /> : null}
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
