import { Redirect, router } from 'expo-router';
import { Image } from 'expo-image';
import { use } from 'react';
import { Text, View, useWindowDimensions } from 'react-native';

import { LoadingScreen } from '@/components/app-shell';
import { Screen, brand } from '@/components/cleanodry-ui';
import { LoginCard } from '@/components/login-card';
import { AuthContext } from '@/lib/auth-context';

export default function LoginScreen() {
  const auth = use(AuthContext);
  const { height } = useWindowDimensions();
  const compact = height < 820;

  if (auth.loading) {
    return <LoadingScreen />;
  }

  if (auth.user) {
    return <Redirect href="/" />;
  }

  return (
    <Screen contentContainerStyle={[local.screenContent, compact ? local.screenContentCompact : null]}>
      <View style={[local.brandPanel, compact ? local.brandPanelCompact : null]}>
        <View style={local.topRow}>
          <View style={local.logoPill}>
            <Image
              source={require('@/assets/images/logo-color.png')}
              style={local.logo}
              contentFit="contain"
              accessibilityLabel="Cleanodry"
            />
          </View>
          <View style={local.supportChip}>
            <Text style={local.supportText}>10 AM - 8 PM</Text>
          </View>
        </View>

        <View style={[local.visualCard, compact ? local.visualCardCompact : null]}>
          <Image
            source={require('@/assets/images/hero-mobile-banner.png')}
            style={local.visualImage}
            contentFit="cover"
            accessibilityLabel="Premium garment care"
          />
          <View style={local.visualBadge}>
            <Text style={local.visualBadgeText}>Premium Dry Cleaning</Text>
          </View>
        </View>

        <View style={local.heroCopy}>
          <Text style={local.kicker}>Doorstep garment care</Text>
          <Text style={[local.title, compact ? local.titleCompact : null]}>Fresh clothes, picked up from your door.</Text>
          <Text style={[local.subtitle, compact ? local.subtitleCompact : null]}>
            Login to schedule pickups, track orders, and manage your Cleanodry service.
          </Text>
        </View>
      </View>

      <LoginCard onLoggedIn={() => router.replace('/')} />
      <Text style={local.footerText}>Premium Support: +91-7428380598</Text>
    </Screen>
  );
}

const local = {
  screenContent: {
    backgroundColor: '#F4FAF1',
    flexGrow: 1,
    gap: 10,
    justifyContent: 'center' as const,
    maxWidth: 460,
    paddingBottom: 10,
    paddingHorizontal: 18,
    paddingTop: 10,
  },
  screenContentCompact: {
    gap: 10,
    paddingBottom: 10,
    paddingHorizontal: 16,
    paddingTop: 10,
  },
  brandPanel: {
    backgroundColor: '#EAF5E5',
    borderColor: 'rgba(52, 122, 0, 0.10)',
    borderRadius: 22,
    borderWidth: 1,
    gap: 10,
    overflow: 'hidden' as const,
    padding: 12,
  },
  brandPanelCompact: {
    gap: 10,
    padding: 12,
  },
  topRow: {
    alignItems: 'center' as const,
    flexDirection: 'row' as const,
    justifyContent: 'space-between' as const,
  },
  logoPill: {
    alignItems: 'center' as const,
    backgroundColor: brand.white,
    borderRadius: 16,
    boxShadow: '0 8px 24px rgba(52, 122, 0, 0.10)',
    height: 46,
    justifyContent: 'center' as const,
    paddingHorizontal: 12,
  },
  logo: {
    height: 30,
    width: 108,
  },
  supportChip: {
    backgroundColor: 'rgba(52, 122, 0, 0.12)',
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 7,
  },
  supportText: {
    color: brand.green,
    fontSize: 12,
    fontWeight: '900' as const,
  },
  visualCard: {
    aspectRatio: 16 / 5.2,
    backgroundColor: brand.white,
    borderRadius: 18,
    boxShadow: '0 10px 26px rgba(31, 56, 20, 0.14)',
    maxHeight: 96,
    overflow: 'hidden' as const,
  },
  visualCardCompact: {
    aspectRatio: 16 / 4.8,
    maxHeight: 84,
  },
  visualImage: {
    height: '100%' as const,
    width: '100%' as const,
  },
  visualBadge: {
    backgroundColor: 'rgba(255, 255, 255, 0.92)',
    borderRadius: 999,
    bottom: 8,
    left: 8,
    paddingHorizontal: 10,
    paddingVertical: 6,
    position: 'absolute' as const,
  },
  visualBadgeText: {
    color: brand.green,
    fontSize: 12,
    fontWeight: '900' as const,
  },
  heroCopy: {
    gap: 5,
  },
  kicker: {
    color: brand.green,
    fontSize: 12,
    fontWeight: '900' as const,
    letterSpacing: 0.6,
    textTransform: 'uppercase' as const,
  },
  title: {
    color: '#111B0D',
    fontSize: 23,
    fontWeight: '900' as const,
    letterSpacing: 0,
    lineHeight: 28,
  },
  titleCompact: {
    fontSize: 21,
    lineHeight: 25,
  },
  subtitle: {
    color: '#53624B',
    fontSize: 14,
    lineHeight: 21,
  },
  subtitleCompact: {
    fontSize: 13,
    lineHeight: 18,
  },
  footerText: {
    color: brand.gray,
    fontSize: 12,
    fontWeight: '700' as const,
    paddingBottom: 8,
    textAlign: 'center' as const,
  },
};
