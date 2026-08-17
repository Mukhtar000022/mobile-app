import React, { createContext, useCallback, useContext, useEffect, useState } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { apiLogin, AuthUser } from '../api';

const TOKEN_KEY = 'ayala_token';
const USER_KEY = 'ayala_user';

type LoginOutcome = { ok: true } | { ok: false; error: string };

type AuthValue = {
  user: AuthUser | null;
  token: string | null;
  loading: boolean;
  login: (phone: string, password: string) => Promise<LoginOutcome>;
  logout: () => void;
};

const AuthContext = createContext<AuthValue>({
  user: null,
  token: null,
  loading: true,
  login: async () => ({ ok: false, error: 'network' }),
  logout: () => {},
});

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  // Восстанавливаем сессию при запуске.
  useEffect(() => {
    (async () => {
      try {
        const [tok, usr] = await Promise.all([
          AsyncStorage.getItem(TOKEN_KEY),
          AsyncStorage.getItem(USER_KEY),
        ]);
        if (tok && usr) {
          setToken(tok);
          setUser(JSON.parse(usr));
        }
      } catch (e) {
        /* игнорируем */
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const login = useCallback(
    async (phone: string, password: string): Promise<LoginOutcome> => {
      const res = await apiLogin(phone, password);
      if (!res.ok) return { ok: false, error: res.error };
      setToken(res.token);
      setUser(res.user);
      await AsyncStorage.multiSet([
        [TOKEN_KEY, res.token],
        [USER_KEY, JSON.stringify(res.user)],
      ]);
      return { ok: true };
    },
    [],
  );

  const logout = useCallback(() => {
    setToken(null);
    setUser(null);
    AsyncStorage.multiRemove([TOKEN_KEY, USER_KEY]).catch(() => {});
  }, []);

  return (
    <AuthContext.Provider value={{ user, token, loading, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}
