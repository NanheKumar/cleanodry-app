import { DarkTheme, DefaultTheme, Stack, ThemeProvider } from 'expo-router';
import { useColorScheme } from 'react-native';
import { SafeAreaProvider, initialWindowMetrics } from 'react-native-safe-area-context';

import { AuthProvider } from '@/lib/auth-context';

export default function RootLayout() {
  const colorScheme = useColorScheme();

  return (
    <ThemeProvider value={colorScheme === 'dark' ? DarkTheme : DefaultTheme}>
      <SafeAreaProvider initialMetrics={initialWindowMetrics}>
        <AuthProvider>
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
        </AuthProvider>
      </SafeAreaProvider>
    </ThemeProvider>
  );
}
