import { createContext, type PropsWithChildren, useCallback, useMemo, useState } from 'react';

import type { SessionUser } from '@/lib/api';

type AuthContextValue = {
  user: SessionUser | null;
  isLoggedIn: boolean;
  signIn: (user: SessionUser) => void;
  signOut: () => void;
};

export const AuthContext = createContext<AuthContextValue>({
  user: null,
  isLoggedIn: false,
  signIn: () => undefined,
  signOut: () => undefined,
});

export function AuthProvider({ children }: PropsWithChildren) {
  const [user, setUser] = useState<SessionUser | null>(null);

  const signIn = useCallback((nextUser: SessionUser) => {
    setUser(nextUser);
  }, []);

  const signOut = useCallback(() => {
    setUser(null);
  }, []);

  const value = useMemo(
    () => ({
      user,
      isLoggedIn: user !== null,
      signIn,
      signOut,
    }),
    [signIn, signOut, user],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
