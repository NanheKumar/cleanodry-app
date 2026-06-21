import { router } from 'expo-router';
import { use, useEffect, useState } from 'react';

import { Button, Card, Hero, Message, Row, Screen } from '@/components/cleanodry-ui';
import { getCustomerDetails } from '@/lib/api';
import { AuthContext } from '@/lib/auth-context';

export default function ProfileScreen() {
  const auth = use(AuthContext);
  const [customer, setCustomer] = useState<Record<string, unknown> | null>(null);
  const [message, setMessage] = useState('');

  useEffect(() => {
    if (!auth.user) {
      return;
    }
    getCustomerDetails(auth.user.token)
      .then((data) => setCustomer(data.customer))
      .catch((error) => setMessage(error instanceof Error ? error.message : 'Could not load profile.'));
  }, [auth.user]);

  if (!auth.user) {
    return (
      <Screen>
        <Hero eyebrow="My account" title="Login required" subtitle="Please login to view your profile." />
        <Button title="Go to Login" onPress={() => router.replace('/')} />
      </Screen>
    );
  }

  const store = customer?.store as Record<string, unknown> | null | undefined;
  const wallet = customer?.wallet as Record<string, unknown> | null | undefined;

  return (
    <Screen>
      <Hero eyebrow="My account" title="Profile" subtitle="Your Cleanodry customer details." />
      <Card>
        <Message text={message} />
        <Row label="Name" value={`${customer?.first_name ?? auth.user.firstName} ${customer?.last_name ?? auth.user.lastName}`} />
        <Row label="Mobile" value={String(customer?.mobile ?? auth.user.mobile)} />
        <Row label="Store" value={String(store?.name ?? auth.user.store?.name ?? '')} />
        <Row label="Address" value={String(customer?.address ?? '') || 'Not added'} />
        <Row label="Pincode" value={String(customer?.pincode ?? '') || 'Not added'} />
        <Row label="Wallet Balance" value={wallet?.balance !== undefined ? `Rs. ${wallet.balance}` : 'Rs. 0'} />
      </Card>
    </Screen>
  );
}
