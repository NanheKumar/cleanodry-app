import { use, useEffect, useState } from 'react';
import { Text, type TextStyle, View } from 'react-native';

import { AppCard, AppShell } from '@/components/app-shell';
import { Button, Field, Message, SelectBox, brand } from '@/components/cleanodry-ui';
import { ApiError, getCustomerDetails, updateCustomer } from '@/lib/api';
import { AuthContext } from '@/lib/auth-context';
import { formatInr } from '@/lib/format';

const tabularNums: TextStyle['fontVariant'] = ['tabular-nums'];

function textValue(value: unknown, fallback = 'Not added') {
  const text = String(value ?? '').trim();
  return text || fallback;
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

export default function ProfileScreen() {
  const auth = use(AuthContext);
  const [customer, setCustomer] = useState<Record<string, unknown> | null>(null);
  const [message, setMessage] = useState('');
  const [success, setSuccess] = useState('');
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({
    firstName: '',
    lastName: '',
    email: '',
    gender: '',
    address: '',
    pincode: '',
    gstNo: '',
  });

  function fillForm(nextCustomer: Record<string, unknown> | null) {
    setForm({
      firstName: String(nextCustomer?.first_name ?? auth.user?.firstName ?? '').trim(),
      lastName: String(nextCustomer?.last_name ?? auth.user?.lastName ?? '').trim(),
      email: String(nextCustomer?.email ?? '').trim(),
      gender: String(nextCustomer?.gender ?? '').trim().toLowerCase(),
      address: String(nextCustomer?.address ?? '').trim(),
      pincode: String(nextCustomer?.pincode ?? '').trim(),
      gstNo: String(nextCustomer?.gst_no ?? '').trim(),
    });
  }

  useEffect(() => {
    if (!auth.user) {
      return;
    }
    getCustomerDetails(auth.user.token)
      .then((data) => {
        setCustomer(data.customer);
        fillForm(data.customer);
      })
      .catch((error) => {
        if (error instanceof ApiError && error.status === 401) {
          auth.signOut();
          return;
        }
        setMessage(error instanceof Error ? error.message : 'Could not load profile.');
      });
  }, [auth.user]);

  const store = customer?.store as Record<string, unknown> | null | undefined;
  const wallet = customer?.wallet as Record<string, unknown> | null | undefined;
  const firstName = String(customer?.first_name ?? auth.user?.firstName ?? '').trim();
  const lastName = String(customer?.last_name ?? auth.user?.lastName ?? '').trim();
  const email = String(customer?.email ?? '').trim();
  const gender = String(customer?.gender ?? '').trim();
  const address = String(customer?.address ?? '').trim();
  const pincode = String(customer?.pincode ?? '').trim();
  const gstNo = String(customer?.gst_no ?? '').trim();
  const fullName = textValue(`${firstName} ${lastName}`.trim(), 'Cleanodry Customer');
  const mobile = textValue(customer?.mobile ?? auth.user?.mobile);
  const storeName = textValue(store?.name ?? auth.user?.store?.name);
  const walletBalance = formatInr(wallet?.balance ?? 0);
  const initials = fullName
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0])
    .join('')
    .toUpperCase();

  async function handleSave() {
    setMessage('');
    setSuccess('');
    if (!auth.user?.token) {
      return;
    }
    if (!form.firstName.trim()) {
      setMessage('Please enter first name.');
      return;
    }
    if (form.email.trim() && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email.trim())) {
      setMessage('Please enter a valid email address.');
      return;
    }
    if (form.pincode.trim() && !/^\d{6}$/.test(form.pincode.trim())) {
      setMessage('Please enter a valid 6-digit pincode.');
      return;
    }

    setSaving(true);
    try {
      const data = await updateCustomer(auth.user.token, {
        firstName: form.firstName.trim(),
        lastName: form.lastName.trim(),
        email: form.email.trim(),
        gender: form.gender,
        address: form.address.trim(),
        pincode: form.pincode.trim(),
        gstNo: form.gstNo.trim(),
      });
      const nextCustomer = data.customer
        ? data.customer
        : {
            ...(customer ?? {}),
            first_name: form.firstName.trim(),
            last_name: form.lastName.trim(),
            email: form.email.trim(),
            gender: form.gender,
            address: form.address.trim(),
            pincode: form.pincode.trim(),
            gst_no: form.gstNo.trim(),
          };
      setCustomer(nextCustomer);
      fillForm(nextCustomer);
      setEditing(false);
      setSuccess(data.message || 'Profile updated successfully.');
    } catch (error) {
      if (error instanceof ApiError && error.status === 401) {
        auth.signOut();
        return;
      }
      setMessage(error instanceof Error ? error.message : 'Could not update profile.');
    } finally {
      setSaving(false);
    }
  }

  return (
    <AppShell title="Profile" subtitle="Your Cleanodry customer details." icon="profile">
      <Message text={message} />
      <Message text={success} tone="success" />
      <AppCard>
        <View style={styles.profileHead}>
          <View style={styles.avatar}>
            <Text style={styles.avatarText}>{initials || 'C'}</Text>
          </View>
          <View style={styles.profileCopy}>
            <Text selectable style={styles.name}>
              {fullName}
            </Text>
            <Text selectable style={styles.mobile}>
              +91 {mobile}
            </Text>
          </View>
          <View style={styles.editButtonWrap}>
            <Button
              title={editing ? 'Cancel' : 'Edit'}
              variant={editing ? 'ghost' : 'outline'}
              onPress={() => {
                setMessage('');
                setSuccess('');
                if (editing) {
                  fillForm(customer);
                }
                setEditing((value) => !value);
              }}
            />
          </View>
        </View>

        {editing ? (
          <View style={styles.formGrid}>
            <Field
              label="First Name"
              value={form.firstName}
              onChangeText={(value) => setForm((current) => ({ ...current, firstName: value }))}
              placeholder="First name"
            />
            <Field
              label="Last Name"
              value={form.lastName}
              onChangeText={(value) => setForm((current) => ({ ...current, lastName: value }))}
              placeholder="Last name"
            />
            <Field
              label="Email"
              value={form.email}
              onChangeText={(value) => setForm((current) => ({ ...current, email: value }))}
              keyboardType="email-address"
              placeholder="rahul@example.com"
              autoCapitalize="none"
            />
            <SelectBox
              label="Gender"
              value={form.gender}
              placeholder="Select gender"
              options={[
                { id: 'male', name: 'Male' },
                { id: 'female', name: 'Female' },
                { id: 'other', name: 'Other' },
              ]}
              onChange={(id) => setForm((current) => ({ ...current, gender: String(id) }))}
            />
            <Field
              label="Address"
              value={form.address}
              onChangeText={(value) => setForm((current) => ({ ...current, address: value }))}
              placeholder="House 12, Delhi"
              multiline
            />
            <Field
              label="Pincode"
              value={form.pincode}
              onChangeText={(value) => setForm((current) => ({ ...current, pincode: value.replace(/\D/g, '').slice(0, 6) }))}
              keyboardType="number-pad"
              placeholder="110001"
            />
            <Field
              label="GST Number"
              value={form.gstNo}
              onChangeText={(value) => setForm((current) => ({ ...current, gstNo: value.toUpperCase().slice(0, 15) }))}
              placeholder="07ABCDE1234F1Z5"
              autoCapitalize="characters"
            />
            <Button title="Update Profile" loading={saving} onPress={handleSave} />
          </View>
        ) : (
          <>
            <View style={styles.summaryBand}>
              <View style={styles.summaryItem}>
                <Text style={styles.summaryLabel}>Wallet Balance</Text>
                <Text selectable style={styles.walletValue}>
                  {walletBalance}
                </Text>
              </View>
              <View style={styles.summaryDivider} />
              <View style={styles.summaryItem}>
                <Text style={styles.summaryLabel}>Store</Text>
                <Text selectable style={styles.storeValue}>
                  {storeName}
                </Text>
              </View>
            </View>

            <View style={styles.detailGrid}>
              <DetailItem label="Email" value={email || 'Not added'} />
              <DetailItem label="Gender" value={gender || 'Not added'} />
              <DetailItem label="Address" value={address || 'Not added'} />
              <DetailItem label="Pincode" value={pincode || 'Not added'} />
              <DetailItem label="GST Number" value={gstNo || 'Not added'} />
              <DetailItem label="Customer ID" value={textValue(customer?.id ?? auth.user?.customerId)} />
            </View>
          </>
        )}
      </AppCard>
    </AppShell>
  );
}

const styles = {
  profileHead: {
    alignItems: 'center' as const,
    flexDirection: 'row' as const,
    gap: 14,
  },
  avatar: {
    alignItems: 'center' as const,
    backgroundColor: brand.green,
    borderRadius: 22,
    height: 64,
    justifyContent: 'center' as const,
    width: 64,
  },
  avatarText: {
    color: brand.white,
    fontSize: 22,
    fontWeight: '900' as const,
  },
  profileCopy: {
    flex: 1,
    gap: 4,
  },
  editButtonWrap: {
    minWidth: 96,
  },
  formGrid: {
    gap: 13,
  },
  name: {
    color: '#111B0D',
    fontSize: 20,
    fontWeight: '900' as const,
    lineHeight: 25,
  },
  mobile: {
    color: '#607058',
    fontSize: 14,
    fontWeight: '800' as const,
  },
  summaryBand: {
    alignItems: 'stretch' as const,
    backgroundColor: '#F3FAEE',
    borderColor: 'rgba(52, 122, 0, 0.10)',
    borderRadius: 18,
    borderWidth: 1,
    flexDirection: 'row' as const,
    overflow: 'hidden' as const,
  },
  summaryItem: {
    flex: 1,
    gap: 5,
    padding: 14,
  },
  summaryDivider: {
    backgroundColor: 'rgba(52, 122, 0, 0.12)',
    width: 1,
  },
  summaryLabel: {
    color: '#6D7B66',
    fontSize: 11,
    fontWeight: '900' as const,
    textTransform: 'uppercase' as const,
  },
  walletValue: {
    color: '#111B0D',
    fontSize: 22,
    fontVariant: tabularNums,
    fontWeight: '900' as const,
  },
  storeValue: {
    color: brand.greenDark,
    fontSize: 15,
    fontWeight: '900' as const,
    lineHeight: 20,
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
