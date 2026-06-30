import { router, useLocalSearchParams } from 'expo-router';
import { useEffect, useMemo, useState } from 'react';

import { AppFooter } from '@/components/app-shell';
import { Button, Card, Field, Hero, Message, Screen, SelectBox } from '@/components/cleanodry-ui';
import { getStores, registerCustomer, sendOtp, type Store } from '@/lib/api';

export default function RegisterScreen() {
  const params = useLocalSearchParams<{ mobile?: string }>();
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [mobile, setMobile] = useState(String(params.mobile ?? ''));
  const [storeId, setStoreId] = useState<number | null>(null);
  const [address, setAddress] = useState('');
  const [pincode, setPincode] = useState('');
  const [stores, setStores] = useState<Store[]>([]);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');

  useEffect(() => {
    let mounted = true;
    getStores()
      .then((data) => {
        if (!mounted) {
          return;
        }
        setStores(data);
        setStoreId((current) => current ?? data[0]?.id ?? null);
      })
      .catch((error) => setMessage(error instanceof Error ? error.message : 'Could not load stores.'));
    return () => {
      mounted = false;
    };
  }, []);

  const storeOptions = useMemo(
    () =>
      stores.map((store) => ({
        id: store.id,
        name: store.name,
        detail: store.code,
      })),
    [stores],
  );

  async function handleRegister() {
    setMessage('');
    if (!firstName.trim() || !lastName.trim()) {
      setMessage('Please enter first name and last name.');
      return;
    }
    if (!/^[6-9]\d{9}$/.test(mobile)) {
      setMessage('Please enter a valid 10-digit mobile number.');
      return;
    }
    if (!storeId) {
      setMessage('Please select a store.');
      return;
    }
    if (address.trim().length < 5 || !/^\d{6}$/.test(pincode)) {
      setMessage('Please enter address and a valid 6-digit pincode.');
      return;
    }

    setLoading(true);
    try {
      await registerCustomer({
        firstName: firstName.trim(),
        lastName: lastName.trim(),
        mobile,
        storeId,
        address: address.trim(),
        pincode,
      });
      await sendOtp(mobile);
      router.replace({ pathname: '/', params: { mobile, otpSent: '1' } });
    } catch (error) {
      setMessage(error instanceof Error ? error.message : 'Could not create account. Please try again.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <Screen>
      <Hero
        eyebrow="New customer"
        title="Create your Cleanodry account"
        subtitle="Choose your store, add your address, and we will send OTP to login."
      />
      <Card>
        <Field label="First Name" value={firstName} onChangeText={setFirstName} placeholder="First name" />
        <Field label="Last Name" value={lastName} onChangeText={setLastName} placeholder="Last name" />
        <Field
          label="Mobile Number"
          prefix="+91"
          value={mobile}
          onChangeText={(value) => setMobile(value.replace(/\D/g, '').slice(0, 10))}
          keyboardType="number-pad"
          placeholder="10-digit number"
        />
        <SelectBox
          label="Store"
          value={storeId}
          placeholder="Loading stores..."
          options={storeOptions}
          onChange={(id) => setStoreId(Number(id))}
        />
        <Field label="Address" value={address} onChangeText={setAddress} placeholder="House, street, area" multiline />
        <Field
          label="Pincode"
          value={pincode}
          onChangeText={(value) => setPincode(value.replace(/\D/g, '').slice(0, 6))}
          keyboardType="number-pad"
          placeholder="6-digit pincode"
        />
        <Message text={message} />
        <Button title="Create Account and Send OTP" loading={loading} onPress={handleRegister} />
      </Card>
      <AppFooter />
    </Screen>
  );
}
