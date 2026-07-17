import { use, useEffect, useMemo, useState } from 'react';
import { Pressable, Text, View } from 'react-native';

import { AppCard, AppShell, LoadingScreen } from '@/components/app-shell';
import { Button, Field, Message, SelectBox, brand } from '@/components/cleanodry-ui';
import { LoginCard } from '@/components/login-card';
import { AuthContext } from '@/lib/auth-context';
import { ApiError, getCustomerDetails, getServices, getStores, schedulePickup, type Service, type Store } from '@/lib/api';

const timeSlots = [
  { id: '10-12', name: '10 AM - 12 PM', startHour: 10 },
  { id: '12-14', name: '12 PM - 2 PM', startHour: 12 },
  { id: '14-16', name: '2 PM - 4 PM', startHour: 14 },
  { id: '16-18', name: '4 PM - 6 PM', startHour: 16 },
  { id: '18-20', name: '6 PM - 8 PM', startHour: 18 },
];

function localDateId(date: Date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

function todayDate() {
  return localDateId(new Date());
}

function pickupDateOptions() {
  const today = new Date();

  return Array.from({ length: 7 }, (_, index) => {
    const date = new Date(today);
    date.setDate(today.getDate() + index);
    const id = localDateId(date);
    const label = date.toLocaleDateString('en-IN', {
      day: '2-digit',
      month: 'short',
      weekday: 'short',
    });

    return {
      id,
      name: index === 0 ? `Today, ${label}` : index === 1 ? `Tomorrow, ${label}` : label,
      detail: id,
    };
  });
}

function pickupTimeOptions(pickupDate: string) {
  if (pickupDate !== todayDate()) {
    return timeSlots;
  }

  const minStart = new Date();
  minStart.setHours(minStart.getHours() + 2);
  return timeSlots.filter((slot) => slot.startHour >= minStart.getHours() + minStart.getMinutes() / 60);
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
  const [pickupDate, setPickupDate] = useState(todayDate());
  const [pickupTime, setPickupTime] = useState('10-12');
  const [notes, setNotes] = useState('');
  const [servicePickerOpen, setServicePickerOpen] = useState(false);
  const [datePickerOpen, setDatePickerOpen] = useState(false);
  const [timePickerOpen, setTimePickerOpen] = useState(false);
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
        if (error instanceof ApiError && error.status === 401) {
          auth.signOut();
          return;
        }
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
  const selectedService = serviceOptions.find((service) => Number(service.id) === serviceId);
  const dateOptions = useMemo(() => pickupDateOptions(), []);
  const selectedDate = dateOptions.find((date) => String(date.id) === pickupDate);
  const availableTimeSlots = useMemo(() => pickupTimeOptions(pickupDate), [pickupDate]);
  const selectedTime = availableTimeSlots.find((slot) => String(slot.id) === pickupTime);

  useEffect(() => {
    if (availableTimeSlots.length > 0 && !availableTimeSlots.some((slot) => slot.id === pickupTime)) {
      setPickupTime(availableTimeSlots[0].id);
    }
  }, [availableTimeSlots, pickupTime]);

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
    if (!availableTimeSlots.some((slot) => slot.id === pickupTime)) {
      setMessage('No valid pickup slots are left for today. Please select a later date.');
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
      if (error instanceof ApiError && error.status === 401) {
        auth.signOut();
        return;
      }
      setMessage(error instanceof Error ? error.message : 'Could not schedule pickup.');
    } finally {
      setLoading(false);
    }
  }

  if (auth.loading) {
    return <LoadingScreen />;
  }

  return (
    <AppShell
      title="Schedule Pickup"
      subtitle={auth.user ? 'Select service, pickup date, and time slot.' : 'Login first, then schedule your pickup.'}
      icon="pickup"
      requireAuth={false}>
      {!auth.user ? (
        <LoginCard />
      ) : (
      <AppCard>
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
        <Field label="Address" value={address} onChangeText={setAddress} placeholder="Pickup address" />
        <View style={local.servicePicker}>
          <Text style={local.servicePickerLabel}>Service</Text>
          <Pressable
            style={local.servicePickerButton}
            onPress={() => setServicePickerOpen((open) => !open)}
            accessibilityRole="button"
            accessibilityLabel="Select service">
            <View style={local.servicePickerCopy}>
              <Text style={local.servicePickerTitle}>{selectedService?.name ?? 'Loading services...'}</Text>
              {selectedService?.detail ? <Text style={local.servicePickerDetail}>{selectedService.detail}</Text> : null}
            </View>
            <Text style={local.servicePickerArrow}>{servicePickerOpen ? '▲' : '▼'}</Text>
          </Pressable>
          {servicePickerOpen ? (
            <View style={local.servicePickerOptions}>
              {serviceOptions.length === 0 ? <Text style={local.servicePickerEmpty}>Loading services...</Text> : null}
              {serviceOptions.map((service) => {
                const selected = Number(service.id) === serviceId;
                return (
                  <Pressable
                    key={String(service.id)}
                    style={[local.servicePickerOption, selected ? local.servicePickerOptionSelected : null]}
                    onPress={() => {
                      setServiceId(Number(service.id));
                      setServicePickerOpen(false);
                    }}>
                    <View style={local.servicePickerCopy}>
                      <Text style={[local.servicePickerOptionTitle, selected ? local.servicePickerOptionTitleSelected : null]}>
                        {service.name}
                      </Text>
                      {service.detail ? <Text style={local.servicePickerDetail}>{service.detail}</Text> : null}
                    </View>
                    <Text style={[local.servicePickerOptionAction, selected ? local.servicePickerOptionActionSelected : null]}>
                      {selected ? 'Selected' : 'Select'}
                    </Text>
                  </Pressable>
                );
              })}
            </View>
          ) : null}
        </View>
        <View style={local.servicePicker}>
          <Text style={local.servicePickerLabel}>Pickup Date</Text>
          <Pressable
            style={local.servicePickerButton}
            onPress={() => setDatePickerOpen((open) => !open)}
            accessibilityRole="button"
            accessibilityLabel="Select pickup date">
            <View style={local.servicePickerCopy}>
              <Text style={local.servicePickerTitle}>{selectedDate?.name ?? 'Select pickup date'}</Text>
              {selectedDate?.detail ? <Text style={local.servicePickerDetail}>{selectedDate.detail}</Text> : null}
            </View>
            <Text style={local.servicePickerArrow}>{datePickerOpen ? '▲' : '▼'}</Text>
          </Pressable>
          {datePickerOpen ? (
            <View style={local.servicePickerOptions}>
              {dateOptions.map((date) => {
                const selected = String(date.id) === pickupDate;
                return (
                  <Pressable
                    key={String(date.id)}
                    style={[local.servicePickerOption, selected ? local.servicePickerOptionSelected : null]}
                    onPress={() => {
                      setPickupDate(String(date.id));
                      setDatePickerOpen(false);
                    }}>
                    <View style={local.servicePickerCopy}>
                      <Text style={[local.servicePickerOptionTitle, selected ? local.servicePickerOptionTitleSelected : null]}>
                        {date.name}
                      </Text>
                      <Text style={local.servicePickerDetail}>{date.detail}</Text>
                    </View>
                    <Text style={[local.servicePickerOptionAction, selected ? local.servicePickerOptionActionSelected : null]}>
                      {selected ? 'Selected' : 'Select'}
                    </Text>
                  </Pressable>
                );
              })}
            </View>
          ) : null}
        </View>
        <View style={local.servicePicker}>
          <Text style={local.servicePickerLabel}>Pickup Time</Text>
          <Pressable
            style={local.servicePickerButton}
            onPress={() => setTimePickerOpen((open) => !open)}
            accessibilityRole="button"
            accessibilityLabel="Select pickup time">
            <View style={local.servicePickerCopy}>
              <Text style={local.servicePickerTitle}>{selectedTime?.name ?? 'No slots left today'}</Text>
              <Text style={local.servicePickerDetail}>{selectedTime ? 'Available pickup slot' : 'Pick a later date'}</Text>
            </View>
            <Text style={local.servicePickerArrow}>{timePickerOpen ? '▲' : '▼'}</Text>
          </Pressable>
          {timePickerOpen ? (
            <View style={local.servicePickerOptions}>
              {availableTimeSlots.length === 0 ? (
                <Text style={local.servicePickerEmpty}>No slots left today. Pick a later date.</Text>
              ) : null}
              {availableTimeSlots.map((slot) => {
                const selected = String(slot.id) === pickupTime;
                return (
                  <Pressable
                    key={String(slot.id)}
                    style={[local.servicePickerOption, selected ? local.servicePickerOptionSelected : null]}
                    onPress={() => {
                      setPickupTime(String(slot.id));
                      setTimePickerOpen(false);
                    }}>
                    <Text style={[local.servicePickerOptionTitle, selected ? local.servicePickerOptionTitleSelected : null]}>
                      {slot.name}
                    </Text>
                    <Text style={[local.servicePickerOptionAction, selected ? local.servicePickerOptionActionSelected : null]}>
                      {selected ? 'Selected' : 'Select'}
                    </Text>
                  </Pressable>
                );
              })}
            </View>
          ) : null}
        </View>
        <Field label="Notes" value={notes} onChangeText={setNotes} placeholder="Optional instructions" />
        <Message text={message} />
        <Message text={success} tone="success" />
        <Button title="Submit Pickup" loading={loading} onPress={handleSubmit} />
      </AppCard>
      )}
    </AppShell>
  );
}

const local = {
  lockedStore: {
    backgroundColor: '#F0F7EB',
    borderColor: 'rgba(52, 122, 0, 0.22)',
    borderRadius: 8,
    borderWidth: 1,
    gap: 2,
    padding: 10,
  },
  lockedStoreLabel: {
    color: brand.gray,
    fontSize: 10,
    fontWeight: '800' as const,
    textTransform: 'uppercase' as const,
  },
  lockedStoreName: {
    color: brand.green,
    fontSize: 14,
    fontWeight: '800' as const,
  },
  lockedStoreHint: {
    color: brand.gray,
    fontSize: 11,
    lineHeight: 14,
  },
  servicePicker: {
    gap: 5,
  },
  servicePickerLabel: {
    color: brand.black,
    fontSize: 12,
    fontWeight: '800' as const,
  },
  servicePickerButton: {
    alignItems: 'center' as const,
    backgroundColor: '#FBFDF9',
    borderColor: 'rgba(52, 122, 0, 0.18)',
    borderRadius: 14,
    borderWidth: 1,
    flexDirection: 'row' as const,
    gap: 12,
    justifyContent: 'space-between' as const,
    minHeight: 46,
    paddingHorizontal: 12,
    paddingVertical: 7,
  },
  servicePickerCopy: {
    flex: 1,
    gap: 2,
  },
  servicePickerTitle: {
    color: brand.green,
    fontSize: 14,
    fontWeight: '900' as const,
  },
  servicePickerDetail: {
    color: brand.gray,
    fontSize: 11,
    fontWeight: '700' as const,
  },
  servicePickerArrow: {
    color: brand.green,
    fontSize: 12,
    fontWeight: '900' as const,
  },
  servicePickerOptions: {
    borderColor: 'rgba(52, 122, 0, 0.14)',
    borderRadius: 16,
    borderWidth: 1,
    overflow: 'hidden' as const,
  },
  servicePickerEmpty: {
    color: brand.gray,
    fontSize: 13,
    fontWeight: '700' as const,
    padding: 10,
    textAlign: 'center' as const,
  },
  servicePickerOption: {
    alignItems: 'center' as const,
    backgroundColor: brand.white,
    borderBottomColor: 'rgba(52, 122, 0, 0.10)',
    borderBottomWidth: 1,
    flexDirection: 'row' as const,
    gap: 10,
    justifyContent: 'space-between' as const,
    padding: 10,
  },
  servicePickerOptionSelected: {
    backgroundColor: '#F0F7EB',
  },
  servicePickerOptionTitle: {
    color: brand.black,
    fontSize: 14,
    fontWeight: '800' as const,
  },
  servicePickerOptionTitleSelected: {
    color: brand.green,
  },
  servicePickerOptionAction: {
    color: brand.gray,
    fontSize: 12,
    fontWeight: '800' as const,
  },
  servicePickerOptionActionSelected: {
    color: brand.green,
  },
};
