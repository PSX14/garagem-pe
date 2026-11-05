import 'react-native-url-polyfill/auto';

import { createClient, processLock, SupabaseClient } from '@supabase/supabase-js';
import { authStorage } from '../state/persistence';

let client: SupabaseClient | null = null;

// Expo replaces these expressions when bundling. Missing setup must not crash startup.
export function getSupabase(): SupabaseClient | null {
  if (client) return client;
  const url = process.env.EXPO_PUBLIC_SUPABASE_URL?.trim();
  const key = process.env.EXPO_PUBLIC_SUPABASE_PUBLISHABLE_KEY?.trim();
  if (!url || !key) return null;
  try {
    const parsed = new URL(url);
    if (parsed.protocol !== 'https:' || parsed.username || parsed.password) return null;
    if (key.startsWith('sb_secret_')) return null;
    client = createClient(url, key, {
      auth: { storage: authStorage, autoRefreshToken: true, persistSession: true, detectSessionInUrl: false, lock: processLock },
    });
    return client;
  } catch {
    return null;
  }
}

export function requireSupabase(): SupabaseClient {
  const configured = getSupabase();
  if (!configured) throw new Error('O acesso à conta ainda não está configurado. Você pode voltar e usar o modo demonstração.');
  return configured;
}
