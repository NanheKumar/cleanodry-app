import { router } from 'expo-router';
import { use, useCallback, useEffect, useRef, useState } from 'react';
import { Alert, Linking, Platform, Pressable, Text, type TextStyle, View } from 'react-native';

import { AppCard, AppShell } from '@/components/app-shell';
import { Button, Field, Message, brand } from '@/components/cleanodry-ui';
import { ApiError, deleteCustomerAccount, getCustomerDetails, updateCustomer } from '@/lib/api';
import { AuthContext } from '@/lib/auth-context';
import { formatInr } from '@/lib/format';
import {
  clearLocalFcmRegistrationState,
  getInitialPushRegistrationStatus,
  registerForPushNotifications,
  subscribeToPushRegistrationStatus,
  type SafePushRegistrationStatus,
} from '@/lib/push-notifications';

const tabularNums: TextStyle['fontVariant'] = ['tabular-nums'];
const ACCOUNT_DELETION_POLICY_URL = 'https://www.cleanodry.com/account-deletion';
const SHOW_PUSH_NOTIFICATION_STATUS =
  __DEV__ ||
  process.env.EXPO_PUBLIC_SHOW_PUSH_STATUS === 'true' ||
  process.env.EAS_BUILD_PROFILE === 'preview' ||
  process.env.EXPO_PUBLIC_EAS_BUILD_PROFILE === 'preview';
const genderOptions = [
  { id: 'male', name: 'Male' },
  { id: 'female', name: 'Female' },
  { id: 'other', name: 'Other' },
];

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

function createEmptyPushStatus(): SafePushRegistrationStatus {
  return {
    notificationPermission: 'unknown',
    physicalDevice: 'no',
    fcmTokenGenerated: 'no',
    tokenType: 'unknown',
    backendRegistrationAttempted: 'no',
    backendRegistrationCacheSkipped: 'no',
    backendResponseStatus: 'not_requested',
    registrationResult: 'unknown',
    lastSafeErrorMessage: '',
    lastRegistrationTime: 'Never',
  };
}

function formatPushStatusTime(value: string) {
  if (!value || value === 'Never') {
    return 'Never';
  }

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return value;
  }

  return date.toLocaleString();
}

function PushStatusRow({ label, value }: { label: string; value: string }) {
  return (
    <View style={styles.pushStatusRow}>
      <Text style={styles.pushStatusLabel}>{label}</Text>
      <Text selectable style={styles.pushStatusValue}>
        {value || 'None'}
      </Text>
    </View>
  );
}

function PushNotificationStatusSection({
  loading,
  status,
  onRetry,
}: {
  loading: boolean;
  status: SafePushRegistrationStatus;
  onRetry: () => void;
}) {
  return (
    <AppCard>
      <View style={styles.pushStatusSection}>
        <View style={styles.pushStatusHead}>
          <Text style={styles.pushStatusTitle}>Push Notification Status</Text>
          <Text style={styles.pushStatusBadge}>Dev</Text>
        </View>
        <View style={styles.pushStatusGrid}>
          <PushStatusRow label="Notification permission" value={status.notificationPermission} />
          <PushStatusRow label="Physical device" value={status.physicalDevice} />
          <PushStatusRow label="FCM token generated" value={status.fcmTokenGenerated} />
          <PushStatusRow label="Token type" value={status.tokenType} />
          <PushStatusRow label="Backend registration attempted" value={status.backendRegistrationAttempted} />
          <PushStatusRow label="Backend registration cache skipped" value={status.backendRegistrationCacheSkipped} />
          <PushStatusRow label="Backend response status" value={status.backendResponseStatus} />
          <PushStatusRow label="Registration result" value={status.registrationResult} />
          <PushStatusRow label="Last safe error message" value={status.lastSafeErrorMessage || 'None'} />
          <PushStatusRow label="Last registration time" value={formatPushStatusTime(status.lastRegistrationTime)} />
        </View>
        <Button title="Retry Push Registration" variant="outline" loading={loading} onPress={onRetry} />
      </View>
    </AppCard>
  );
}

export default function ProfileScreen() {
  const auth = use(AuthContext);
  const user = auth.user;
  const signOut = auth.signOut;
  const deletionInFlight = useRef(false);
  const [customer, setCustomer] = useState<Record<string, unknown> | null>(null);
  const [message, setMessage] = useState('');
  const [success, setSuccess] = useState('');
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [deletingAccount, setDeletingAccount] = useState(false);
  const [genderPickerOpen, setGenderPickerOpen] = useState(false);
  const [pushStatus, setPushStatus] = useState<SafePushRegistrationStatus>(() => createEmptyPushStatus());
  const [pushRetrying, setPushRetrying] = useState(false);
  const [form, setForm] = useState({
    firstName: '',
    lastName: '',
    email: '',
    gender: '',
    address: '',
    pincode: '',
    gstNo: '',
  });

  const fillForm = useCallback((nextCustomer: Record<string, unknown> | null) => {
    setForm({
      firstName: String(nextCustomer?.first_name ?? user?.firstName ?? '').trim(),
      lastName: String(nextCustomer?.last_name ?? user?.lastName ?? '').trim(),
      email: String(nextCustomer?.email ?? '').trim(),
      gender: String(nextCustomer?.gender ?? '').trim().toLowerCase(),
      address: String(nextCustomer?.address ?? '').trim(),
      pincode: String(nextCustomer?.pincode ?? '').trim(),
      gstNo: String(nextCustomer?.gst_no ?? '').trim(),
    });
  }, [user?.firstName, user?.lastName]);

  useEffect(() => {
    if (!user) {
      return;
    }
    getCustomerDetails(user.token)
      .then((data) => {
        setCustomer(data.customer);
        fillForm(data.customer);
      })
      .catch((error) => {
        if (error instanceof ApiError && error.status === 401) {
          signOut();
          return;
        }
        setMessage(error instanceof Error ? error.message : 'Could not load profile.');
      });
  }, [fillForm, signOut, user]);

  useEffect(() => {
    if (!SHOW_PUSH_NOTIFICATION_STATUS || !auth.user) {
      return;
    }

    let mounted = true;
    const unsubscribe = subscribeToPushRegistrationStatus((status) => {
      if (mounted) {
        setPushStatus(status);
      }
    });

    getInitialPushRegistrationStatus()
      .then((status) => {
        if (mounted) {
          setPushStatus(status);
        }
      })
      .catch(() => undefined);

    return () => {
      mounted = false;
      unsubscribe();
    };
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
  const selectedGender = genderOptions.find((option) => option.id === form.gender);
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

  function accountDeletionErrorMessage(error: unknown) {
    if (error instanceof ApiError) {
      switch (error.status) {
        case 0:
          return error.message || 'Network error. Please check your connection and try again.';
        case 401:
          return 'Your session has expired. Please log in again before requesting account deletion.';
        case 403:
          return 'Account deletion is not allowed for this account right now. Please contact Cleanodry support.';
        case 404:
          return 'We could not find this account for deletion. Please contact Cleanodry support.';
        case 422:
          return error.message || 'This account cannot be deleted right now. Please contact Cleanodry support.';
        case 429:
          return 'Too many deletion requests. Please wait and try again later.';
        default:
          if (error.status >= 500) {
            return 'Cleanodry servers are unavailable right now. Please try again later.';
          }
          return error.message || 'Could not delete your account. Please try again.';
      }
    }

    return error instanceof Error ? error.message : 'Could not delete your account. Please try again.';
  }

  async function openAccountDeletionPolicy() {
    try {
      const url = new URL(ACCOUNT_DELETION_POLICY_URL);
      if (url.protocol !== 'https:' || url.hostname !== 'www.cleanodry.com') {
        setMessage('Account deletion policy link is not trusted.');
        return;
      }

      const canOpen = await Linking.canOpenURL(ACCOUNT_DELETION_POLICY_URL);
      if (!canOpen) {
        setMessage('Could not open the account deletion policy on this device.');
        return;
      }
      await Linking.openURL(ACCOUNT_DELETION_POLICY_URL);
    } catch {
      setMessage('Could not open the account deletion policy on this device.');
    }
  }

  async function performAccountDeletion() {
    if (!auth.user?.token || deletionInFlight.current) {
      return;
    }

    deletionInFlight.current = true;
    setDeletingAccount(true);
    setMessage('');
    setSuccess('');

    try {
      await deleteCustomerAccount(auth.user.token);
      setCustomer(null);
      await clearLocalFcmRegistrationState();
      await auth.signOut();
      router.replace('/login');
      Alert.alert('Account deletion completed', 'Your Cleanodry account deletion request has been completed.');
    } catch (error) {
      setMessage(accountDeletionErrorMessage(error));
    } finally {
      deletionInFlight.current = false;
      setDeletingAccount(false);
    }
  }

  async function retryPushRegistration() {
    if (!auth.user?.token || pushRetrying) {
      return;
    }

    setPushRetrying(true);
    try {
      await registerForPushNotifications(
        auth.user.token,
        auth.user.customerId,
        auth.user.store?.id,
        setPushStatus,
        true,
      );
    } catch {
      // The safe failure status is supplied by registerForPushNotifications.
    } finally {
      setPushRetrying(false);
    }
  }

  function confirmAccountDeletion() {
    if (deletingAccount) {
      return;
    }

    if (Platform.OS === 'web' && typeof window !== 'undefined') {
      const firstConfirmed = window.confirm(
        'Delete your account?\n\nThis action is permanent. You will lose access to your Cleanodry profile, saved addresses, notifications, and customer app data. Some order or invoice records may be retained where legally required.',
      );
      if (!firstConfirmed) {
        return;
      }

      const secondConfirmed = window.confirm(
        'Confirm account deletion\n\nAre you sure you want to permanently delete your Cleanodry account?',
      );
      if (secondConfirmed) {
        void performAccountDeletion();
      }
      return;
    }

    Alert.alert(
      'Delete your account?',
      'This action is permanent. You will lose access to your Cleanodry profile, saved addresses, notifications, and customer app data. Some order or invoice records may be retained where legally required.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Continue',
          style: 'destructive',
          onPress: () => {
            Alert.alert(
              'Confirm account deletion',
              'Are you sure you want to permanently delete your Cleanodry account?',
              [
                { text: 'Cancel', style: 'cancel' },
                {
                  text: 'Delete Account',
                  style: 'destructive',
                  onPress: () => {
                    void performAccountDeletion();
                  },
                },
              ],
            );
          },
        },
      ],
    );
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
            <View style={styles.genderPicker}>
              <Text style={styles.genderPickerLabel}>Gender</Text>
              <Pressable
                style={styles.genderPickerButton}
                onPress={() => setGenderPickerOpen((open) => !open)}
                accessibilityRole="button"
                accessibilityLabel="Select gender">
                <Text style={[styles.genderPickerTitle, !selectedGender ? styles.genderPickerPlaceholder : null]}>
                  {selectedGender?.name ?? 'Select gender'}
                </Text>
                <Text style={styles.genderPickerArrow}>{genderPickerOpen ? '▲' : '▼'}</Text>
              </Pressable>
              {genderPickerOpen ? (
                <View style={styles.genderPickerOptions}>
                  {genderOptions.map((option) => {
                    const selected = option.id === form.gender;
                    return (
                      <Pressable
                        key={option.id}
                        style={[styles.genderPickerOption, selected ? styles.genderPickerOptionSelected : null]}
                        onPress={() => {
                          setForm((current) => ({ ...current, gender: option.id }));
                          setGenderPickerOpen(false);
                        }}>
                        <Text style={[styles.genderPickerOptionText, selected ? styles.genderPickerOptionTextSelected : null]}>
                          {option.name}
                        </Text>
                        <Text style={[styles.genderPickerAction, selected ? styles.genderPickerActionSelected : null]}>
                          {selected ? 'Selected' : 'Select'}
                        </Text>
                      </Pressable>
                    );
                  })}
                </View>
              ) : null}
            </View>
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
      {SHOW_PUSH_NOTIFICATION_STATUS && auth.user ? (
        <PushNotificationStatusSection
          loading={pushRetrying}
          status={pushStatus}
          onRetry={() => {
            void retryPushRegistration();
          }}
        />
      ) : null}
      {auth.user ? (
        <AppCard>
          <View style={styles.dangerSection}>
            <View style={styles.dangerCopy}>
              <Text style={styles.dangerTitle}>Delete Account</Text>
              <Text selectable style={styles.dangerText}>
                Deleting your account is permanent. Your profile and app access will be removed. Some order, invoice,
                payment, tax, or legal records may be retained where required.
              </Text>
              <Pressable
                disabled={deletingAccount}
                onPress={() => {
                  setMessage('');
                  void openAccountDeletionPolicy();
                }}
                accessibilityRole="link">
                <Text style={styles.policyLink}>Account Deletion Policy</Text>
              </Pressable>
            </View>
            <Pressable
              disabled={deletingAccount}
              onPress={confirmAccountDeletion}
              style={({ pressed }) => [
                styles.deleteButton,
                pressed ? styles.deleteButtonPressed : null,
                deletingAccount ? styles.deleteButtonDisabled : null,
              ]}>
              <Text style={styles.deleteButtonText}>{deletingAccount ? 'Deleting...' : 'Delete Account'}</Text>
            </Pressable>
          </View>
        </AppCard>
      ) : null}
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
  genderPicker: {
    gap: 8,
  },
  genderPickerLabel: {
    color: '#1F2A1B',
    fontSize: 14,
    fontWeight: '800' as const,
  },
  genderPickerButton: {
    alignItems: 'center' as const,
    backgroundColor: '#FAFCF8',
    borderColor: 'rgba(52, 122, 0, 0.18)',
    borderRadius: 16,
    borderWidth: 1.5,
    flexDirection: 'row' as const,
    justifyContent: 'space-between' as const,
    minHeight: 52,
    paddingHorizontal: 14,
  },
  genderPickerTitle: {
    color: brand.black,
    flex: 1,
    fontSize: 16,
    fontWeight: '800' as const,
  },
  genderPickerPlaceholder: {
    color: '#9C9C9C',
    fontWeight: '600' as const,
  },
  genderPickerArrow: {
    color: brand.green,
    fontSize: 12,
    fontWeight: '900' as const,
  },
  genderPickerOptions: {
    borderColor: 'rgba(52, 122, 0, 0.14)',
    borderRadius: 16,
    borderWidth: 1,
    overflow: 'hidden' as const,
  },
  genderPickerOption: {
    alignItems: 'center' as const,
    backgroundColor: brand.white,
    borderBottomColor: 'rgba(52, 122, 0, 0.10)',
    borderBottomWidth: 1,
    flexDirection: 'row' as const,
    justifyContent: 'space-between' as const,
    padding: 13,
  },
  genderPickerOptionSelected: {
    backgroundColor: '#F0F7EB',
  },
  genderPickerOptionText: {
    color: brand.black,
    fontSize: 14,
    fontWeight: '800' as const,
  },
  genderPickerOptionTextSelected: {
    color: brand.green,
  },
  genderPickerAction: {
    color: brand.gray,
    fontSize: 12,
    fontWeight: '800' as const,
  },
  genderPickerActionSelected: {
    color: brand.green,
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
  pushStatusSection: {
    gap: 14,
  },
  pushStatusHead: {
    alignItems: 'center' as const,
    flexDirection: 'row' as const,
    justifyContent: 'space-between' as const,
  },
  pushStatusTitle: {
    color: '#111B0D',
    flex: 1,
    fontSize: 18,
    fontWeight: '900' as const,
  },
  pushStatusBadge: {
    backgroundColor: '#EAF5E4',
    borderColor: 'rgba(52, 122, 0, 0.18)',
    borderRadius: 999,
    borderWidth: 1,
    color: brand.greenDark,
    fontSize: 11,
    fontWeight: '900' as const,
    overflow: 'hidden' as const,
    paddingHorizontal: 10,
    paddingVertical: 5,
    textTransform: 'uppercase' as const,
  },
  pushStatusGrid: {
    borderColor: 'rgba(52, 122, 0, 0.10)',
    borderRadius: 18,
    borderWidth: 1,
    overflow: 'hidden' as const,
  },
  pushStatusRow: {
    backgroundColor: brand.white,
    borderBottomColor: 'rgba(52, 122, 0, 0.10)',
    borderBottomWidth: 1,
    gap: 4,
    paddingHorizontal: 14,
    paddingVertical: 11,
  },
  pushStatusLabel: {
    color: '#74806F',
    fontSize: 11,
    fontWeight: '900' as const,
    textTransform: 'uppercase' as const,
  },
  pushStatusValue: {
    color: '#26311F',
    fontSize: 14,
    fontWeight: '800' as const,
    lineHeight: 20,
  },
  dangerSection: {
    gap: 16,
  },
  dangerCopy: {
    gap: 8,
  },
  dangerTitle: {
    color: brand.danger,
    fontSize: 18,
    fontWeight: '900' as const,
  },
  dangerText: {
    color: '#6B4B45',
    fontSize: 14,
    fontWeight: '700' as const,
    lineHeight: 21,
  },
  policyLink: {
    color: brand.greenDark,
    fontSize: 14,
    fontWeight: '900' as const,
    textDecorationLine: 'underline' as const,
  },
  deleteButton: {
    alignItems: 'center' as const,
    backgroundColor: brand.danger,
    borderRadius: 14,
    justifyContent: 'center' as const,
    minHeight: 48,
    paddingHorizontal: 18,
    paddingVertical: 13,
  },
  deleteButtonPressed: {
    opacity: 0.82,
  },
  deleteButtonDisabled: {
    opacity: 0.6,
  },
  deleteButtonText: {
    color: brand.white,
    fontSize: 15,
    fontWeight: '900' as const,
  },
};
