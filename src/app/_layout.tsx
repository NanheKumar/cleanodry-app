import { DarkTheme, DefaultTheme, Stack, ThemeProvider } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { type PropsWithChildren, use, useEffect } from 'react';
import { useColorScheme } from 'react-native';
import { SafeAreaProvider, initialWindowMetrics } from 'react-native-safe-area-context';

import { AuthContext, AuthProvider } from '@/lib/auth-context';

void SplashScreen.preventAutoHideAsync();

function SplashGate({ children }: PropsWithChildren) {
  const auth = use(AuthContext);

  useEffect(() => {
    if (!auth.loading) {
      void SplashScreen.hideAsync();
    }
  }, [auth.loading]);

  return children;
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
