import { use, useEffect, useState } from 'react';

import { AppCard, AppShell } from '@/components/app-shell';
import { Message, Row } from '@/components/cleanodry-ui';
import { getCustomerDetails } from '@/lib/api';
import { AuthContext } from '@/lib/auth-context';
import { formatInr } from '@/lib/format';

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

  const store = customer?.store as Record<string, unknown> | null | undefined;
  const wallet = customer?.wallet as Record<string, unknown> | null | undefined;
  const firstName = String(customer?.first_name ?? auth.user?.firstName ?? '').trim();
  const lastName = String(customer?.last_name ?? auth.user?.lastName ?? '').trim();
  const address = String(customer?.address ?? '').trim();
  const pincode = String(customer?.pincode ?? '').trim();

  return (
    <AppShell title="Profile" subtitle="Your Cleanodry customer details." icon="profile">
      <AppCard>
        <Message text={message} />
        <Row label="Name" value={`${firstName} ${lastName}`.trim()} />
        <Row label="Mobile" value={String(customer?.mobile ?? auth.user?.mobile ?? '')} />
        <Row label="Store" value={String(store?.name ?? auth.user?.store?.name ?? '')} />
        <Row label="Address" value={address || 'Not added'} />
        <Row label="Pincode" value={pincode || 'Not added'} />
        <Row label="Wallet Balance" value={formatInr(wallet?.balance ?? 0)} />
      </AppCard>
    </AppShell>
  );
}
