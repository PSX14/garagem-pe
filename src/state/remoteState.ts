import type { AppState } from '../domain/types';
import { supabase } from '../lib/supabase';
import { isAppState } from './persistence';

const STATE_SCHEMA_VERSION = 2;
type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[];

/**
 * The device remains the immediate source of truth, so the app works after a
 * restart and when temporarily offline. Signed-in users additionally get a
 * private, RLS-protected copy tied to their Supabase account.
 */
export async function loadRemoteState(): Promise<AppState | null> {
  const { data: userResult, error: userError } = await supabase.auth.getUser();
  if (userError || !userResult.user) return null;

  const { data, error } = await supabase
    .from('app_states')
    .select('payload')
    .eq('user_id', userResult.user.id)
    .maybeSingle();

  if (error) throw new Error(`Não foi possível sincronizar seus dados: ${error.message}`);
  return isAppState(data?.payload) ? data.payload : null;
}

export async function saveRemoteState(state: AppState): Promise<boolean> {
  const { data: userResult, error: userError } = await supabase.auth.getUser();
  if (userError || !userResult.user) return false;

  const { error } = await supabase.from('app_states').upsert(
    {
      user_id: userResult.user.id,
      schema_version: STATE_SCHEMA_VERSION,
      payload: state as unknown as Json,
      updated_at: new Date().toISOString(),
    },
    { onConflict: 'user_id' },
  );
  if (error) throw new Error(`Não foi possível salvar a cópia remota: ${error.message}`);
  return true;
}
