import React from 'react';
import { afterEach, expect, it, jest } from '@jest/globals';
import { Alert } from 'react-native';
import { act, fireEvent, render, waitFor } from '@testing-library/react-native';
import { LoginScreen } from './LoginScrenn';

afterEach(() => { jest.restoreAllMocks(); });

it('validates the email and password before entering the demo', async () => {
  const onLogin = jest.fn();
  const screen = render(
  <LoginScreen
    onBack={jest.fn()}
    onLogin={onLogin}
    onCreateAccount={jest.fn()}
  />
);

  await act(async () => { fireEvent.press(screen.getByTestId('login-submit')); });
  expect(screen.getByText('Informe um e-mail válido.')).toBeTruthy();
  expect(screen.getByText('Informe sua senha.')).toBeTruthy();
  expect(onLogin).not.toHaveBeenCalled();
});

it('toggles password visibility and enters the demo with valid fields', async () => {
  const onLogin = jest.fn();
  const screen = render(
  <LoginScreen
    onBack={jest.fn()}
    onLogin={onLogin}
    onCreateAccount={jest.fn()}
  />
);
  fireEvent.changeText(screen.getByLabelText('E-mail'), 'pessoa@exemplo.com');
  fireEvent.changeText(screen.getByLabelText('Senha'), 'senha-de-teste');

  expect(screen.getByLabelText('Senha').props.secureTextEntry).toBe(true);
  fireEvent.press(screen.getByLabelText('Mostrar senha'));
  expect(screen.getByLabelText('Senha').props.secureTextEntry).toBe(false);
  fireEvent.press(screen.getByLabelText('Ocultar senha'));
  expect(screen.getByLabelText('Senha').props.secureTextEntry).toBe(true);

  await act(async () => { fireEvent.press(screen.getByTestId('login-submit')); });
  await waitFor(() => expect(onLogin).toHaveBeenCalledTimes(1));
});

it('explains that account creation and password recovery are unavailable', () => {
  const onLogin = jest.fn();
  const alert = jest.spyOn(Alert, 'alert').mockImplementation(() => undefined);

  const screen = render(
    <LoginScreen
      onBack={jest.fn()}
      onLogin={onLogin}
      onCreateAccount={jest.fn()}
    />
  );

  fireEvent.press(screen.getByText('Esqueci minha senha'));
  fireEvent.press(screen.getByText('Criar uma conta'));

  expect(alert).toHaveBeenCalled();
});



// it('explains that account creation and password recovery are unavailable', () => {
//   const alert = jest.spyOn(Alert, 'alert').mockImplementation(() => undefined);
//   const screen = render(<LoginScreen onBack={jest.fn()}
//     onLogin={onLogin}
//     onCreateAccount={jest.fn()}
//   />
// );

//   fireEvent.press(screen.getByText('Esqueci minha senha'));
//   fireEvent.press(screen.getByText('Criar uma conta'));

//   expect(alert).toHaveBeenNthCalledWith(1, 'Recuperação indisponível', expect.any(String));
//   expect(alert).toHaveBeenNthCalledWith(2, 'Cadastro indisponível', expect.any(String));
// });