import { DarkTheme, DefaultTheme, Stack, ThemeProvider } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { type PropsWithChildren, use, useEffect, useRef, useState } from 'react';
import { Animated, useColorScheme, View } from 'react-native';
import { SafeAreaProvider, initialWindowMetrics } from 'react-native-safe-area-context';

import { LogoLoader, appBackground } from '@/components/app-shell';
import { AuthContext, AuthProvider } from '@/lib/auth-context';

void SplashScreen.preventAutoHideAsync();
SplashScreen.setOptions({
  duration: 450,
  fade: true,
});

const SPLASH_MIN_DURATION_MS = 2200;
const SPLASH_EXIT_DURATION_MS = 360;

function SplashGate({ children }: PropsWithChildren) {
  const auth = use(AuthContext);
  const mountedAt = useRef(Date.now()).current;
  const opacity = useRef(new Animated.Value(0)).current;
  const scale = useRef(new Animated.Value(0.94)).current;
  const [showSplash, setShowSplash] = useState(true);

  useEffect(() => {
    Animated.parallel([
      Animated.timing(opacity, {
        duration: 520,
        toValue: 1,
        useNativeDriver: true,
      }),
      Animated.spring(scale, {
        damping: 16,
        mass: 0.8,
        stiffness: 120,
        toValue: 1,
        useNativeDriver: true,
      }),
    ]).start();
  }, [opacity, scale]);

  useEffect(() => {
    if (auth.loading) {
      return;
    }

    void SplashScreen.hideAsync();

    const elapsed = Date.now() - mountedAt;
    const remaining = Math.max(0, SPLASH_MIN_DURATION_MS - elapsed);
    const timer = setTimeout(() => {
      Animated.timing(opacity, {
        duration: SPLASH_EXIT_DURATION_MS,
        toValue: 0,
        useNativeDriver: true,
      }).start(({ finished }) => {
        if (finished) {
          setShowSplash(false);
        }
      });
    }, remaining);

    return () => {
      clearTimeout(timer);
    };
  }, [auth.loading, mountedAt, opacity]);

  return (
    <View style={styles.root}>
      {children}
      {showSplash ? (
        <Animated.View
          pointerEvents="auto"
          style={[
            styles.animatedSplash,
            {
              opacity,
              transform: [{ scale }],
            },
          ]}>
          <LogoLoader />
        </Animated.View>
      ) : null}
    </View>
  );
}

export default function RootLayout() {
  const colorScheme = useColorScheme();

  return (
    <ThemeProvider value={colorScheme === 'dark' ? DarkTheme : DefaultTheme}>
      <SafeAreaProvider initialMetrics={initialWindowMetrics}>
        <AuthProvider>
          <SplashGate>
            <Stack
              screenOptions={{
                headerShown: false,
                headerTintColor: '#347A00',
                headerTitleStyle: { fontWeight: '700' },
                contentStyle: { backgroundColor: '#FFFFFF' },
              }}>
              <Stack.Screen name="index" />
              <Stack.Screen name="login" />
              <Stack.Screen name="register" />
              <Stack.Screen name="pickup" />
              <Stack.Screen name="orders" />
              <Stack.Screen name="pickups" />
              <Stack.Screen name="profile" />
            </Stack>
          </SplashGate>
        </AuthProvider>
      </SafeAreaProvider>
    </ThemeProvider>
  );
}

const styles = {
  root: {
    backgroundColor: appBackground,
    flex: 1,
  },
  animatedSplash: {
    alignItems: 'center' as const,
    backgroundColor: appBackground,
    bottom: 0,
    justifyContent: 'center' as const,
    left: 0,
    position: 'absolute' as const,
    right: 0,
    top: 0,
    zIndex: 999,
  },
};
