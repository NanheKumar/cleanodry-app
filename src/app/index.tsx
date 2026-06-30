import { router, useLocalSearchParams } from 'expo-router';
import { Image } from 'expo-image';
import { use, useEffect, useState } from 'react';
import { Linking, Pressable, ScrollView, Text, View } from 'react-native';

import { AppCard, AppShell, type AppSection, MenuGlyph, isAppSection } from '@/components/app-shell';
import { Button, Message, brand } from '@/components/cleanodry-ui';
import {
  ApiError,
  getCustomerPackageLabels,
  getStorePackages,
  getWebsiteStores,
  type CustomerPackageLabelsPayload,
  type StorePackage,
  type WebsiteStore,
} from '@/lib/api';
import { AuthContext } from '@/lib/auth-context';
import { formatInr } from '@/lib/format';

const serviceCards = [
  {
    title: 'Premium Dry Cleaning',
    text: 'Expert care for delicate and luxury garments.',
    image: require('@/assets/images/service-dry-cleaning.png'),
  },
  {
    title: 'Steam Iron',
    text: 'Crisp finishing with professional steam care.',
    image: require('@/assets/images/service-steam-iron.png'),
  },
  {
    title: 'Shoe Care',
    text: 'Deep cleaning, stain removal, and restoration.',
    image: require('@/assets/images/service-shoe.png'),
  },
  {
    title: 'Bag Care',
    text: 'Specialized cleaning for premium bags.',
    image: require('@/assets/images/service-bag.png'),
  },
  {
    title: 'Sofa Care',
    text: 'Deep cleaning and sanitization for upholstery.',
    image: require('@/assets/images/service-sofa.png'),
  },
];

function HomeContent({ userName, mobile, storeName }: { userName: string; mobile: string; storeName?: string }) {
  return (
    <>
      <View style={local.welcomeCard}>
        <View style={local.welcomeCopy}>
          <Text style={local.eyebrow}>Premium care</Text>
          <Text style={local.welcomeTitle}>Hi {userName.split(' ')[0] || 'there'}, ready for fresh clothes?</Text>
          <Text style={local.welcomeText}>Schedule doorstep pickup, track requests, and manage your Cleanodry account from here.</Text>
        </View>
        <Image source={require('@/assets/images/hero-mobile-banner.png')} style={local.welcomeImage} contentFit="cover" />
      </View>

      <View style={local.accountCard}>
        <View style={local.accountIcon}>
          <MenuGlyph name="account" />
        </View>
        <View style={local.accountCopy}>
          <Text style={local.accountName}>{userName}</Text>
          <Text style={local.accountSub}>{storeName || 'Store not linked'} · +91 {mobile}</Text>
        </View>
      </View>

      <View style={local.quickGrid}>
        <Pressable style={local.primaryAction} onPress={() => router.push('/pickup')}>
          <View style={local.actionIcon}>
            <MenuGlyph name="pickup" />
          </View>
          <View style={local.primaryActionCopy}>
            <Text style={local.primaryActionTitle}>Schedule Pickup</Text>
            <Text style={local.primaryActionSub}>Book a convenient date and time.</Text>
          </View>
        </Pressable>
        <Pressable style={local.quickTile} onPress={() => router.push('/orders')}>
          <View style={local.quickIcon}>
            <MenuGlyph name="orders" />
          </View>
          <Text style={local.quickTitle}>Orders</Text>
          <Text style={local.quickSub}>Track cleaning status.</Text>
        </Pressable>
        <Pressable style={local.quickTile} onPress={() => router.push('/pickups')}>
          <View style={local.quickIcon}>
            <MenuGlyph name="pickup" />
          </View>
          <Text style={local.quickTitle}>Pickups</Text>
          <Text style={local.quickSub}>View pickup requests.</Text>
        </Pressable>
        <Pressable style={local.quickTile} onPress={() => router.push('/profile')}>
          <View style={local.quickIcon}>
            <MenuGlyph name="profile" />
          </View>
          <Text style={local.quickTitle}>Profile</Text>
          <Text style={local.quickSub}>Address and account.</Text>
        </Pressable>
      </View>
    </>
  );
}

function ServicesContent() {
  return (
    <AppCard>
      <Text style={local.contentTitle}>Premium services</Text>
      <Text style={local.contentText}>Choose the care category that fits your garment, footwear, bag, or home furnishing.</Text>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={local.cardRail}>
        {serviceCards.map((service) => (
          <View key={service.title} style={local.serviceCard}>
            <Image source={service.image} style={local.serviceImage} contentFit="cover" />
            <Text style={local.serviceTitle}>{service.title}</Text>
            <Text style={local.serviceText}>{service.text}</Text>
          </View>
        ))}
      </ScrollView>
      <Button title="Schedule a Pickup" onPress={() => router.push('/pickup')} />
    </AppCard>
  );
}

function PackagesContent() {
  const auth = use(AuthContext);
  const [customerPackages, setCustomerPackages] = useState<CustomerPackageLabelsPayload | null>(null);
  const [storePackages, setStorePackages] = useState<StorePackage[]>([]);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');

  useEffect(() => {
    if (!auth.user?.token) {
      return;
    }

    let mounted = true;
    setLoading(true);
    setMessage('');
    Promise.all([
      getCustomerPackageLabels(auth.user.token),
      auth.user.store?.id ? getStorePackages(auth.user.token, auth.user.store.id) : Promise.resolve(null),
    ])
      .then(([nextCustomerPackages, nextStorePackages]) => {
        if (!mounted) {
          return;
        }
        setCustomerPackages(nextCustomerPackages);
        setStorePackages(nextStorePackages?.packages ?? []);
      })
      .catch((error) => {
        if (!mounted) {
          return;
        }
        if (error instanceof ApiError && error.status === 401) {
          auth.signOut();
          return;
        }
        setMessage(error instanceof Error ? error.message : 'Could not load packages.');
      })
      .finally(() => {
        if (mounted) {
          setLoading(false);
        }
      });

    return () => {
      mounted = false;
    };
  }, [auth.user?.token, auth.user?.store?.id, auth.signOut]);

  function discountLabel(pkg: StorePackage) {
    if (!pkg.discount_value) {
      return 'Package';
    }
    if (pkg.discount_type === 'percent') {
      return `${pkg.discount_value}% off`;
    }
    return `${formatInr(pkg.discount_value)} off`;
  }

  return (
    <AppCard>
      <Text style={local.contentTitle}>Packages</Text>
      <Text style={local.contentText}>Prepaid care packs help regular customers save on every order.</Text>
      <Message text={message} />
      {loading ? <Text style={local.packageMuted}>Loading packages...</Text> : null}
      {customerPackages?.has_package ? (
        <View style={local.activePackageCard}>
          <View style={local.activePackageHead}>
            <View>
              <Text style={local.activePackageLabel}>Your Package Balance</Text>
              <Text selectable style={local.activePackageAmount}>
                {formatInr(customerPackages.package_balance)}
              </Text>
            </View>
            <Text style={local.activePackageStore}>{customerPackages.store_label || auth.user?.store?.name || 'Store'}</Text>
          </View>
          {customerPackages.packages.map((pkg) => (
            <View key={String(pkg.id)} style={local.customerPackageRow}>
              <Text selectable style={local.customerPackageName}>
                {pkg.package_name}
              </Text>
              <Text selectable style={local.customerPackageLabel}>
                {pkg.label}
              </Text>
            </View>
          ))}
        </View>
      ) : !loading && customerPackages ? (
        <View style={local.noPackageCard}>
          <Text style={local.noPackageTitle}>No active package</Text>
          <Text style={local.noPackageText}>Available packages for your selected store are listed below.</Text>
        </View>
      ) : null}

      <Text style={local.packageSectionTitle}>Available Packages</Text>
      {!loading && customerPackages && storePackages.length === 0 ? (
        <Text style={local.packageMuted}>No store packages found for your selected store.</Text>
      ) : null}
      {storePackages.map((pkg) => (
        <View key={String(pkg.id)} style={local.packageCard}>
          <View style={local.packageCopy}>
            <Text selectable style={local.packageName}>
              {pkg.name}
            </Text>
            <Text style={local.packageWorth}>{pkg.description || pkg.label || 'Prepaid package'}</Text>
            {pkg.validity_days ? <Text style={local.packageMeta}>Valid for {pkg.validity_days} days</Text> : null}
            {pkg.services?.length ? (
              <Text style={local.packageMeta}>
                Services: {pkg.services.map((service) => service.name).join(', ')}
              </Text>
            ) : null}
          </View>
          <View style={local.packagePriceBox}>
            <Text selectable style={local.packagePrice}>
              {formatInr(pkg.amount)}
            </Text>
            <Text style={local.packageDiscount}>{discountLabel(pkg)}</Text>
          </View>
        </View>
      ))}
    </AppCard>
  );
}

function StoresContent() {
  const [stores, setStores] = useState<WebsiteStore[]>([]);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');

  useEffect(() => {
    let mounted = true;
    setLoading(true);
    setMessage('');
    getWebsiteStores()
      .then((nextStores) => {
        if (mounted) {
          setStores(nextStores);
        }
      })
      .catch((error) => {
        if (mounted) {
          setMessage(error instanceof Error ? error.message : 'Could not load stores.');
        }
      })
      .finally(() => {
        if (mounted) {
          setLoading(false);
        }
      });

    return () => {
      mounted = false;
    };
  }, []);

  function contactNumber(store: WebsiteStore) {
    return String(store.contact_no || store.mobile || '').trim();
  }

  return (
    <AppCard>
      <Text style={local.contentTitle}>Store locator</Text>
      <Text style={local.contentText}>Cleanodry is serving customers across multiple locations.</Text>
      <Image source={require('@/assets/images/stores-map.png')} style={local.mapImage} contentFit="contain" />
      <Message text={message} />
      {loading ? <Text style={local.storeMuted}>Loading stores...</Text> : null}
      {!loading && !message && stores.length === 0 ? <Text style={local.storeMuted}>No stores found.</Text> : null}
      {stores.map((store) => {
        const phone = contactNumber(store);
        const location = [store.city, store.state_name, store.pincode].filter(Boolean).join(', ');
        const email = String(store.email ?? '').trim();
        const showEmail = email.toLowerCase() !== 'factory@cleanodry.com';
        return (
          <View key={String(store.id)} style={local.storeCard}>
            <View style={local.storeCardHead}>
              <View style={local.storePinIcon}>
                <MenuGlyph name="stores" />
              </View>
              <View style={local.storeCardCopy}>
                <Text selectable style={local.storeName}>
                  {store.name}
                  {store.code ? ` (${store.code})` : ''}
                </Text>
              </View>
            </View>
            {store.address ? (
              <Text selectable style={local.storeAddress}>
                {store.address}
              </Text>
            ) : null}
            {location ? <Text style={local.storeMeta}>{location}</Text> : null}
            {email && showEmail ? (
              <Text selectable style={local.storeMeta}>
                {email}
              </Text>
            ) : null}
            {phone ? (
              <Pressable style={local.storeCallButton} onPress={() => Linking.openURL(`tel:+91${phone.replace(/\D/g, '').slice(-10)}`)}>
                <MenuGlyph name="support" active />
                <Text style={local.storeCallText}>Call {phone}</Text>
              </Pressable>
            ) : null}
          </View>
        );
      })}
      <Button title="Call Nearest Store" onPress={() => Linking.openURL('tel:+917428380598')} />
    </AppCard>
  );
}

function AboutContent() {
  return (
    <AppCard>
      <Image source={require('@/assets/images/bg-about-mobile.png')} style={local.aboutImage} contentFit="cover" />
      <Text style={local.contentTitle}>Craftsmanship meets technology</Text>
      <Text style={local.contentText}>
        Cleanodry Premium combines advanced cleaning systems, expert fabric handling, and doorstep service so every garment gets careful treatment.
      </Text>
      {['Eco-friendly cleaning', 'Free pickup and delivery', 'Advanced stain removal', 'Expert fabric care'].map((item) => (
        <View key={item} style={local.checkRow}>
          <Text style={local.checkIcon}>✓</Text>
          <Text style={local.checkText}>{item}</Text>
        </View>
      ))}
    </AppCard>
  );
}

function SupportContent() {
  return (
    <AppCard>
      <Text style={local.contentTitle}>Need help?</Text>
      <Text style={local.contentText}>Premium Support is available from 10:00 AM to 08:00 PM.</Text>
      <Pressable style={local.supportRow} onPress={() => Linking.openURL('tel:+917428380598')}>
        <View style={local.supportIcon}>
          <MenuGlyph name="support" active />
        </View>
        <View style={local.supportCopy}>
          <Text style={local.supportTitle}>Call Cleanodry</Text>
          <Text style={local.supportSub}>+91-7428380598</Text>
        </View>
      </Pressable>
      <Pressable style={local.supportRow} onPress={() => Linking.openURL('https://wa.me/917428380598')}>
        <View style={local.supportIcon}>
          <MenuGlyph name="support" active />
        </View>
        <View style={local.supportCopy}>
          <Text style={local.supportTitle}>Chat on WhatsApp</Text>
          <Text style={local.supportSub}>Fast help for pickup and orders</Text>
        </View>
      </Pressable>
    </AppCard>
  );
}

function SectionContent({ active, userName, mobile, storeName }: { active: AppSection; userName: string; mobile: string; storeName?: string }) {
  if (active === 'services') {
    return <ServicesContent />;
  }
  if (active === 'packages') {
    return <PackagesContent />;
  }
  if (active === 'stores') {
    return <StoresContent />;
  }
  if (active === 'about') {
    return <AboutContent />;
  }
  if (active === 'support') {
    return <SupportContent />;
  }

  return <HomeContent userName={userName} mobile={mobile} storeName={storeName} />;
}

export default function HomeScreen() {
  const auth = use(AuthContext);
  const params = useLocalSearchParams<{ section?: string }>();
  const activeSection = isAppSection(params.section) ? params.section : 'home';
  const name = auth.user ? `${auth.user.firstName} ${auth.user.lastName}`.trim() || 'Customer' : 'Customer';

  return (
    <AppShell
      title={activeSection === 'home' ? 'Home' : activeSection.charAt(0).toUpperCase() + activeSection.slice(1)}
      subtitle="Book, track, and manage garment care."
      icon={activeSection === 'home' ? 'home' : activeSection}
      activeSection={activeSection}>
      {auth.user ? (
        <SectionContent
          active={activeSection}
          userName={name}
          mobile={auth.user.mobile}
          storeName={auth.user.store?.name}
        />
      ) : null}
    </AppShell>
  );
}

const local = {
  welcomeCard: {
    backgroundColor: '#EAF5E5',
    borderColor: 'rgba(52, 122, 0, 0.12)',
    borderRadius: 24,
    borderWidth: 1,
    gap: 14,
    overflow: 'hidden' as const,
    padding: 16,
  },
  welcomeCopy: {
    gap: 6,
  },
  eyebrow: {
    color: brand.green,
    fontSize: 12,
    fontWeight: '900' as const,
    letterSpacing: 0.6,
    textTransform: 'uppercase' as const,
  },
  welcomeTitle: {
    color: '#111B0D',
    fontSize: 22,
    fontWeight: '900' as const,
    lineHeight: 27,
  },
  welcomeText: {
    color: '#53624B',
    fontSize: 13,
    lineHeight: 19,
  },
  welcomeImage: {
    aspectRatio: 16 / 7,
    borderRadius: 18,
    width: '100%' as const,
  },
  accountCard: {
    alignItems: 'center' as const,
    backgroundColor: brand.white,
    borderColor: 'rgba(52, 122, 0, 0.12)',
    borderRadius: 20,
    borderWidth: 1,
    flexDirection: 'row' as const,
    gap: 12,
    padding: 14,
  },
  accountIcon: {
    alignItems: 'center' as const,
    backgroundColor: '#EEF6EA',
    borderRadius: 16,
    height: 46,
    justifyContent: 'center' as const,
    width: 46,
  },
  accountCopy: {
    flex: 1,
    gap: 2,
  },
  accountName: {
    color: brand.black,
    fontSize: 14,
    fontWeight: '900' as const,
  },
  accountSub: {
    color: brand.gray,
    fontSize: 12,
    fontWeight: '700' as const,
  },
  quickGrid: {
    flexDirection: 'row' as const,
    flexWrap: 'wrap' as const,
    gap: 12,
  },
  primaryAction: {
    alignItems: 'center' as const,
    backgroundColor: brand.green,
    borderRadius: 22,
    boxShadow: '0 12px 26px rgba(52, 122, 0, 0.20)',
    flexBasis: '100%' as const,
    flexDirection: 'row' as const,
    gap: 14,
    padding: 16,
  },
  actionIcon: {
    alignItems: 'center' as const,
    backgroundColor: brand.white,
    borderRadius: 18,
    height: 64,
    justifyContent: 'center' as const,
    width: 64,
  },
  primaryActionCopy: {
    flex: 1,
    gap: 4,
  },
  primaryActionTitle: {
    color: brand.white,
    fontSize: 17,
    fontWeight: '900' as const,
  },
  primaryActionSub: {
    color: 'rgba(255, 255, 255, 0.82)',
    fontSize: 12,
    lineHeight: 17,
  },
  quickTile: {
    backgroundColor: brand.white,
    borderColor: 'rgba(52, 122, 0, 0.12)',
    borderRadius: 20,
    borderWidth: 1,
    flexBasis: '30%' as const,
    flexGrow: 1,
    gap: 5,
    minHeight: 122,
    padding: 14,
  },
  quickIcon: {
    alignItems: 'center' as const,
    backgroundColor: '#EEF6EA',
    borderRadius: 14,
    height: 42,
    justifyContent: 'center' as const,
    width: 42,
  },
  quickTitle: {
    color: brand.black,
    fontSize: 13,
    fontWeight: '900' as const,
  },
  quickSub: {
    color: brand.gray,
    fontSize: 11,
    lineHeight: 15,
  },
  contentTitle: {
    color: '#111B0D',
    fontSize: 21,
    fontWeight: '900' as const,
    lineHeight: 27,
  },
  contentText: {
    color: brand.gray,
    fontSize: 13,
    lineHeight: 19,
  },
  cardRail: {
    gap: 12,
    paddingRight: 2,
  },
  serviceCard: {
    backgroundColor: '#F6FAF3',
    borderRadius: 18,
    gap: 8,
    overflow: 'hidden' as const,
    paddingBottom: 14,
    width: 230,
  },
  serviceImage: {
    height: 128,
    width: '100%' as const,
  },
  serviceTitle: {
    color: brand.black,
    fontSize: 14,
    fontWeight: '900' as const,
    paddingHorizontal: 14,
  },
  serviceText: {
    color: brand.gray,
    fontSize: 12,
    lineHeight: 17,
    paddingHorizontal: 14,
  },
  packageCard: {
    alignItems: 'center' as const,
    backgroundColor: '#F6FAF3',
    borderColor: 'rgba(52, 122, 0, 0.14)',
    borderRadius: 18,
    borderWidth: 1,
    flexDirection: 'row' as const,
    gap: 12,
    justifyContent: 'space-between' as const,
    padding: 14,
  },
  activePackageCard: {
    backgroundColor: '#EAF7E4',
    borderColor: 'rgba(52, 122, 0, 0.22)',
    borderRadius: 18,
    borderWidth: 1,
    gap: 10,
    padding: 14,
  },
  activePackageHead: {
    alignItems: 'flex-start' as const,
    flexDirection: 'row' as const,
    gap: 12,
    justifyContent: 'space-between' as const,
  },
  activePackageLabel: {
    color: '#56704A',
    fontSize: 11,
    fontWeight: '900' as const,
    textTransform: 'uppercase' as const,
  },
  activePackageAmount: {
    color: brand.greenDark,
    fontSize: 24,
    fontWeight: '900' as const,
    lineHeight: 30,
  },
  activePackageStore: {
    backgroundColor: brand.white,
    borderRadius: 999,
    color: brand.green,
    flexShrink: 1,
    fontSize: 11,
    fontWeight: '900' as const,
    overflow: 'hidden' as const,
    paddingHorizontal: 10,
    paddingVertical: 6,
    textAlign: 'center' as const,
  },
  customerPackageRow: {
    backgroundColor: brand.white,
    borderColor: 'rgba(52, 122, 0, 0.12)',
    borderRadius: 14,
    borderWidth: 1,
    gap: 3,
    padding: 11,
  },
  customerPackageName: {
    color: '#111B0D',
    fontSize: 13,
    fontWeight: '900' as const,
  },
  customerPackageLabel: {
    color: '#5F6C59',
    fontSize: 11,
    fontWeight: '700' as const,
    lineHeight: 16,
  },
  noPackageCard: {
    backgroundColor: '#FAFCF8',
    borderColor: 'rgba(52, 122, 0, 0.12)',
    borderRadius: 18,
    borderWidth: 1,
    gap: 3,
    padding: 14,
  },
  noPackageTitle: {
    color: '#111B0D',
    fontSize: 14,
    fontWeight: '900' as const,
  },
  noPackageText: {
    color: brand.gray,
    fontSize: 12,
    lineHeight: 17,
  },
  packageSectionTitle: {
    color: '#111B0D',
    fontSize: 16,
    fontWeight: '900' as const,
    marginTop: 4,
  },
  packageMuted: {
    color: brand.gray,
    fontSize: 13,
    fontWeight: '700' as const,
    lineHeight: 18,
    textAlign: 'center' as const,
  },
  packageCopy: {
    flex: 1,
    gap: 4,
  },
  packageName: {
    color: brand.black,
    fontSize: 14,
    fontWeight: '900' as const,
  },
  packageWorth: {
    color: brand.gray,
    fontSize: 12,
    marginTop: 3,
  },
  packageMeta: {
    color: '#65715F',
    fontSize: 11,
    lineHeight: 15,
  },
  packagePriceBox: {
    alignItems: 'flex-end' as const,
  },
  packagePrice: {
    color: brand.green,
    fontSize: 16,
    fontWeight: '900' as const,
  },
  packageDiscount: {
    color: brand.green,
    fontSize: 12,
    fontWeight: '800' as const,
  },
  mapImage: {
    aspectRatio: 1342 / 628,
    width: '100%' as const,
  },
  storeMuted: {
    color: brand.gray,
    fontSize: 13,
    fontWeight: '700' as const,
    lineHeight: 18,
    textAlign: 'center' as const,
  },
  storeCard: {
    backgroundColor: '#F6FAF3',
    borderColor: 'rgba(52, 122, 0, 0.14)',
    borderRadius: 18,
    borderWidth: 1,
    gap: 8,
    padding: 14,
  },
  storeCardHead: {
    alignItems: 'center' as const,
    flexDirection: 'row' as const,
    gap: 10,
  },
  storePinIcon: {
    alignItems: 'center' as const,
    backgroundColor: brand.white,
    borderRadius: 14,
    height: 42,
    justifyContent: 'center' as const,
    width: 42,
  },
  storeCardCopy: {
    flex: 1,
    gap: 2,
  },
  storeName: {
    color: '#111B0D',
    fontSize: 15,
    fontWeight: '900' as const,
    lineHeight: 20,
  },
  storeAddress: {
    color: '#4F5B49',
    fontSize: 13,
    fontWeight: '700' as const,
    lineHeight: 19,
  },
  storeMeta: {
    color: brand.gray,
    fontSize: 12,
    fontWeight: '700' as const,
    lineHeight: 17,
  },
  storeCallButton: {
    alignItems: 'center' as const,
    alignSelf: 'flex-start' as const,
    backgroundColor: brand.green,
    borderRadius: 14,
    flexDirection: 'row' as const,
    gap: 8,
    marginTop: 2,
    minHeight: 42,
    paddingHorizontal: 12,
  },
  storeCallText: {
    color: brand.white,
    fontSize: 12,
    fontWeight: '900' as const,
  },
  aboutImage: {
    aspectRatio: 16 / 9,
    borderRadius: 18,
    width: '100%' as const,
  },
  checkRow: {
    alignItems: 'center' as const,
    flexDirection: 'row' as const,
    gap: 10,
  },
  checkIcon: {
    backgroundColor: '#EEF6EA',
    borderRadius: 999,
    color: brand.green,
    fontSize: 14,
    fontWeight: '900' as const,
    overflow: 'hidden' as const,
    paddingHorizontal: 7,
    paddingVertical: 4,
  },
  checkText: {
    color: brand.black,
    flex: 1,
    fontSize: 13,
    fontWeight: '800' as const,
  },
  supportRow: {
    alignItems: 'center' as const,
    backgroundColor: '#F6FAF3',
    borderRadius: 18,
    flexDirection: 'row' as const,
    gap: 12,
    padding: 14,
  },
  supportIcon: {
    alignItems: 'center' as const,
    backgroundColor: brand.green,
    borderRadius: 16,
    height: 42,
    justifyContent: 'center' as const,
    width: 42,
  },
  supportCopy: {
    flex: 1,
    gap: 2,
  },
  supportTitle: {
    color: brand.black,
    fontSize: 14,
    fontWeight: '900' as const,
  },
  supportSub: {
    color: brand.gray,
    fontSize: 12,
    fontWeight: '700' as const,
  },
};
