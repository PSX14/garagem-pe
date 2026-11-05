import { afterEach, expect, it, jest } from '@jest/globals';

const originalUrl = process.env.EXPO_PUBLIC_SUPABASE_URL;
const originalKey = process.env.EXPO_PUBLIC_SUPABASE_PUBLISHABLE_KEY;
jest.mock('@supabase/supabase-js', () => ({ createClient: jest.fn(() => ({ auth: {} })), processLock: jest.fn() }));

afterEach(() => {
  if (originalUrl === undefined) delete process.env.EXPO_PUBLIC_SUPABASE_URL;
  else process.env.EXPO_PUBLIC_SUPABASE_URL = originalUrl;
  if (originalKey === undefined) delete process.env.EXPO_PUBLIC_SUPABASE_PUBLISHABLE_KEY;
  else process.env.EXPO_PUBLIC_SUPABASE_PUBLISHABLE_KEY = originalKey;
  jest.resetModules();
});
it('imports without configuration and fails only when authentication is requested', () => {
  delete process.env.EXPO_PUBLIC_SUPABASE_URL;
  delete process.env.EXPO_PUBLIC_SUPABASE_PUBLISHABLE_KEY;
  // Isolate the singleton to exercise cold startup, not a previously initialized client.
  const { getSupabase, requireSupabase } = jest.requireActual<typeof import('./supabase')>('./supabase');
  expect(getSupabase()).toBeNull();
  expect(() => requireSupabase()).toThrow('não está configurado');
});
it.each(['not-a-url', 'http://example.com'])('rejects invalid configuration without crashing: %s', url => {
  process.env.EXPO_PUBLIC_SUPABASE_URL = url;
  process.env.EXPO_PUBLIC_SUPABASE_PUBLISHABLE_KEY = 'sb_publishable_test';
  const { getSupabase } = jest.requireActual<typeof import('./supabase')>('./supabase');
  expect(getSupabase()).toBeNull();
});
it('uses persistent storage and a single configured client', () => {
  process.env.EXPO_PUBLIC_SUPABASE_URL = 'https://example.supabase.co';
  process.env.EXPO_PUBLIC_SUPABASE_PUBLISHABLE_KEY = 'sb_publishable_test';
  const { getSupabase } = jest.requireActual<typeof import('./supabase')>('./supabase');
  const { createClient } = jest.requireMock<typeof import('@supabase/supabase-js')>('@supabase/supabase-js');
  expect(getSupabase()).not.toBeNull();
  expect(getSupabase()).toBe(getSupabase());
  expect(createClient).toHaveBeenCalledTimes(1);
  expect(createClient).toHaveBeenCalledWith('https://example.supabase.co', 'sb_publishable_test', expect.objectContaining({ auth: expect.objectContaining({ persistSession: true, detectSessionInUrl: false, storage: expect.objectContaining({ getItem: expect.any(Function) }) }) }));
});
