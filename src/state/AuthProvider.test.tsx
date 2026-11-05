import React from 'react';
import { beforeEach, expect, it, jest } from '@jest/globals';
import { AppState, Button, Text } from 'react-native';
import { act, fireEvent, render, waitFor } from '@testing-library/react-native';
import { AuthProvider, useAuth } from './AuthProvider';
import { getSupabase } from '../lib/supabase';

jest.mock('../lib/supabase', () => ({ getSupabase: jest.fn() }));
const session = { user: { id: 'test-user', email: 'teste@example.com' } };
let notify: (event: string, value: typeof session | null) => void;
const signOut = jest.fn<(options: { scope: string }) => Promise<{ error: Error | null }>>();
const unsubscribe = jest.fn();
const start = jest.fn<() => Promise<void>>().mockResolvedValue(undefined);
const stop = jest.fn<() => Promise<void>>().mockResolvedValue(undefined);
const remove = jest.fn();
const getSession = jest.fn<() => Promise<unknown>>();
beforeEach(() => {
  jest.restoreAllMocks();
  getSession.mockReset().mockResolvedValue({ data: { session }, error: null });
  signOut.mockReset().mockResolvedValue({ error: null });
  jest.spyOn(AppState, 'addEventListener').mockReturnValue({ remove });
  jest.mocked(getSupabase).mockReturnValue({ auth: {
    getSession, signOut, startAutoRefresh: start, stopAutoRefresh: stop,
    onAuthStateChange: (listener: typeof notify) => { notify = listener; return { data: { subscription: { unsubscribe } } }; },
  } } as unknown as ReturnType<typeof getSupabase>);
});
function Observer() {
  const auth = useAuth();
  return <><Text>{auth.session?.user.email ?? 'Demonstração'}</Text><Button title="Sair" onPress={() => { void auth.signOut(); }} /></>;
}
it('restores an existing session, reacts to changes and signs out locally', async () => {
  const screen = render(<AuthProvider><Observer /></AuthProvider>);
  await waitFor(() => expect(screen.getByText('teste@example.com')).toBeTruthy());
  await act(async () => { fireEvent.press(screen.getByText('Sair')); });
  expect(signOut).toHaveBeenCalledWith({ scope: 'local' });
  expect(screen.getByText('Demonstração')).toBeTruthy();
  act(() => notify('SIGNED_IN', session));
  expect(screen.getByText('teste@example.com')).toBeTruthy();
  screen.unmount(); expect(unsubscribe).toHaveBeenCalled(); expect(remove).toHaveBeenCalled();
});
it('keeps the app available when Supabase is not configured', () => {
  jest.mocked(getSupabase).mockReturnValue(null);
  const screen = render(<AuthProvider><Observer /></AuthProvider>);
  expect(screen.getByText('Demonstração')).toBeTruthy();
  expect(getSession).not.toHaveBeenCalled();
});
it('does not overwrite a newer auth event with a stale cached session', async () => {
  let finish!: (value: unknown) => void;
  getSession.mockImplementation(() => new Promise(resolve => { finish = resolve; }));
  const screen = render(<AuthProvider><Observer /></AuthProvider>);
  act(() => notify('SIGNED_OUT', null));
  await act(async () => finish({ data: { session }, error: null }));
  expect(screen.getByText('Demonstração')).toBeTruthy();
});
