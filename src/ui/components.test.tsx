import React from 'react';
import { afterEach, expect, jest, test } from '@jest/globals';
import { Alert } from 'react-native';
import { act, fireEvent, render } from '@testing-library/react-native';
import { Button } from './components';

afterEach(() => { jest.restoreAllMocks(); });

test('rapid taps submit once while pending and permit another action after completion', async () => {
  let finish: (() => void) | undefined;
  const pending = new Promise<void>(resolve => { finish = resolve; });
  const confirm = jest.fn<() => Promise<void>>().mockReturnValue(pending);
  const screen = render(<Button title="Confirmar reserva" onPress={confirm} />);
  const button = screen.getByLabelText('Confirmar reserva');

  await act(async () => { fireEvent.press(button); fireEvent.press(button); });
  expect(confirm).toHaveBeenCalledTimes(1);
  expect(screen.getByRole('button', { name: 'Confirmar reserva', disabled: true })).toBeTruthy();
  fireEvent.press(screen.getByLabelText('Confirmar reserva'));
  expect(confirm).toHaveBeenCalledTimes(1);

  await act(async () => { finish?.(); });
  expect(screen.getByRole('button', { name: 'Confirmar reserva', disabled: false })).toBeTruthy();
  await act(async () => { fireEvent.press(screen.getByLabelText('Confirmar reserva')); });
  expect(confirm).toHaveBeenCalledTimes(2);
});

test('a failed action reports its error, releases the button and allows a single retry', async () => {
  let fail: ((reason: Error) => void) | undefined;
  const pending = new Promise<void>((_resolve, reject) => { fail = reject; });
  const save = jest.fn<() => Promise<void>>().mockReturnValueOnce(pending).mockResolvedValue(undefined);
  const alert = jest.spyOn(Alert, 'alert').mockImplementation(() => undefined);
  const screen = render(<Button title="Salvar alterações" onPress={save} />);
  const button = screen.getByLabelText('Salvar alterações');

  await act(async () => { fireEvent.press(button); fireEvent.press(button); });
  expect(save).toHaveBeenCalledTimes(1);
  await act(async () => { fail?.(new Error('Não foi possível gravar no aparelho.')); });
  expect(alert).toHaveBeenCalledTimes(1);
  expect(alert).toHaveBeenCalledWith('Não foi possível continuar', 'Não foi possível gravar no aparelho.');
  expect(screen.getByRole('button', { name: 'Salvar alterações', disabled: false })).toBeTruthy();

  const retry = screen.getByLabelText('Salvar alterações');
  await act(async () => { fireEvent.press(retry); fireEvent.press(retry); });
  expect(save).toHaveBeenCalledTimes(2);
  expect(alert).toHaveBeenCalledTimes(1);
});
