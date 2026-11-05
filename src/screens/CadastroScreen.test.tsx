import React from 'react';
import { afterEach, beforeEach, expect, it, jest } from '@jest/globals';
import { Alert } from 'react-native';
import { act, fireEvent, render } from '@testing-library/react-native';
import { requireSupabase } from '../lib/supabase';
import { CadastroScreen } from './CadastroScreen';

jest.mock('../lib/supabase', () => ({ requireSupabase: jest.fn() }));
const signUp = jest.fn<(...args: unknown[]) => Promise<unknown>>();
beforeEach(() => {
  signUp.mockReset().mockResolvedValue({ data: { session: null }, error: null });
  jest.mocked(requireSupabase).mockReturnValue({ auth: { signUp } } as unknown as ReturnType<typeof requireSupabase>);
});
afterEach(() => { jest.restoreAllMocks(); });

it('reports required fields and rejects invalid email, phone and mismatched passwords', async () => {
	const alert = jest.spyOn(Alert, 'alert').mockImplementation(() => undefined);
	const screen = render(<CadastroScreen onBack={jest.fn()} />);

	await act(async () => { fireEvent.press(screen.getByTestId('create-account-submit')); });
	expect(screen.getByText('Informe seu nome.')).toBeTruthy();
	expect(screen.getByText('Informe um e-mail válido.')).toBeTruthy();
	expect(screen.getByText('Informe um telefone com DDD.')).toBeTruthy();
	expect(screen.getByText('A senha deve ter pelo menos 8 caracteres.')).toBeTruthy();
	expect(screen.getByText('Confirme sua senha.')).toBeTruthy();
	expect(alert).not.toHaveBeenCalled();
	expect(signUp).not.toHaveBeenCalled();

	fireEvent.changeText(screen.getByLabelText('Nome'), 'Maria da Silva');
	fireEvent.changeText(screen.getByLabelText('E-mail'), 'maria@exemplo.com');
	fireEvent.changeText(screen.getByLabelText('Telefone'), '(81) 99999-1234');
	fireEvent.changeText(screen.getByLabelText('Senha'), 'senha-segura');
	fireEvent.changeText(screen.getByLabelText('Confirmar senha'), 'senha-diferente');
	await act(async () => { fireEvent.press(screen.getByTestId('create-account-submit')); });
	expect(screen.getByText('As senhas não coincidem.')).toBeTruthy();
	expect(alert).not.toHaveBeenCalled();
});

it('toggles both password fields and submits registration and requests email confirmation', async () => {
	const alert = jest.spyOn(Alert, 'alert').mockImplementation(() => undefined);
	const screen = render(<CadastroScreen onBack={jest.fn()} />);
	fireEvent.changeText(screen.getByLabelText('Nome'), 'Maria da Silva');
	fireEvent.changeText(screen.getByLabelText('E-mail'), 'maria@exemplo.com');
	fireEvent.changeText(screen.getByLabelText('Telefone'), '81999991234');
	fireEvent.changeText(screen.getByLabelText('Senha'), 'senha-segura');
	fireEvent.changeText(screen.getByLabelText('Confirmar senha'), 'senha-segura');

	fireEvent.press(screen.getByLabelText('Mostrar senha'));
	expect(screen.getByLabelText('Senha').props.secureTextEntry).toBe(false);
	fireEvent.press(screen.getByLabelText('Mostrar confirmar senha'));
	expect(screen.getByLabelText('Confirmar senha').props.secureTextEntry).toBe(false);

	await act(async () => { fireEvent.press(screen.getByTestId('create-account-submit')); });
	expect(signUp).toHaveBeenCalledWith({ email: 'maria@exemplo.com', password: 'senha-segura', options: { data: { full_name: 'Maria da Silva', phone: '81999991234' } } });
	expect(alert).toHaveBeenCalledTimes(1);
	expect(alert).toHaveBeenCalledWith('Confira seu e-mail', expect.any(String), expect.any(Array));
	expect(alert.mock.calls[0]?.[1]).not.toContain('maria@exemplo.com');
});

it('returns to the login screen when requested', () => {
	const onBack = jest.fn();
	const screen = render(<CadastroScreen onBack={onBack} />);
	fireEvent.press(screen.getByLabelText('Voltar para login'));
	expect(onBack).toHaveBeenCalledTimes(1);
});

function filledRegistration() {
  const onRegistered = jest.fn<() => Promise<void>>().mockResolvedValue(undefined);
  const screen = render(<CadastroScreen onBack={jest.fn()} onRegistered={onRegistered} />);
  fireEvent.changeText(screen.getByLabelText('Nome'), ' Maria da Silva ');
  fireEvent.changeText(screen.getByLabelText('E-mail'), ' Maria@Exemplo.com ');
  fireEvent.changeText(screen.getByLabelText('Telefone'), '(81) 99999-1234');
  fireEvent.changeText(screen.getByLabelText('Senha'), 'senha-segura');
  fireEvent.changeText(screen.getByLabelText('Confirmar senha'), 'senha-segura');
  const submit = async () => { await act(async () => { fireEvent.press(screen.getByTestId('create-account-submit')); }); };
  return { screen, onRegistered, submit };
}

it('enters only when signup returns a session and clears password fields', async () => {
  signUp.mockResolvedValue({ data: { session: { user: { id: 'test' } } }, error: null });
  const { screen, onRegistered, submit } = filledRegistration();
  await submit();
  expect(onRegistered).toHaveBeenCalledTimes(1);
  expect(screen.getByLabelText('Senha').props.value).toBe('');
  expect(screen.getByLabelText('Confirmar senha').props.value).toBe('');
});

it('does not enter on a service error and allows retry after a network failure', async () => {
  const alert = jest.spyOn(Alert, 'alert').mockImplementation(() => undefined);
  signUp.mockResolvedValueOnce({ data: { session: null }, error: { message: 'Rejected' } });
  const { onRegistered, submit } = filledRegistration();
  await submit();
  expect(onRegistered).not.toHaveBeenCalled();
  expect(alert).toHaveBeenCalledWith('Não foi possível cadastrar', expect.any(String));
  signUp.mockRejectedValueOnce(new Error('Network unavailable'));
  await submit();
  expect(onRegistered).not.toHaveBeenCalled();
  await submit();
  expect(signUp).toHaveBeenCalledTimes(3);
  expect(alert).toHaveBeenLastCalledWith('Confira seu e-mail', expect.any(String), expect.any(Array));
});

it('rejects whitespace-only passwords before contacting Supabase', async () => {
  const { screen, submit } = filledRegistration();
  fireEvent.changeText(screen.getByLabelText('Senha'), '        ');
  fireEvent.changeText(screen.getByLabelText('Confirmar senha'), '        ');
  await submit();
  expect(signUp).not.toHaveBeenCalled();
  expect(screen.getByText('A senha deve ter pelo menos 8 caracteres.')).toBeTruthy();
});
