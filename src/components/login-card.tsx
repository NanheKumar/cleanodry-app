import { router } from 'expo-router';
import { use, useEffect, useMemo, useState } from 'react';
import { Text, View } from 'react-native';

import { Button, Card, Field, Message, SelectBox, brand } from '@/components/cleanodry-ui';
import { ApiError, type CustomerSummary, sendOtp, verifyOtp } from '@/lib/api';
import { AuthContext } from '@/lib/auth-context';

type LoginStep = 'mobile' | 'otp' | 'store';

export function LoginCard({ onLoggedIn }: { onLoggedIn?: () => void }) {
  const auth = use(AuthContext);
  const [step, setStep] = useState<LoginStep>('mobile');
  const [mobile, setMobile] = useState('');
  const [otp, setOtp] = useState('');
  const [customers, setCustomers] = useState<CustomerSummary[]>([]);
  const [selectedCustomerId, setSelectedCustomerId] = useState<number | null>(null);
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

  const customerOptions = useMemo(
    () =>
      customers.map((customer) => ({
        id: customer.id,
        name: customer.store ? `${customer.store.name}${customer.store.code ? ` (${customer.store.code})` : ''}` : 'Store',
        detail: `${customer.first_name} ${customer.last_name}`.trim() || 'Cleanodry Customer',
      })),
    [customers],
  );

  async function handleSendOtp() {
    setMessage('');
    setSuccess('');
    const cleanMobile = mobile.replace(/\D/g, '');
    if (!/^[6-9]\d{9}$/.test(cleanMobile)) {
      setMessage('Please enter a valid 10-digit Indian mobile number.');
      return;
    }

    setLoading(true);
    try {
      const data = await sendOtp(cleanMobile);
      const nextCustomers = data.customers ?? [];
      setCustomers(nextCustomers);
      setSelectedCustomerId(nextCustomers.length === 1 ? (nextCustomers[0]?.id ?? data.customer_id ?? null) : (data.customer_id ?? null));
      setStep('otp');
      setResendSeconds(30);
      setSuccess('OTP sent to WhatsApp.');
    } catch (error) {
      if (error instanceof ApiError && error.status === 404) {
        router.push({ pathname: '/register', params: { mobile: cleanMobile } });
        return;
      }
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
    if (customers.length > 1 && !selectedCustomerId) {
      setStep('store');
      setSuccess('OTP entered. Select your store to continue.');
      return;
    }
    if (!selectedCustomerId) {
      setMessage('Please select your store/customer first.');
      return;
    }
    await loginWithCustomer(selectedCustomerId);
  }

  async function loginWithCustomer(customerId: number) {
    setLoading(true);
    try {
      const user = await verifyOtp({ mobile, otp, customerId });
      auth.signIn(user);
      setOtp('');
      setCustomers([]);
      setSelectedCustomerId(null);
      setStep('mobile');
      setSuccess('');
      onLoggedIn?.();
    } catch (error) {
      setMessage(error instanceof Error ? error.message : 'Invalid OTP. Please try again.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <Card>
      <View style={local.cardIntro}>
        <Text style={local.formTitle}>
          {step === 'mobile' ? 'Login / Sign Up' : step === 'otp' ? 'Verify OTP' : 'Select Store'}
        </Text>
        <Text style={local.formSub}>
          {step === 'mobile'
            ? 'Enter your registered mobile number.'
            : step === 'otp'
              ? 'Enter the 6-digit OTP sent to WhatsApp.'
              : 'Select your store to complete login.'}
        </Text>
      </View>
      {step === 'mobile' ? (
        <>
          <Field
            label="Mobile Number"
            prefix="+91"
            value={mobile}
            onChangeText={(value) => setMobile(value.replace(/\D/g, '').slice(0, 10))}
            keyboardType="number-pad"
            placeholder="10-digit number"
            textContentType="telephoneNumber"
          />
          <Message text={message} />
          <Message text={success} tone="success" />
          <Button title="Send OTP" loading={loading} onPress={handleSendOtp} />
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
          <Button title="Verify and Login" loading={loading} onPress={handleVerifyOtp} />
          <Text style={local.resendText}>
            {resendSeconds > 0 ? `Resend OTP in ${resendSeconds}s` : 'Did not receive OTP?'}
          </Text>
          {resendSeconds === 0 ? <Button title="Resend OTP" variant="outline" loading={loading} onPress={handleSendOtp} /> : null}
          <Button
            title="Change Mobile"
            variant="ghost"
            onPress={() => {
              setStep('mobile');
              setSelectedCustomerId(null);
              setCustomers([]);
              setOtp('');
              setResendSeconds(0);
            }}
          />
        </>
      ) : (
        <>
          <SelectBox
            label="Select Store"
            value={selectedCustomerId}
            placeholder="No linked stores found"
            options={customerOptions}
            onChange={(id) => {
              const customerId = Number(id);
              setSelectedCustomerId(customerId);
              void loginWithCustomer(customerId);
            }}
          />
          <Message text={message} />
          <Message text={success} tone="success" />
          <Button title="Back to OTP" variant="ghost" onPress={() => setStep('otp')} />
        </>
      )}
    </Card>
  );
}

const local = {
  cardIntro: {
    gap: 4,
    marginBottom: 2,
  },
  formTitle: {
    color: brand.black,
    fontSize: 20,
    fontWeight: '800' as const,
    textAlign: 'center' as const,
  },
  formSub: {
    color: brand.gray,
    fontSize: 14,
    lineHeight: 20,
    textAlign: 'center' as const,
  },
  resendText: {
    color: brand.gray,
    fontSize: 13,
    lineHeight: 18,
    textAlign: 'center' as const,
  },
};
