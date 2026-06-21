import { use, useEffect, useMemo, useState } from 'react';
import { Text, View } from 'react-native';

import { Button, Card, Field, Hero, Message, Screen, SelectBox, brand } from '@/components/cleanodry-ui';
import { LoginCard } from '@/components/login-card';
import { AuthContext } from '@/lib/auth-context';
import { getCustomerDetails, getServices, getStores, schedulePickup, type Service, type Store } from '@/lib/api';

const timeSlots = [
  { id: '10-12', name: '10 AM - 12 PM' },
  { id: '12-14', name: '12 PM - 2 PM' },
  { id: '14-16', name: '2 PM - 4 PM' },
  { id: '16-18', name: '4 PM - 6 PM' },
  { id: '18-20', name: '6 PM - 8 PM' },
];

function tomorrowDate() {
  const date = new Date();
  date.setDate(date.getDate() + 1);
  return date.toISOString().slice(0, 10);
}

function pickupDateOptions() {
  const today = new Date();

  return Array.from({ length: 7 }, (_, index) => {
    const date = new Date(today);
    date.setDate(today.getDate() + index + 1);
    const id = date.toISOString().slice(0, 10);
    const label = date.toLocaleDateString('en-IN', {
      day: '2-digit',
      month: 'short',
      weekday: 'short',
    });

    return {
      id,
      name: index === 0 ? `Tomorrow, ${label}` : label,
      detail: id,
    };
  });
}

export default function PickupScreen() {
  const auth = use(AuthContext);
  const [stores, setStores] = useState<Store[]>([]);
  const [services, setServices] = useState<Service[]>([]);
  const [storeId, setStoreId] = useState<number | null>(auth.user?.store?.id ?? null);
  const [serviceId, setServiceId] = useState<number | null>(null);
  const [fullName, setFullName] = useState(
    auth.user ? `${auth.user.firstName} ${auth.user.lastName}`.trim() : '',
  );
  const [mobile, setMobile] = useState(auth.user?.mobile ?? '');
  const [address, setAddress] = useState('');
  const [pickupDate, setPickupDate] = useState(tomorrowDate());
  const [pickupTime, setPickupTime] = useState('10-12');
  const [notes, setNotes] = useState('');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [success, setSuccess] = useState('');
  const lockedStore = auth.user?.store ?? null;

  useEffect(() => {
    if (!auth.user?.token) {
      return;
    }

    let mounted = true;
    getCustomerDetails(auth.user.token)
      .then((data) => {
        if (!mounted) {
          return;
        }
        const customer = data.customer;
        const firstName = typeof customer.first_name === 'string' ? customer.first_name.trim() : '';
        const lastName = typeof customer.last_name === 'string' ? customer.last_name.trim() : '';
        const savedName = `${firstName} ${lastName}`.trim();
        const savedMobile = typeof customer.mobile === 'string' ? customer.mobile.trim() : '';
        const savedAddress = typeof customer.address === 'string' ? customer.address.trim() : '';
        if (savedName) {
          setFullName(savedName);
        }
        if (savedMobile) {
          setMobile(savedMobile);
        }
        if (savedAddress) {
          setAddress(savedAddress);
        }
      })
      .catch((error) => {
        setMessage(error instanceof Error ? error.message : 'Could not load saved customer address.');
      });

    return () => {
      mounted = false;
    };
  }, [auth.user?.token]);

  useEffect(() => {
    let mounted = true;
    Promise.all([getStores(), getServices()])
      .then(([nextStores, nextServices]) => {
        if (!mounted) {
          return;
        }
        setStores(nextStores);
        setServices(nextServices);
        setStoreId((current) => lockedStore?.id ?? current ?? nextStores[0]?.id ?? null);
        setServiceId((current) => current ?? nextServices[0]?.id ?? null);
      })
      .catch((error) => setMessage(error instanceof Error ? error.message : 'Could not load pickup form.'));
    return () => {
      mounted = false;
    };
  }, [lockedStore?.id]);

  const storeOptions = useMemo(
    () => stores.map((store) => ({ id: store.id, name: store.name, detail: store.code })),
    [stores],
  );
  const serviceOptions = useMemo(
    () => services.map((service) => ({ id: service.id, name: service.name, detail: service.code })),
    [services],
  );
  const dateOptions = useMemo(() => pickupDateOptions(), []);

  async function handleSubmit() {
    setMessage('');
    setSuccess('');
    if (!storeId || !serviceId) {
      setMessage('Please select store and service.');
      return;
    }
    if (!fullName.trim() || !/^[6-9]\d{9}$/.test(mobile.replace(/\D/g, ''))) {
      setMessage('Please enter name and valid mobile number.');
      return;
    }
    if (address.trim().length < 5 || !pickupDate) {
      setMessage('Please enter address and pickup date.');
      return;
    }

    setLoading(true);
    try {
      const data = await schedulePickup(auth.user?.token ?? null, {
        storeId,
        fullName: fullName.trim(),
        mobile,
        address: address.trim(),
        serviceId,
        pickupDate,
        pickupTime,
        notes: notes.trim(),
      });
      setSuccess(`Pickup request submitted. ID #${data.pickup_id}`);
      setNotes('');
    } catch (error) {
      setMessage(error instanceof Error ? error.message : 'Could not schedule pickup.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <Screen>
      <Hero
        eyebrow="Doorstep service"
        title="Schedule a pickup"
        subtitle={auth.user ? 'Select service, pickup date, and time slot.' : 'Login first, then schedule your pickup.'}
      />
      {!auth.user ? (
        <LoginCard />
      ) : (
      <Card>
        {lockedStore ? (
          <View style={local.lockedStore}>
            <Text style={local.lockedStoreLabel}>Store</Text>
            <Text selectable style={local.lockedStoreName}>
              {lockedStore.name}
              {lockedStore.code ? ` (${lockedStore.code})` : ''}
            </Text>
            <Text style={local.lockedStoreHint}>Using the store selected during login.</Text>
          </View>
        ) : (
          <SelectBox
            label="Store"
            value={storeId}
            placeholder="Loading stores..."
            options={storeOptions}
            onChange={(id) => setStoreId(Number(id))}
          />
        )}
        <Field label="Full Name" value={fullName} onChangeText={setFullName} placeholder="Full name" />
        {!auth.user ? (
          <Field
            label="Mobile Number"
            prefix="+91"
            value={mobile}
            onChangeText={(value) => setMobile(value.replace(/\D/g, '').slice(0, 10))}
            keyboardType="number-pad"
            placeholder="10-digit number"
          />
        ) : null}
        <Field label="Address" value={address} onChangeText={setAddress} placeholder="Pickup address" multiline />
        <SelectBox
          label="Service"
          value={serviceId}
          placeholder="Loading services..."
          options={serviceOptions}
          onChange={(id) => setServiceId(Number(id))}
        />
        <SelectBox
          label="Pickup Date"
          value={pickupDate}
          placeholder="Select pickup date"
          options={dateOptions}
          onChange={(id) => setPickupDate(String(id))}
        />
        <SelectBox
          label="Pickup Time"
          value={pickupTime}
          placeholder="Select time slot"
          options={timeSlots}
          onChange={(id) => setPickupTime(String(id))}
        />
        <Field label="Notes" value={notes} onChangeText={setNotes} placeholder="Optional instructions" multiline />
        <Message text={message} />
        <Message text={success} tone="success" />
        <Button title="Submit Pickup" loading={loading} onPress={handleSubmit} />
      </Card>
      )}
    </Screen>
  );
}

const local = {
  lockedStore: {
    backgroundColor: '#F0F7EB',
    borderColor: 'rgba(52, 122, 0, 0.22)',
    borderRadius: 8,
    borderWidth: 1,
    gap: 4,
    padding: 14,
  },
  lockedStoreLabel: {
    color: brand.gray,
    fontSize: 12,
    fontWeight: '800' as const,
    textTransform: 'uppercase' as const,
  },
  lockedStoreName: {
    color: brand.green,
    fontSize: 16,
    fontWeight: '800' as const,
  },
  lockedStoreHint: {
    color: brand.gray,
    fontSize: 12,
    lineHeight: 16,
  },
};
