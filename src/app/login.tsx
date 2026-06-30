import { Redirect, router } from 'expo-router';
import { Image } from 'expo-image';
import { use } from 'react';
import { View } from 'react-native';

import { AppFooter, LoadingScreen } from '@/components/app-shell';
import { Screen, brand } from '@/components/cleanodry-ui';
import { LoginCard } from '@/components/login-card';
import { AuthContext } from '@/lib/auth-context';

export default function LoginScreen() {
  const auth = use(AuthContext);

  if (auth.loading) {
    return <LoadingScreen />;
  }

  if (auth.user) {
    return <Redirect href="/" />;
  }

  return (
    <Screen contentContainerStyle={local.screenContent}>
      <View style={local.header}>
        <Image
          source={require('@/assets/images/logo-color.png')}
          style={local.logo}
          contentFit="contain"
          tintColor={brand.white}
          accessibilityLabel="Cleanodry"
        />
        <View style={local.headerBadge}>
          <Image
            source={require('@/assets/images/badge-ic-eco.png')}
            style={local.badgeIcon}
            contentFit="contain"
            accessibilityLabel="Eco care"
          />
        </View>
      </View>
      <LoginCard onLoggedIn={() => router.replace('/')} />
      <AppFooter />
    </Screen>
  );
}

const local = {
  screenContent: {
    backgroundColor: '#F4FAF1',
    flexGrow: 1,
    gap: 18,
    justifyContent: 'flex-start' as const,
    maxWidth: 520,
    paddingBottom: 28,
    paddingHorizontal: 16,
    paddingTop: 14,
  },
  header: {
    alignItems: 'center' as const,
    backgroundColor: brand.green,
    borderRadius: 22,
    boxShadow: '0 12px 28px rgba(52, 122, 0, 0.20)',
    flexDirection: 'row' as const,
    justifyContent: 'space-between' as const,
    paddingHorizontal: 18,
    paddingVertical: 15,
  },
  logo: {
    height: 54,
    width: 172,
  },
  headerBadge: {
    alignItems: 'center' as const,
    backgroundColor: 'rgba(255, 255, 255, 0.16)',
    borderColor: 'rgba(255, 255, 255, 0.24)',
    borderRadius: 15,
    borderWidth: 1,
    height: 46,
    justifyContent: 'center' as const,
    width: 46,
  },
  badgeIcon: {
    height: 27,
    width: 27,
  },
};
