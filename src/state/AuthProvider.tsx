import React, { createContext, useContext, useEffect, useState } from 'react';
import { AppState } from 'react-native';
import type { Session } from '@supabase/supabase-js';
import { getSupabase } from '../lib/supabase';

type AuthValue = { session: Session | null; signOut: () => Promise<void> };
const Context = createContext<AuthValue>({ session: null, signOut: async () => undefined });

export function AuthProvider({ children }: React.PropsWithChildren) {
  const [session, setSession] = useState<Session | null>(null);
  useEffect(() => {
    const client = getSupabase();
    if (!client) return;
    let active = true;
    let changed = false;
    const { data: { subscription } } = client.auth.onAuthStateChange((_event, next) => {
      changed = true;
      if (active) setSession(next);
    });
    void client.auth.getSession().then(({ data, error }) => {
      if (active && !changed) setSession(error ? null : data.session);
    }).catch(() => { if (active && !changed) setSession(null); });
    const refresh = (state: string | null | undefined) => {
      if (state === 'active') void client.auth.startAutoRefresh();
      else void client.auth.stopAutoRefresh();
    };
    refresh(AppState.currentState);
    const listener = AppState.addEventListener('change', refresh);
    return () => { active = false; subscription.unsubscribe(); listener.remove(); void client.auth.stopAutoRefresh(); };
  }, []);
  const signOut = async () => {
    const client = getSupabase();
    if (client) {
      const { error } = await client.auth.signOut({ scope: 'local' });
      if (error) throw new Error('Não foi possível sair da conta. Tente novamente.');
    }
    setSession(null);
  };
  return <Context.Provider value={{ session, signOut }}>{children}</Context.Provider>;
}

export const useAuth = () => useContext(Context);
