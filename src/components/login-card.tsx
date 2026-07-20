import { use, useEffect, useMemo, useState } from 'react';
import { Text, View } from 'react-native';

import { Button, Field, Message, SelectBox, brand } from '@/components/cleanodry-ui';
import {
  getStores,
  getStoresForMobile,
  registerCustomer,
  selectStore,
  sendOtp,
  type CustomerSummary,
  type SessionUser,
  type Store,
  type StoreAccount,
  verifyOtp,
} from '@/lib/api';
import { AuthContext } from '@/lib/auth-context';

type LoginStep = 'mobile' | 'otp' | 'register' | 'store';

function cleanMobile(value: string) {
  return value.replace(/\D/g, '').slice(0, 10);
}

function isValidMobile(value: string) {
  return /^\d{10}$/.test(value);
}

function maskedMobile(value: string) {
  const cleaned = cleanMobile(value);
  if (cleaned.length < 4) {
    return '******';
  }

  return `${cleaned.slice(0, 2)}******${cleaned.slice(-2)}`;
}

function fullName(customer: CustomerSummary) {
  return `${customer.first_name ?? ''} ${customer.last_name ?? ''}`.trim() || 'Cleanodry Customer';
}

export function LoginCard({ onLoggedIn }: { onLoggedIn?: () => void }) {
  const auth = use(AuthContext);
  const [step, setStep] = useState<LoginStep>('mobile');
  const [mobile, setMobile] = useState('');
  const [otp, setOtp] = useState('');
  const [selectionToken, setSelectionToken] = useState<string | null>(null);
  const [activeCustomer, setActiveCustomer] = useState<CustomerSummary | null>(null);
  const [linkedStores, setLinkedStores] = useState<StoreAccount[]>([]);
  const [stores, setStores] = useState<Store[]>([]);
  const [selectedStoreId, setSelectedStoreId] = useState<number | null>(null);
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [address, setAddress] = useState('');
  const [pincode, setPincode] = useState('');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [success, setSuccess] = useState('');
  const [resendSeconds, setResendSeconds] = useState(0);

  useEffect(() => {
    if (resendSeconds <= 0) {
      return;
    }
    const timer = setTimeout(() => setResendSeconds((value) => Math.max(0, value - 1)), 1000);
    return () => clearTimeout(timer);
  }, [resendSeconds]);

  const linkedStoreOptions = useMemo(
    () =>
      linkedStores.map((store) => ({
        id: store.id,
        name: `${store.name}${store.code ? ` (${store.code})` : ''}`,
        detail: `Customer #${store.customer_id}`,
      })),
    [linkedStores],
  );

  const storeOptions = useMemo(
    () =>
      stores.map((store) => ({
        id: store.id,
        name: store.name,
        detail: store.code,
      })),
    [stores],
  );

  function resetFlow() {
    setStep('mobile');
    setOtp('');
    setSelectionToken(null);
    setActiveCustomer(null);
    setLinkedStores([]);
    setSelectedStoreId(null);
    setFirstName('');
    setLastName('');
    setAddress('');
    setPincode('');
    setSuccess('');
    setMessage('');
    setResendSeconds(0);
  }

  function completeLogin(user: SessionUser) {
    auth.signIn(user);
    resetFlow();
    onLoggedIn?.();
  }

  async function finalizeStoreLogin(store: StoreAccount, token = selectionToken) {
    if (!token) {
      setMessage('Please verify OTP again before selecting store.');
      setStep('otp');
      return;
    }

    setLoading(true);
    try {
      const user = await selectStore({
        selectionToken: token,
        storeId: store.id,
        customerId: store.customer_id,
      });
      completeLogin(user);
    } catch (error) {
      setMessage(error instanceof Error ? error.message : 'Could not select store. Please try again.');
    } finally {
      setLoading(false);
    }
  }

  async function loadRegistrationStores() {
    const nextStores = await getStores();
    setStores(nextStores);
    setSelectedStoreId(null);
  }

  async function loadLinkedStoresAndContinue(token: string, customer: CustomerSummary | null) {
    const nextStores = await getStoresForMobile(mobile);
    if (nextStores.length === 1) {
      await finalizeStoreLogin(nextStores[0], token);
      return;
    }

    if (nextStores.length > 1) {
      setLinkedStores(nextStores);
      setSelectedStoreId(nextStores[0]?.id ?? null);
      setStep('store');
      setSuccess('OTP verified. Select your store.');
      return;
    }

    if (customer?.store?.id) {
      await finalizeStoreLogin(
        {
          id: customer.store.id,
          name: customer.store.name,
          code: customer.store.code,
          customer_id: customer.id,
        },
        token,
      );
      return;
    }

    setMessage('No linked stores found for this mobile number.');
  }

  async function handleSendOtp() {
    setMessage('');
    setSuccess('');
    setSelectionToken(null);
    setActiveCustomer(null);
    setLinkedStores([]);
    const nextMobile = cleanMobile(mobile);
    if (!isValidMobile(nextMobile)) {
      setMessage('Please enter a valid 10-digit mobile number.');
      return;
    }

    setLoading(true);
    try {
      await sendOtp(nextMobile);
      setMobile(nextMobile);
      setStep('otp');
      setResendSeconds(30);
      setSuccess('OTP sent to WhatsApp.');
    } catch (error) {
      setMessage(error instanceof Error ? error.message : 'Could not send OTP. Please try again.');
    } finally {
      setLoading(false);
    }
  }

  async function handleVerifyOtp() {
    setMessage('');
    setSuccess('');
    if (!/^\d{6}$/.test(otp)) {
      setMessage('Please enter the 6-digit OTP.');
      return;
    }

    setLoading(true);
    try {
      const data = await verifyOtp({ mobile, otp });
      const token = data.selection_token;
      if (!token) {
        setMessage('OTP verified, but login token was missing. Please resend OTP.');
        return;
      }

      setSelectionToken(token);
      setActiveCustomer(data.active_customer ?? null);

      if (data.customer_exists === false) {
        await loadRegistrationStores();
        setStep('register');
        setSuccess('OTP verified. Complete registration.');
        return;
      }

      await loadLinkedStoresAndContinue(token, data.active_customer ?? null);
    } catch (error) {
      setMessage(error instanceof Error ? error.message : 'Invalid OTP. Please try again.');
    } finally {
      setLoading(false);
    }
  }

  async function handleRegister() {
    setMessage('');
    setSuccess('');
    const trimmedFirstName = firstName.trim();
    const trimmedLastName = lastName.trim();
    const trimmedAddress = address.trim();

    if (!trimmedFirstName) {
      setMessage('Please enter first name.');
      return;
    }
    if (!selectedStoreId) {
      setMessage('Please select a store.');
      return;
    }
    if (trimmedAddress.length < 5 || !/^\d{6}$/.test(pincode)) {
      setMessage('Please enter address and a valid 6-digit pincode.');
      return;
    }
    if (!selectionToken) {
      setMessage('Please verify OTP again before registering.');
      setStep('otp');
      return;
    }

    setLoading(true);
    try {
      const registered = await registerCustomer({
        firstName: trimmedFirstName,
        lastName: trimmedLastName,
        mobile,
        storeId: selectedStoreId,
        address: trimmedAddress,
        pincode,
      });
      const customer = registered.customer;
      const selectedStore =
        stores.find((store) => store.id === selectedStoreId) ??
        customer.store ?? {
          id: selectedStoreId,
          name: 'Selected Store',
        };

      try {
        const user = await selectStore({
          selectionToken,
          storeId: selectedStoreId,
          customerId: customer.id,
        });
        completeLogin(user);
      } catch (error) {
        console.warn('Registered customer token exchange failed', error);
        completeLogin({
          token: '',
          customerId: customer.id,
          firstName: customer.first_name,
          lastName: customer.last_name,
          mobile: customer.mobile,
          store: selectedStore,
        });
      }
    } catch (error) {
      setMessage(error instanceof Error ? error.message : 'Could not create account. Please try again.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <View style={local.card}>
      <View style={local.cardIntro}>
        <Text style={local.formTitle}>
          {step === 'mobile'
            ? 'Login'
            : step === 'otp'
              ? 'Enter OTP'
              : step === 'register'
                ? 'Create Account'
                : 'Select Store'}
        </Text>
        {step !== 'mobile' ? <Text style={local.mobileHint}>+91 {maskedMobile(mobile)}</Text> : null}
      </View>
      {step === 'mobile' ? (
        <>
          <Field
            label="Mobile Number"
            prefix="+91"
            value={mobile}
            onChangeText={(value) => setMobile(cleanMobile(value))}
            keyboardType="number-pad"
            placeholder="10-digit number"
            textContentType="telephoneNumber"
          />
          <Message text={message} />
          <Message text={success} tone="success" />
          <Button title="Send WhatsApp OTP" loading={loading} onPress={handleSendOtp} />
        </>
      ) : step === 'otp' ? (
        <>
          <Field
            label="OTP"
            value={otp}
            onChangeText={(value) => setOtp(value.replace(/\D/g, '').slice(0, 6))}
            keyboardType="number-pad"
            placeholder="6-digit OTP"
            textContentType="oneTimeCode"
          />
          <Message text={message} />
          <Message text={success} tone="success" />
          <Button title="Verify and continue" loading={loading} onPress={handleVerifyOtp} />
          <Text style={local.resendText}>
            {resendSeconds > 0 ? `Resend OTP in ${resendSeconds}s` : 'Did not receive OTP?'}
          </Text>
          {resendSeconds === 0 ? <Button title="Resend OTP" variant="outline" loading={loading} onPress={handleSendOtp} /> : null}
          <Button title="Change Mobile" variant="ghost" onPress={resetFlow} />
        </>
      ) : step === 'register' ? (
        <>
          <Field label="First Name" value={firstName} onChangeText={setFirstName} placeholder="First name" />
          <Field label="Last Name" value={lastName} onChangeText={setLastName} placeholder="Last name" />
          <SelectBox
            label="Store"
            value={selectedStoreId}
            placeholder={stores.length === 0 ? 'Loading stores...' : 'Select store'}
            options={storeOptions}
            onChange={(id) => setSelectedStoreId(Number(id))}
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
          <Message text={success} tone="success" />
          <Button title="Create account" loading={loading} onPress={handleRegister} />
          <Button title="Back to OTP" variant="ghost" onPress={() => setStep('otp')} />
        </>
      ) : (
        <>
          {activeCustomer ? <Text style={local.customerName}>{fullName(activeCustomer)}</Text> : null}
          <SelectBox
            label="Store"
            value={selectedStoreId}
            placeholder="No linked stores found"
            options={linkedStoreOptions}
            onChange={(id) => {
              const store = linkedStores.find((item) => item.id === Number(id));
              setSelectedStoreId(Number(id));
              if (store) {
                void finalizeStoreLogin(store);
              }
            }}
          />
          <Message text={message} />
          <Message text={success} tone="success" />
          <Button
            title="Back to OTP"
            variant="ghost"
            onPress={() => {
              setStep('otp');
              setSelectedStoreId(null);
              setSuccess('');
            }}
          />
        </>
      )}
    </View>
  );
}

const local = {
  card: {
    backgroundColor: brand.white,
    borderColor: 'rgba(52, 122, 0, 0.10)',
    borderRadius: 22,
    borderWidth: 1,
    boxShadow: '0 12px 30px rgba(31, 56, 20, 0.12)',
    gap: 14,
    padding: 18,
  },
  cardIntro: {
    alignItems: 'center' as const,
    gap: 4,
  },
  formTitle: {
    color: '#111B0D',
    fontSize: 22,
    fontWeight: '900' as const,
    textAlign: 'center' as const,
    width: '100%' as const,
  },
  mobileHint: {
    color: brand.gray,
    fontSize: 13,
    fontWeight: '700' as const,
  },
  customerName: {
    color: brand.black,
    fontSize: 15,
    fontWeight: '800' as const,
    textAlign: 'center' as const,
  },
  resendText: {
    color: brand.gray,
    fontSize: 12,
    lineHeight: 16,
    textAlign: 'center' as const,
  },
};
