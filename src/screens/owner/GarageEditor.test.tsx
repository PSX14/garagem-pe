Warning: truncated output (original token count: 2312)
Total output lines: 155

import React from 'react';
import { afterEach, beforeEach, expect, jest, test } from '@jest/globals';
import { Alert } from 'react-native';
import { act, fireEvent, render, waitFor } from '@testing-library/react-native';
import { createInitialState } from '../../domain/model';
import { useReadyApp } from '../../state/AppProvider';
import { pickGaragePhotos, removeGaragePhotos } from '../../services/photos';
import { GarageEditor } from './GarageEditor';

jest.mock('../../state/AppProvider', () => ({ useReadyApp: jest.fn() }));
jest.mock('../../services/photos', () => ({ pickGaragePhotos: jest.fn<() => Promise<string[]>>().mockResolvedValue([]), removeGaragePhotos: jest.fn<() => Promise<void>>().mockResolvedValue(undefined) }));
jest.mock('@react-native-community/datetimepicker', () => 'DateTimePicker');

const app = jest.mocked(useReadyApp);
const state = { ...createInitialState(new Date('2026-09-09T12:00:00Z')), role: 'owner' as const };
const dispatch = jest.fn<ReturnType<typeof useReadyApp>['dispatch']>();

beforeEach(() => {
  jest.clearAllMocks();
  dispatch.mockReset();
  app.mockReturnValue({ state, dispatch, loading: false, error: null, reload: jest.fn(), restore: jest.fn<() => Promise<void>>() });
});
afterEach(() => { jest.restoreAllMocks(); });

async function advance(screen: ReturnType<typeof render>, times = 1) {
  for (let index = 0; index < times; index += 1) act(() => { fireEvent.press(screen.getByTestId('garage-next-step')); });
}

test('an incomplete listing cannot advance past the first step', async () => {
  const screen = render(<GarageEditor onBack={jest.fn()} />);
  await advance(screen);
  expect(await screen.findByText('Informe um título com pelo menos 3 caracteres.')).toBeTruthy();
  expect(screen.getByText('Etapa 1 de 4')).toBeTruthy();
  expect(dispatch).not.toHaveBeenCalled();
});

test('edited garage is not announced as saved until local persistence resolves', async () => {
  let resolveSave: (() => void) | undefined;
  dispatch.mockIm…1312 tokens truncated…garage');
  await act(async () => { fireEvent.press(save); fireEvent.press(save); });
  expect(dispatch).toHaveBeenCalledTimes(1);
  await act(async () => { resolveSave?.(); });
  expect(await screen.findByTestId('garage-saved')).toBeTruthy();
});

test('abandoning a changed draft requires confirmation and preserves previously saved photos', async () => {
  const original = 'file:///app/documents/garagem-pe-photos/original.jpg';
  const added = 'file:///app/documents/garagem-pe-photos/draft.jpg';
  app.mockReturnValue({ state: { ...state, garages: state.garages.map(garage => garage.id === 'boa-viagem' ? { ...garage, photos: [original] } : garage) }, dispatch, loading: false, error: null, reload: jest.fn(), restore: jest.fn<() => Promise<void>>() });
  jest.mocked(pickGaragePhotos).mockResolvedValueOnce([added]);
  const alert = jest.spyOn(Alert, 'alert').mockImplementation(() => undefined);
  const onBack = jest.fn();
  const screen = render(<GarageEditor garageId="boa-viagem" onBack={onBack} />);
  fireEvent.changeText(screen.getByTestId('garage-name'), 'Rascunho preservado');
  await advance(screen, 2);
  fireEvent.press(screen.getByTestId('garage-pick-photos'));
  expect(await screen.findByLabelText('Foto 2 da vaga')).toBeTruthy();
  for (let index = 0; index < 3; index += 1) await act(async () => { fireEvent.press(screen.getByLabelText('Voltar')); });
  expect(alert).toHaveBeenLastCalledWith('Descartar alterações?', expect.any(String), expect.any(Array));
  expect(onBack).not.toHaveBeenCalled();
  expect(screen.getByTestId('garage-name').props.value).toBe('Rascunho preservado');
  alert.mock.calls.at(-1)?.[2]?.find(button => button.text === 'Descartar')?.onPress?.();
  expect(onBack).toHaveBeenCalledTimes(1);
  screen.unmount();
  await waitFor(() => expect(removeGaragePhotos).toHaveBeenCalledWith([added]));
  for (const [uris] of jest.mocked(removeGaragePhotos).mock.calls) expect(uris).not.toContain(original);
  expect(dispatch).not.toHaveBeenCalled();
});

