import React from 'react';
import { afterEach, expect, it, jest } from '@jest/globals';
import { Alert } from 'react-native';
import { act, fireEvent, render } from '@testing-library/react-native';
import { CadastroScreen } from './CadastroScreen';

afterEach(() => { jest.restoreAllMocks(); });

it('reports required fields', () => {
	const alert = jest.spyOn(Alert, 'alert').mockImplementation(() => undefined);
	const screen = render(<CadastroScreen onBack={jest.fn()} />);

	fireEvent.press(screen.getByTestId('create-account-submit'));
	expect(screen.getByText('Informe seu nome.')).toBeTruthy();
	expect(screen.getByText('Informe um e-mail válido.')).toBeTruthy();
	expect(screen.getByText('Informe um telefone com DDD.')).toBeTruthy();
	expect(screen.getByText('A senha deve ter pelo menos 8 caracteres.')).toBeTruthy();
	expect(screen.getByText('Confirme sua senha.')).toBeTruthy();
	expect(alert).not.toHaveBeenCalled();
	expect(alert).not.toHaveBeenCalled();
});

it('toggles both password fields and starts account registration', async () => {
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
	expect(alert).toHaveBeenCalledTimes(1);
	expect(alert).toHaveBeenCalledWith('Cadastro iniciado!', expect.any(String), expect.any(Array));
	expect(alert.mock.calls[0]?.[1]).toContain('confirmação por e-mail');
});

it('returns to the login screen when requested', () => {
	const onBack = jest.fn();
	const screen = render(<CadastroScreen onBack={onBack} />);
	fireEvent.press(screen.getByLabelText('Voltar para login'));
	expect(onBack).toHaveBeenCalledTimes(1);
});

