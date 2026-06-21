import { Redirect, router } from 'expo-router';
import { use } from 'react';
import { Text, View } from 'react-native';

import { Hero, Screen, brand } from '@/components/cleanodry-ui';
import { LoginCard } from '@/components/login-card';
import { AuthContext } from '@/lib/auth-context';

export default function LoginScreen() {
  const auth = use(AuthContext);

  if (auth.user) {
    return <Redirect href="/" />;
  }

  return (
    <Screen>
      <Hero
        eyebrow="Premium care"
        title="Login to Cleanodry"
        subtitle="Enter your mobile number to book pickups and track orders."
      />
      <LoginCard onLoggedIn={() => router.replace('/')} />
      <View style={local.noteBox}>
        <Text style={local.noteTitle}>Cleanodry Premium</Text>
        <Text style={local.noteText}>Free pickup, expert cleaning, and on-time doorstep delivery.</Text>
      </View>
    </Screen>
  );
}

const local = {
  noteBox: {
    backgroundColor: '#F0F7EB',
    borderColor: 'rgba(52, 122, 0, 0.16)',
    borderRadius: 8,
    borderWidth: 1,
    gap: 4,
    padding: 14,
  },
  noteTitle: {
    color: brand.green,
    fontSize: 15,
    fontWeight: '900' as const,
  },
  noteText: {
    color: brand.gray,
    fontSize: 13,
    lineHeight: 19,
  },
};
