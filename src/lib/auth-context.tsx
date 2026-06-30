import { createContext, type PropsWithChildren, useCallback, useEffect, useMemo, useState } from 'react';
import * as SecureStore from 'expo-secure-store';
import { Platform } from 'react-native';

import type { SessionUser } from '@/lib/api';

type AuthContextValue = {
  user: SessionUser | null;
  loading: boolean;
  isLoggedIn: boolean;
  signIn: (user: SessionUser) => void;
  signOut: () => void;
};

const AUTH_STORAGE_KEY = 'cleanodry.session';

export const AuthContext = createContext<AuthContextValue>({
  user: null,
  loading: true,
  isLoggedIn: false,
  signIn: () => undefined,
  signOut: () => undefined,
});

async function readStoredUser() {
  if (Platform.OS !== 'web') {
    const raw = await SecureStore.getItemAsync(AUTH_STORAGE_KEY);
    return raw ? (JSON.parse(raw) as SessionUser) : null;
  }

  if (typeof localStorage === 'undefined') {
    return null;
  }

  try {
    const raw = localStorage.getItem(AUTH_STORAGE_KEY);
    if (!raw) {
      return null;
    }
    return JSON.parse(raw) as SessionUser;
  } catch {
    localStorage.removeItem(AUTH_STORAGE_KEY);
    return null;
  }
}

async function writeStoredUser(user: SessionUser | null) {
  if (Platform.OS !== 'web') {
    if (!user) {
      await SecureStore.deleteItemAsync(AUTH_STORAGE_KEY);
      return;
    }
    await SecureStore.setItemAsync(AUTH_STORAGE_KEY, JSON.stringify(user));
    return;
  }

  if (typeof localStorage === 'undefined') {
    return;
  }

  if (!user) {
    localStorage.removeItem(AUTH_STORAGE_KEY);
    return;
  }

  localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(user));
}

export function AuthProvider({ children }: PropsWithChildren) {
  const [user, setUser] = useState<SessionUser | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let mounted = true;
    readStoredUser()
      .then((storedUser) => {
        if (mounted) {
          setUser(storedUser);
        }
      })
      .catch(() => {
        if (mounted) {
          setUser(null);
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

  const signIn = useCallback((nextUser: SessionUser) => {
    setUser(nextUser);
    void writeStoredUser(nextUser);
  }, []);

  const signOut = useCallback(() => {
    setUser(null);
    void writeStoredUser(null);
  }, []);

  const value = useMemo(
    () => ({
      user,
      loading,
      isLoggedIn: user !== null,
      signIn,
      signOut,
    }),
    [loading, signIn, signOut, user],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
