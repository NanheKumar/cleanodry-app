import { router } from 'expo-router';
import { use, useEffect, useMemo, useState } from 'react';
import { Text, View } from 'react-native';

import { Button, Field, Message, SelectBox, brand } from '@/components/cleanodry-ui';
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
    <View style={local.card}>
      <View style={local.cardHandle} />
      <View style={local.cardIntro}>
        <View style={local.stepRow}>
          <Text style={[local.stepDot, step === 'mobile' ? local.stepDotActive : null]}>1</Text>
          <View style={local.stepLine} />
          <Text style={[local.stepDot, step === 'otp' ? local.stepDotActive : null]}>2</Text>
          <View style={local.stepLine} />
          <Text style={[local.stepDot, step === 'store' ? local.stepDotActive : null]}>3</Text>
        </View>
        <Text style={local.formTitle}>
          {step === 'mobile' ? 'Sign in with mobile' : step === 'otp' ? 'Enter verification code' : 'Choose your store'}
        </Text>
        <Text style={local.formSub}>
          {step === 'mobile'
            ? 'We will send a secure OTP on your WhatsApp number.'
            : step === 'otp'
              ? `OTP has been sent to +91 ${mobile}.`
              : 'This mobile number is linked with multiple stores.'}
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
    </View>
  );
}

const local = {
  card: {
    backgroundColor: brand.white,
    borderColor: 'rgba(52, 122, 0, 0.10)',
    borderRadius: 24,
    borderWidth: 1,
    boxShadow: '0 14px 34px rgba(31, 56, 20, 0.13)',
    gap: 12,
    padding: 16,
  },
  cardHandle: {
    alignSelf: 'center' as const,
    backgroundColor: 'rgba(52, 122, 0, 0.18)',
    borderRadius: 999,
    height: 3,
    width: 42,
  },
  cardIntro: {
    gap: 6,
    marginBottom: 2,
  },
  stepRow: {
    alignItems: 'center' as const,
    alignSelf: 'center' as const,
    flexDirection: 'row' as const,
    marginBottom: 2,
  },
  stepDot: {
    backgroundColor: '#EEF4EA',
    borderRadius: 999,
    color: brand.gray,
    fontSize: 12,
    fontWeight: '900' as const,
    height: 24,
    lineHeight: 24,
    overflow: 'hidden' as const,
    textAlign: 'center' as const,
    width: 24,
  },
  stepDotActive: {
    backgroundColor: brand.green,
    color: brand.white,
  },
  stepLine: {
    backgroundColor: '#DDE8D7',
    height: 2,
    width: 26,
  },
  formTitle: {
    color: '#111B0D',
    fontSize: 20,
    fontWeight: '900' as const,
    textAlign: 'center' as const,
  },
  formSub: {
    color: '#64705E',
    fontSize: 13,
    lineHeight: 18,
    textAlign: 'center' as const,
  },
  resendText: {
    color: brand.gray,
    fontSize: 12,
    lineHeight: 16,
    textAlign: 'center' as const,
  },
};
