import { createContext, type PropsWithChildren, useCallback, useEffect, useMemo, useState } from 'react';

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

function readStoredUser() {
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

function writeStoredUser(user: SessionUser | null) {
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
    setUser(readStoredUser());
    setLoading(false);
  }, []);

  const signIn = useCallback((nextUser: SessionUser) => {
    setUser(nextUser);
    writeStoredUser(nextUser);
  }, []);

  const signOut = useCallback(() => {
    setUser(null);
    writeStoredUser(null);
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
