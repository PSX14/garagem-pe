import React from 'react';
import { beforeEach, expect, it, jest } from '@jest/globals';
import { Alert } from 'react-native';
import { act, fireEvent, render } from '@testing-library/react-native';
import { LoginScreen } from './LoginScrenn';
import { requireSupabase } from '../lib/supabase';

jest.mock('../lib/supabase', () => ({ requireSupabase: jest.fn() }));
const signIn = jest.fn<(...args: unknown[]) => Promise<unknown>>();
beforeEach(() => {
  jest.restoreAllMocks(); signIn.mockReset();
  jest.spyOn(Alert, 'alert').mockImplementation(() => undefined);
  jest.mocked(requireSupabase).mockReturnValue({ auth: { signInWithPassword: signIn } } as unknown as ReturnType<typeof requireSupabase>);
  signIn.mockResolvedValue({ data: { session: { user: { id: 'test' } } }, error: null });
});
const setup = () => {
  const onLogin = jest.fn<() => Promise<void>>().mockResolvedValue(undefined);
  const onCreateAccount = jest.fn();
  const screen = render(<LoginScreen onBack={jest.fn()} onLogin={onLogin} onCreateAccount={onCreateAccount} />);
  const fill = (password = 'senha-de-teste') => {
    fireEvent.changeText(screen.getByLabelText('E-mail'), ' Pessoa@Exemplo.com ');
    fireEvent.changeText(screen.getByLabelText('Senha'), password);
  };
  const submit = async () => { await act(async () => { fireEvent.press(screen.getByTestId('login-submit')); }); };
  return { screen, onLogin, onCreateAccount, fill, submit };
};
it('rejects missing fields and whitespace-only passwords without a request', async () => {
  const { screen, fill, submit, onLogin } = setup();
  await submit();
  expect(screen.getByText('Informe um e-mail válido.')).toBeTruthy();
  expect(screen.getByText('Informe sua senha.')).toBeTruthy();
  fill('   '); await submit();
  expect(signIn).not.toHaveBeenCalled(); expect(onLogin).not.toHaveBeenCalled();
});
it('normalizes email, preserves password and enters only after receiving a session', async () => {
  const { screen, fill, submit, onLogin } = setup(); fill(' senha válida ');
  fireEvent.press(screen.getByLabelText('Mostrar senha'));
  expect(screen.getByLabelText('Senha').props.secureTextEntry).toBe(false);
  await submit();
  expect(signIn).toHaveBeenCalledWith({ email: 'pessoa@exemplo.com', password: ' senha válida ' });
  expect(onLogin).toHaveBeenCalledTimes(1);
});
it.each([
  { data: { session: null }, error: { message: 'Invalid credentials' } },
  { data: { session: null }, error: null },
])('does not enter without an authenticated session', async response => {
  signIn.mockResolvedValue(response);
  const { fill, submit, onLogin } = setup(); fill(); await submit();
  expect(onLogin).not.toHaveBeenCalled();
  expect(Alert.alert).toHaveBeenCalledWith('Não foi possível entrar', expect.any(String));
});
it('recovers from a network failure and allows retry', async () => {
  signIn.mockRejectedValueOnce(new Error('Network failed'));
  const { fill, submit, onLogin } = setup(); fill(); await submit();
  expect(onLogin).not.toHaveBeenCalled();
  expect(Alert.alert).toHaveBeenCalledWith('Erro de conexão', expect.any(String));
  await submit(); expect(onLogin).toHaveBeenCalledTimes(1);
});
it('shows a configuration message instead of crashing', async () => {
  jest.mocked(requireSupabase).mockImplementation(() => { throw new Error('O acesso à conta ainda não está configurado.'); });
  const { fill, submit, onLogin } = setup(); fill(); await submit();
  expect(onLogin).not.toHaveBeenCalled();
  expect(Alert.alert).toHaveBeenCalledWith('Erro de conexão', expect.stringContaining('não está configurado'));
});
it('opens signup and explains the recovery limitation', () => {
  const { screen, onCreateAccount } = setup();
  fireEvent.press(screen.getByText('Criar uma conta'));
  expect(onCreateAccount).toHaveBeenCalledTimes(1);
  fireEvent.press(screen.getByText('Esqueci minha senha'));
  expect(Alert.alert).toHaveBeenCalledWith('Recuperação indisponível', expect.any(String));
});
