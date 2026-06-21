import { Redirect, router } from 'expo-router';
import { Image } from 'expo-image';
import { use, useRef, useState } from 'react';
import { Linking, Pressable, ScrollView, Text, View } from 'react-native';

import { Button, Screen, brand } from '@/components/cleanodry-ui';
import { AuthContext } from '@/lib/auth-context';

type SectionKey = 'home' | 'about' | 'services' | 'pricing' | 'stores' | 'faq';

function SiteHeader({ onMenuPress }: { onMenuPress: () => void }) {
  return (
    <>
      <View style={local.siteTopStrip}>
        <Text style={local.siteTopText}>Premium Support, Just a Call Away: +91-7428380598</Text>
        <Text style={local.siteTopText}>Opening hours: 10:00AM to 08:00PM</Text>
      </View>
      <View style={local.siteNav}>
        <Image
          source={require('@/assets/images/logo-color.png')}
          style={local.siteLogo}
          contentFit="contain"
          accessibilityLabel="Cleanodry"
        />
        <Pressable style={local.menuIcon} accessibilityLabel="Open menu" onPress={onMenuPress}>
          <View style={local.menuLine} />
          <View style={local.menuLine} />
          <View style={local.menuLine} />
        </Pressable>
      </View>
    </>
  );
}

function SideMenu({
  visible,
  onClose,
  onLogout,
  userName,
  storeName,
  onSectionPress,
}: {
  visible: boolean;
  onClose: () => void;
  onLogout: () => void;
  userName?: string;
  storeName?: string;
  onSectionPress?: (section: SectionKey) => void;
}) {
  if (!visible) {
    return null;
  }

  function go(path: '/' | '/pickup' | '/orders' | '/pickups' | '/profile') {
    onClose();
    router.push(path);
  }

  function section(sectionKey: SectionKey) {
    onClose();
    onSectionPress?.(sectionKey);
  }

  return (
    <View style={local.menuOverlay}>
      <Pressable style={local.menuScrim} onPress={onClose} />
      <View style={local.menuPanel}>
        <View style={local.menuPanelHead}>
          <Image
            source={require('@/assets/images/logo-color.png')}
            style={local.menuLogo}
            contentFit="contain"
            accessibilityLabel="Cleanodry"
          />
          <Pressable onPress={onClose} style={local.menuClose}>
            <Text style={local.menuCloseText}>×</Text>
          </Pressable>
        </View>
        {userName ? (
          <View style={local.menuUserCard}>
            <Text style={local.menuUserName}>{userName}</Text>
            <Text style={local.menuUserStore}>{storeName || 'Cleanodry Customer'}</Text>
          </View>
        ) : (
          <Text style={local.menuGuestText}>Login to book pickups and track orders.</Text>
        )}
        <Pressable style={local.menuItem} onPress={() => section('home')}>
          <Text style={local.menuItemText}>Home</Text>
        </Pressable>
        <Pressable style={local.menuItem} onPress={() => section('about')}>
          <Text style={local.menuItemText}>About Us</Text>
        </Pressable>
        <Pressable style={local.menuItem} onPress={() => section('services')}>
          <Text style={local.menuItemText}>Services</Text>
        </Pressable>
        <Pressable style={local.menuItem} onPress={() => section('pricing')}>
          <Text style={local.menuItemText}>Packages</Text>
        </Pressable>
        <Pressable style={local.menuItem} onPress={() => section('stores')}>
          <Text style={local.menuItemText}>Store Locator</Text>
        </Pressable>
        <Pressable style={local.menuItem} onPress={() => Linking.openURL('tel:+917428380598')}>
          <Text style={local.menuItemText}>Contact</Text>
        </Pressable>
        <Pressable style={local.menuItem} onPress={() => go('/pickup')}>
          <Text style={local.menuItemText}>Schedule Pickup</Text>
        </Pressable>
        {userName ? (
          <>
            <Pressable style={local.menuItem} onPress={() => go('/profile')}>
              <Text style={local.menuItemText}>My Profile</Text>
            </Pressable>
            <Pressable style={local.menuItem} onPress={() => go('/orders')}>
              <Text style={local.menuItemText}>My Orders</Text>
            </Pressable>
            <Pressable style={local.menuItem} onPress={() => go('/pickups')}>
              <Text style={local.menuItemText}>My Pickups</Text>
            </Pressable>
          </>
        ) : null}
        {userName ? (
          <Pressable
            style={[local.menuItem, local.menuLogout]}
            onPress={() => {
              onClose();
              onLogout();
            }}>
            <Text style={[local.menuItemText, local.menuLogoutText]}>Logout</Text>
          </Pressable>
        ) : null}
      </View>
    </View>
  );
}

const serviceCards = [
  {
    title: 'Premium Dry Cleaning',
    text: 'Advanced fabric care for delicate and luxury garments.',
    image: require('@/assets/images/service-dry-cleaning.png'),
  },
  {
    title: 'Steam Iron',
    text: 'Professional steam ironing for crisp, fresh clothes.',
    image: require('@/assets/images/service-steam-iron.png'),
  },
  {
    title: 'Shoe Care',
    text: 'Deep cleaning, stain removal and restoration.',
    image: require('@/assets/images/service-shoe.png'),
  },
  {
    title: 'Bag Care',
    text: 'Specialized cleaning for luxury bags of all kinds.',
    image: require('@/assets/images/service-bag.png'),
  },
  {
    title: 'Carpet & Curtain Care',
    text: 'Deep cleaning for keeping interiors fresh.',
    image: require('@/assets/images/service-carpet.png'),
  },
  {
    title: 'Sofa Care',
    text: 'Deep-cleaning and sanitization for upholstery.',
    image: require('@/assets/images/service-sofa.png'),
  },
];

const packageCards = [
  { name: 'Premium Refresh', price: '₹5,000', discount: '20%', worth: '₹6,000' },
  { name: 'Dynamic Deluxe', price: '₹10,000', discount: '25%', worth: '₹12,500' },
  { name: 'Supreme Saver', price: '₹25,000', discount: '30%', worth: '₹26,000' },
  { name: 'The Prive', price: '₹40,000', discount: '35%', worth: '₹54,000' },
];

const faqs = [
  ['What Services Does Cleanodry Provide?', 'Dry cleaning, steam iron, shoe care, bag care, sofa care, carpet and curtain care, toy care, winter wear care, and darning.'],
  ['How Can I Avail Services From Cleanodry?', 'Book a pickup from the app, choose service and time, and the team handles pickup and delivery.'],
  ['Does Cleanodry Provide Pickup And Delivery Service?', 'Yes, Cleanodry offers doorstep pickup and delivery for orders.'],
  ['Which Items Can Be Cleaned By Cleanodry?', 'Suits, formal wear, casual wear, winter wear, shoes, bags, sofas, carpets, curtains, toys and more.'],
];

function WebsiteHomeSections({
  onPickupPress,
  sectionRefs,
}: {
  onPickupPress: () => void;
  sectionRefs: Record<SectionKey, (y: number) => void>;
}) {
  return (
    <>
      <View onLayout={(event) => sectionRefs.home(event.nativeEvent.layout.y)}>
        <Image
          source={require('@/assets/images/hero-mobile-banner.png')}
          style={local.heroImage}
          contentFit="cover"
          accessibilityLabel="Cleanodry premium garment care"
        />
        <View style={local.siteHeroCopy}>
          <Text style={local.sitePill}>PREMIUM CARE. PRISTINE RESULTS.</Text>
          <Text style={local.siteTitle}>
            Your Clothes{'\n'}Deserve <Text style={local.siteTitleGreen}>Better Care</Text>
          </Text>
          <Text style={local.siteSubtitle}>Premium Dry Cleaning With Free Pickup & Delivery</Text>
        </View>
        <View style={local.featureCard}>
          <View style={local.featureItem}>
            <Image source={require('@/assets/images/badge-ic-pickup.png')} style={local.featureIcon} contentFit="contain" />
            <Text style={local.featureTitle}>Free Pickup</Text>
            <Text style={local.featureSub}>At your convenience</Text>
          </View>
          <View style={local.featureDivider} />
          <View style={local.featureItem}>
            <Image source={require('@/assets/images/badge-ic-eco.png')} style={local.featureIcon} contentFit="contain" />
            <Text style={local.featureTitle}>Eco Friendly</Text>
            <Text style={local.featureSub}>Safe for the planet</Text>
          </View>
          <View style={local.featureDivider} />
          <View style={local.featureItem}>
            <Image source={require('@/assets/images/ft-ic-express.png')} style={local.featureIcon} contentFit="contain" />
            <Text style={local.featureTitle}>Express Delivery</Text>
            <Text style={local.featureSub}>On-time, everytime</Text>
          </View>
        </View>
        <View style={local.webCtaRow}>
          <Pressable style={local.pickupCta} onPress={onPickupPress}>
            <Text style={local.pickupCtaText}>SCHEDULE A PICKUP</Text>
            <View style={local.ctaCircle}>
              <Text style={local.ctaArrow}>›</Text>
            </View>
          </Pressable>
          <Pressable style={local.whatsAppCta} onPress={() => Linking.openURL('https://wa.me/917428380598')}>
            <Text style={local.whatsAppCtaText}>CHAT ON WHATSAPP</Text>
            <View style={local.whatsAppCircle}>
              <Text style={local.whatsAppIcon}>☎</Text>
            </View>
          </Pressable>
        </View>
      </View>

      <View style={local.section} onLayout={(event) => sectionRefs.about(event.nativeEvent.layout.y)}>
        <Image source={require('@/assets/images/bg-about-mobile.png')} style={local.sectionImage} contentFit="cover" />
        <Text style={local.sectionPill}>ABOUT US</Text>
        <Text style={local.sectionTitle}>
          Craftsmanship Meets <Text style={local.siteTitleGreen}>Technology</Text>
        </Text>
        <Text style={local.sectionText}>
          At Cleanodry Premium, your clothes deserve more than just a clean. With advanced cleaning technology and premium solutions, every fabric gets expert care.
        </Text>
        <Image source={require('@/assets/images/au-separator.png')} style={local.separator} contentFit="contain" />
        <Button title="Schedule a Pickup" onPress={onPickupPress} />
      </View>

      <View style={local.section} onLayout={(event) => sectionRefs.services(event.nativeEvent.layout.y)}>
        <Text style={local.sectionLabel}>Our Services</Text>
        <Text style={local.sectionTitle}>
          Premium Care For Every Fabric And <Text style={local.siteTitleGreen}>Lifestyle</Text> Essential
        </Text>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={local.horizontalCards}>
          {serviceCards.map((service) => (
            <View key={service.title} style={local.serviceCard}>
              <Image source={service.image} style={local.serviceImage} contentFit="cover" />
              <Text style={local.serviceTitle}>{service.title}</Text>
              <Text style={local.serviceText}>{service.text}</Text>
              <Text style={local.serviceLink}>Explore Service →</Text>
            </View>
          ))}
        </ScrollView>
      </View>

      <View style={local.differenceSection}>
        <Image source={require('@/assets/images/bg-wsua-mobile.png')} style={local.sectionImage} contentFit="cover" />
        <Text style={local.sectionPill}>OUR DIFFERENCE</Text>
        <Text style={local.sectionTitle}>
          What Sets <Text style={local.siteTitleGreen}>Us Apart?</Text>
        </Text>
        {['Eco-Friendly Cleaning', 'Free Pickup & Delivery', 'Advanced Stain Removal', 'Expert Fabric Care'].map((item) => (
          <View key={item} style={local.diffItem}>
            <Text style={local.diffDot}>✓</Text>
            <Text style={local.diffText}>{item}</Text>
          </View>
        ))}
      </View>

      <View style={local.section} onLayout={(event) => sectionRefs.pricing(event.nativeEvent.layout.y)}>
        <Text style={local.sectionLabel}>Pricing</Text>
        <Text style={local.sectionTitle}>
          Pricing <Text style={local.siteTitleGreen}>And Packages</Text>
        </Text>
        <View style={local.priceTable}>
          {['Shirt ₹159', 'T-Shirt ₹149', 'Pant ₹159', 'Mens Suit ₹525', 'Blanket ₹429', 'Shoes ₹499'].map((row) => {
            const [name, price] = row.split(' ₹');
            return (
              <View key={row} style={local.priceRow}>
                <Text style={local.priceName}>{name}</Text>
                <Text style={local.priceValue}>₹{price}</Text>
              </View>
            );
          })}
        </View>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={local.horizontalCards}>
          {packageCards.map((pkg) => (
            <View key={pkg.name} style={local.packageCard}>
              <Text style={local.packageName}>{pkg.name}</Text>
              <Text style={local.packagePrice}>{pkg.price}</Text>
              <Text style={local.packageDiscount}>{pkg.discount} Discount On Every Order</Text>
              <Text style={local.packageWorth}>Get services worth {pkg.worth}</Text>
            </View>
          ))}
        </ScrollView>
      </View>

      <View style={local.section} onLayout={(event) => sectionRefs.stores(event.nativeEvent.layout.y)}>
        <Text style={local.sectionLabel}>Store Locator</Text>
        <Text style={local.sectionTitle}>
          Serving Customers Across <Text style={local.siteTitleGreen}>15+ Locations</Text>
        </Text>
        <Image source={require('@/assets/images/stores-map.png')} style={local.mapImage} contentFit="contain" />
      </View>

      <View style={local.section}>
        <Image source={require('@/assets/images/bg-download-app-mobile.png')} style={local.sectionImage} contentFit="cover" />
        <Text style={local.sectionPill}>HASSLE FREE CARE</Text>
        <Text style={local.sectionTitle}>
          Trusted Care In Your <Text style={local.siteTitleGreen}>Hands</Text>
        </Text>
        <Image source={require('@/assets/images/da-features.png')} style={local.downloadFeatures} contentFit="contain" />
        <View style={local.storeBadgeRow}>
          <Image source={require('@/assets/images/da-appstore.png')} style={local.storeBadge} contentFit="contain" />
          <Image source={require('@/assets/images/da-googleplay.png')} style={local.storeBadge} contentFit="contain" />
        </View>
      </View>

      <View style={local.section} onLayout={(event) => sectionRefs.faq(event.nativeEvent.layout.y)}>
        <Text style={local.sectionLabel}>FAQ'S</Text>
        <Text style={local.sectionTitle}>
          Questions? <Text style={local.siteTitleGreen}>Look Here.</Text>
        </Text>
        {faqs.map(([question, answer], index) => (
          <View key={question} style={local.faqItem}>
            <Text style={local.faqNumber}>{String(index + 1).padStart(2, '0')}</Text>
            <View style={local.faqBody}>
              <Text style={local.faqQuestion}>{question}</Text>
              <Text style={local.faqAnswer}>{answer}</Text>
            </View>
          </View>
        ))}
      </View>
    </>
  );
}

export default function HomeScreen() {
  const auth = use(AuthContext);
  const scrollRef = useRef<ScrollView>(null);
  const sectionPositions = useRef<Partial<Record<SectionKey, number>>>({});
  const [menuOpen, setMenuOpen] = useState(false);

  function setSectionPosition(section: SectionKey, y: number) {
    sectionPositions.current[section] = y;
  }

  function scrollToSection(section: SectionKey) {
    const y = sectionPositions.current[section] ?? 0;
    scrollRef.current?.scrollTo({ y: Math.max(0, y - 4), animated: true });
  }

  if (!auth.user) {
    return <Redirect href="/login" />;
  }

  const name = `${auth.user.firstName} ${auth.user.lastName}`.trim() || 'Customer';
  return (
    <Screen ref={scrollRef}>
      <SiteHeader onMenuPress={() => setMenuOpen(true)} />
      <SideMenu
        visible={menuOpen}
        onClose={() => setMenuOpen(false)}
        onLogout={auth.signOut}
        userName={name}
        storeName={auth.user.store?.name}
        onSectionPress={scrollToSection}
      />
      <WebsiteHomeSections
        onPickupPress={() => router.push('/pickup')}
        sectionRefs={{
          home: (y) => setSectionPosition('home', y),
          about: (y) => setSectionPosition('about', y),
          services: (y) => setSectionPosition('services', y),
          pricing: (y) => setSectionPosition('pricing', y),
          stores: (y) => setSectionPosition('stores', y),
          faq: (y) => setSectionPosition('faq', y),
        }}
      />
      <View style={local.accountMini}>
        <Text style={local.accountMiniText}>Logged in as {name}</Text>
        <Text style={local.accountMiniSub}>{auth.user.store?.name ?? 'Store not linked'} · +91 {auth.user.mobile}</Text>
      </View>
    </Screen>
  );
}

const local = {
  siteTopStrip: {
    alignItems: 'center' as const,
    backgroundColor: brand.black,
    gap: 8,
    marginHorizontal: -18,
    marginTop: -18,
    paddingHorizontal: 16,
    paddingVertical: 10,
  },
  siteTopText: {
    color: brand.white,
    fontSize: 12,
    lineHeight: 16,
    textAlign: 'center' as const,
  },
  siteNav: {
    alignItems: 'center' as const,
    backgroundColor: brand.white,
    flexDirection: 'row' as const,
    justifyContent: 'space-between' as const,
    marginHorizontal: -18,
    minHeight: 56,
    paddingHorizontal: 20,
  },
  siteLogo: {
    height: 42,
    width: 118,
  },
  menuIcon: {
    gap: 5,
    padding: 8,
  },
  menuLine: {
    backgroundColor: brand.black,
    height: 2,
    width: 22,
  },
  heroImage: {
    aspectRatio: 768 / 480,
    marginHorizontal: -18,
    width: 'auto' as const,
  },
  siteHeroCopy: {
    gap: 9,
    paddingTop: 8,
  },
  sitePill: {
    alignSelf: 'flex-start' as const,
    backgroundColor: 'rgba(52, 122, 0, 0.12)',
    borderRadius: 999,
    color: brand.green,
    fontSize: 13,
    fontWeight: '800' as const,
    letterSpacing: 0.4,
    overflow: 'hidden' as const,
    paddingHorizontal: 12,
    paddingVertical: 7,
  },
  siteTitle: {
    color: '#000000',
    fontFamily: 'serif',
    fontSize: 32,
    fontWeight: '800' as const,
    lineHeight: 39,
  },
  siteTitleGreen: {
    color: brand.green,
  },
  siteSubtitle: {
    color: brand.gray,
    fontSize: 15,
    lineHeight: 22,
  },
  featureCard: {
    alignItems: 'stretch' as const,
    backgroundColor: brand.white,
    borderRadius: 10,
    boxShadow: '0 4px 18px rgba(0, 0, 0, 0.08)',
    flexDirection: 'row' as const,
    justifyContent: 'space-between' as const,
    paddingHorizontal: 12,
    paddingVertical: 10,
  },
  featureItem: {
    alignItems: 'center' as const,
    flex: 1,
    gap: 3,
  },
  featureIcon: {
    height: 28,
    width: 28,
  },
  featureTitle: {
    color: '#000000',
    fontSize: 13,
    fontWeight: '800' as const,
    textAlign: 'center' as const,
  },
  featureSub: {
    color: brand.gray,
    fontSize: 10,
    textAlign: 'center' as const,
  },
  featureDivider: {
    backgroundColor: 'rgba(52, 122, 0, 0.18)',
    marginHorizontal: 8,
    width: 1,
  },
  section: {
    gap: 14,
    paddingVertical: 18,
  },
  differenceSection: {
    gap: 12,
    paddingVertical: 18,
  },
  sectionImage: {
    aspectRatio: 390 / 270,
    borderRadius: 8,
    width: '100%' as const,
  },
  sectionPill: {
    alignSelf: 'flex-start' as const,
    backgroundColor: 'rgba(52, 122, 0, 0.12)',
    borderRadius: 999,
    color: brand.green,
    fontSize: 13,
    fontWeight: '800' as const,
    overflow: 'hidden' as const,
    paddingHorizontal: 12,
    paddingVertical: 7,
  },
  sectionLabel: {
    color: brand.green,
    fontSize: 15,
    fontWeight: '800' as const,
    textTransform: 'uppercase' as const,
  },
  sectionTitle: {
    color: '#000000',
    fontFamily: 'serif',
    fontSize: 30,
    fontWeight: '800' as const,
    lineHeight: 38,
  },
  sectionText: {
    color: brand.gray,
    fontSize: 15,
    lineHeight: 23,
  },
  separator: {
    height: 11,
    width: 219,
  },
  horizontalCards: {
    gap: 14,
    paddingRight: 18,
  },
  serviceCard: {
    backgroundColor: '#F3F3F3',
    borderRadius: 10,
    gap: 8,
    overflow: 'hidden' as const,
    paddingBottom: 14,
    width: 250,
  },
  serviceImage: {
    height: 135,
    width: '100%' as const,
  },
  serviceTitle: {
    color: '#000000',
    fontSize: 18,
    fontWeight: '800' as const,
    paddingHorizontal: 14,
  },
  serviceText: {
    color: brand.gray,
    fontSize: 13,
    lineHeight: 18,
    paddingHorizontal: 14,
  },
  serviceLink: {
    color: brand.green,
    fontSize: 13,
    fontWeight: '800' as const,
    paddingHorizontal: 14,
  },
  diffItem: {
    alignItems: 'center' as const,
    flexDirection: 'row' as const,
    gap: 10,
  },
  diffDot: {
    backgroundColor: 'rgba(52, 122, 0, 0.14)',
    borderRadius: 18,
    color: brand.green,
    fontSize: 16,
    fontWeight: '900' as const,
    overflow: 'hidden' as const,
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  diffText: {
    color: brand.black,
    flex: 1,
    fontSize: 15,
    fontWeight: '800' as const,
  },
  priceTable: {
    backgroundColor: brand.white,
    borderColor: '#E8E8E8',
    borderRadius: 10,
    borderWidth: 1,
    overflow: 'hidden' as const,
  },
  priceRow: {
    borderBottomColor: '#EFEFEF',
    borderBottomWidth: 1,
    flexDirection: 'row' as const,
    justifyContent: 'space-between' as const,
    paddingHorizontal: 14,
    paddingVertical: 12,
  },
  priceName: {
    color: brand.black,
    fontSize: 14,
    fontWeight: '700' as const,
  },
  priceValue: {
    color: brand.green,
    fontSize: 14,
    fontWeight: '900' as const,
  },
  packageCard: {
    backgroundColor: brand.white,
    borderColor: 'rgba(52, 122, 0, 0.18)',
    borderRadius: 10,
    borderWidth: 1,
    gap: 8,
    padding: 16,
    width: 210,
  },
  packageName: {
    color: brand.black,
    fontSize: 18,
    fontWeight: '900' as const,
  },
  packagePrice: {
    color: brand.green,
    fontSize: 24,
    fontWeight: '900' as const,
  },
  packageDiscount: {
    color: brand.black,
    fontSize: 13,
    fontWeight: '800' as const,
  },
  packageWorth: {
    color: brand.gray,
    fontSize: 12,
  },
  mapImage: {
    aspectRatio: 1342 / 628,
    width: '100%' as const,
  },
  downloadFeatures: {
    height: 48,
    width: '100%' as const,
  },
  storeBadgeRow: {
    flexDirection: 'row' as const,
    gap: 12,
  },
  storeBadge: {
    height: 46,
    width: 138,
  },
  faqItem: {
    backgroundColor: brand.white,
    borderColor: '#E8E8E8',
    borderRadius: 10,
    borderWidth: 1,
    flexDirection: 'row' as const,
    gap: 12,
    padding: 14,
  },
  faqNumber: {
    color: brand.green,
    fontSize: 15,
    fontWeight: '900' as const,
  },
  faqBody: {
    flex: 1,
    gap: 6,
  },
  faqQuestion: {
    color: brand.black,
    fontSize: 15,
    fontWeight: '900' as const,
    lineHeight: 20,
  },
  faqAnswer: {
    color: brand.gray,
    fontSize: 13,
    lineHeight: 19,
  },
  webCtaRow: {
    flexDirection: 'row' as const,
    gap: 12,
  },
  pickupCta: {
    alignItems: 'center' as const,
    backgroundColor: brand.green,
    borderRadius: 5,
    flex: 1,
    flexDirection: 'row' as const,
    justifyContent: 'space-between' as const,
    minHeight: 58,
    paddingHorizontal: 12,
  },
  pickupCtaText: {
    color: brand.white,
    flex: 1,
    fontSize: 13,
    fontWeight: '800' as const,
  },
  ctaCircle: {
    alignItems: 'center' as const,
    backgroundColor: brand.white,
    borderRadius: 18,
    height: 36,
    justifyContent: 'center' as const,
    width: 36,
  },
  ctaArrow: {
    color: brand.green,
    fontSize: 32,
    fontWeight: '800' as const,
    lineHeight: 32,
    marginTop: -2,
  },
  whatsAppCta: {
    alignItems: 'center' as const,
    backgroundColor: brand.white,
    borderColor: brand.green,
    borderRadius: 5,
    borderWidth: 1.5,
    flex: 1,
    flexDirection: 'row' as const,
    justifyContent: 'space-between' as const,
    minHeight: 58,
    paddingHorizontal: 12,
  },
  whatsAppCtaText: {
    color: brand.green,
    flex: 1,
    fontSize: 13,
    fontWeight: '800' as const,
  },
  whatsAppCircle: {
    alignItems: 'center' as const,
    backgroundColor: '#29A71A',
    borderRadius: 17,
    height: 34,
    justifyContent: 'center' as const,
    width: 34,
  },
  whatsAppIcon: {
    color: brand.white,
    fontSize: 18,
    fontWeight: '800' as const,
  },
  accountMini: {
    backgroundColor: '#F0F7EB',
    borderRadius: 8,
    gap: 2,
    padding: 12,
  },
  accountMiniText: {
    color: brand.black,
    fontSize: 14,
    fontWeight: '800' as const,
  },
  accountMiniSub: {
    color: brand.green,
    fontSize: 12,
    fontWeight: '700' as const,
  },
  menuOverlay: {
    bottom: -40,
    left: -18,
    position: 'absolute' as const,
    right: -18,
    top: -18,
    zIndex: 50,
  },
  menuScrim: {
    backgroundColor: 'rgba(0, 0, 0, 0.36)',
    bottom: 0,
    left: 0,
    position: 'absolute' as const,
    right: 0,
    top: 0,
  },
  menuPanel: {
    backgroundColor: brand.white,
    bottom: 0,
    boxShadow: '-4px 0 24px rgba(0, 0, 0, 0.12)',
    gap: 8,
    paddingHorizontal: 24,
    paddingTop: 28,
    position: 'absolute' as const,
    right: 0,
    top: 0,
    width: '100%' as const,
  },
  menuPanelHead: {
    alignItems: 'center' as const,
    flexDirection: 'row' as const,
    justifyContent: 'space-between' as const,
    marginBottom: 8,
  },
  menuLogo: {
    height: 50,
    width: 160,
  },
  menuClose: {
    alignItems: 'center' as const,
    height: 40,
    justifyContent: 'center' as const,
    width: 40,
  },
  menuCloseText: {
    color: brand.black,
    fontSize: 42,
    fontWeight: '400' as const,
    lineHeight: 44,
  },
  menuUserCard: {
    backgroundColor: '#F0F7EB',
    borderRadius: 8,
    gap: 3,
    marginBottom: 8,
    padding: 14,
  },
  menuUserName: {
    color: brand.black,
    fontSize: 17,
    fontWeight: '800' as const,
  },
  menuUserStore: {
    color: brand.green,
    fontSize: 13,
    fontWeight: '700' as const,
  },
  menuGuestText: {
    color: brand.gray,
    fontSize: 15,
    lineHeight: 22,
    marginBottom: 18,
  },
  menuItem: {
    borderBottomColor: '#EEEEEE',
    borderBottomWidth: 1,
    paddingVertical: 13,
  },
  menuItemText: {
    color: brand.black,
    fontSize: 14,
    fontWeight: '700' as const,
    textTransform: 'uppercase' as const,
  },
  menuLogout: {
    borderBottomWidth: 0,
    marginTop: 8,
  },
  menuLogoutText: {
    color: brand.danger,
  },
  dashboardHero: {
    gap: 10,
    paddingTop: 12,
  },
  dashboardTitle: {
    color: brand.black,
    fontSize: 28,
    fontWeight: '800' as const,
    lineHeight: 34,
  },
  accountRow: {
    alignItems: 'flex-start' as const,
    flexDirection: 'row' as const,
    gap: 12,
    justifyContent: 'space-between' as const,
  },
  accountBadge: {
    backgroundColor: '#F0F7EB',
    borderRadius: 999,
    color: brand.green,
    fontSize: 12,
    fontWeight: '800' as const,
    overflow: 'hidden' as const,
    paddingHorizontal: 10,
    paddingVertical: 6,
  },
  dashboardGrid: {
    flexDirection: 'row' as const,
    flexWrap: 'wrap' as const,
    gap: 12,
  },
  dashboardTile: {
    backgroundColor: brand.white,
    borderColor: 'rgba(52, 122, 0, 0.12)',
    borderRadius: 12,
    borderWidth: 1,
    boxShadow: '0 6px 20px rgba(0, 0, 0, 0.08)',
    flexBasis: '48%' as const,
    flexGrow: 1,
    gap: 5,
    minHeight: 138,
    padding: 14,
  },
  tileIcon: {
    height: 34,
    width: 34,
  },
  tileLogoIcon: {
    height: 34,
    width: 76,
  },
  tileTitle: {
    color: brand.black,
    fontSize: 15,
    fontWeight: '800' as const,
    lineHeight: 20,
  },
  tileSub: {
    color: brand.gray,
    fontSize: 12,
    lineHeight: 16,
  },
  actions: {
    gap: 12,
  },
  heading: {
    color: brand.black,
    fontSize: 18,
    fontWeight: '800' as const,
  },
  body: {
    color: brand.black,
    fontSize: 16,
    fontWeight: '700' as const,
  },
  muted: {
    color: brand.gray,
    fontSize: 14,
  },
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
