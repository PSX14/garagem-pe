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
  for (let index = 0; index < times; index += 1) await act(async () => { fireEvent.press(screen.getByTestId('garage-next-step')); });
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
  dispatch.mockImplementation(() => new Promise<void>(resolve => { resolveSave = resolve; }));
  const screen = render(<GarageEditor garageId="boa-viagem" onBack={jest.fn()} />);
  await advance(screen, 2);
  fireEvent.changeText(screen.getByTestId('garage-price'), '1525');
  await advance(screen);
  fireEvent.press(screen.getByTestId('save-garage'));
  await waitFor(() => expect(dispatch).toHaveBeenCalledWith(expect.objectContaining({ type: 'saveGarage', id: 'boa-viagem', input: expect.objectContaining({ pricePerHour: 1525, authorized: true }) })));
  expect(screen.queryByTestId('garage-saved')).toBeNull();
  await act(async () => { resolveSave?.(); });
  expect(await screen.findByTestId('garage-saved')).toBeTruthy();
});

test('failed persistence keeps the editor and entered data available to retry', async () => {
  dispatch.mockRejectedValue(new Error('Sem espaço no aparelho.'));
  const screen = render(<GarageEditor garageId="boa-viagem" onBack={jest.fn()} />);
  fireEvent.changeText(screen.getByTestId('garage-name'), 'Meu espaço atualizado');
  await advance(screen, 3);
  fireEvent.press(screen.getByTestId('save-garage'));
  expect(await screen.findByText('Sem espaço no aparelho.')).toBeTruthy();
  expect(screen.queryByTestId('garage-saved')).toBeNull();
  expect(screen.getByText('Meu espaço atualizado')).toBeTruthy();
});

test('unmount while saving does not remove a newly selected photo that is being committed', async () => {
  const photo = 'file:///app/documents/garagem-pe-photos/new-photo.jpg';
  jest.mocked(pickGaragePhotos).mockResolvedValueOnce([photo]);
  let resolveSave: (() => void) | undefined;
  dispatch.mockImplementation(() => new Promise<void>(resolve => { resolveSave = resolve; }));
  const screen = render(<GarageEditor garageId="boa-viagem" onBack={jest.fn()} />);
  await advance(screen, 2);
  fireEvent.press(screen.getByTestId('garage-pick-photos'));
  expect(await screen.findByLabelText('Foto 1 da vaga')).toBeTruthy();
  await advance(screen);
  fireEvent.press(screen.getByTestId('save-garage'));
  await waitFor(() => expect(dispatch).toHaveBeenCalled());
  screen.unmount();
  expect(removeGaragePhotos).not.toHaveBeenCalled();
  await act(async () => { resolveSave?.(); });
  for (const [uris] of jest.mocked(removeGaragePhotos).mock.calls) expect(uris).not.toContain(photo);
});

test('unmount after a failed pending save cleans up the draft photo', async () => {
  const photo = 'file:///app/documents/garagem-pe-photos/unsaved-photo.jpg';
  jest.mocked(pickGaragePhotos).mockResolvedValueOnce([photo]);
  let rejectSave: ((reason: Error) => void) | undefined;
  dispatch.mockImplementation(() => new Promise<void>((_resolve, reject) => { rejectSave = reject; }));
  const screen = render(<GarageEditor garageId="boa-viagem" onBack={jest.fn()} />);
  await advance(screen, 2);
  fireEvent.press(screen.getByTestId('garage-pick-photos'));
  expect(await screen.findByLabelText('Foto 1 da vaga')).toBeTruthy();
  await advance(screen);
  fireEvent.press(screen.getByTestId('save-garage'));
  await waitFor(() => expect(dispatch).toHaveBeenCalled());
  screen.unmount();
  await act(async () => { rejectSave?.(new Error('Sem espaço')); });
  expect(removeGaragePhotos).toHaveBeenCalledWith([photo]);
});

test('all four steps preserve data and require the authorization declaration at publication', async () => {
  dispatch.mockResolvedValue(undefined);
  const screen = render(<GarageEditor garageId="boa-viagem" onBack={jest.fn()} />);
  fireEvent.changeText(screen.getByTestId('garage-name'), 'Título que atravessa as etapas');
  await advance(screen, 3);
  expect(screen.getByText('Etapa 4 de 4')).toBeTruthy();
  fireEvent.press(screen.getByLabelText('Declaro que sou responsável pela vaga e possuo autorização para disponibilizá-la.'));
  fireEvent.press(screen.getByTestId('save-garage'));
  expect(await screen.findByText('Confirme sua responsabilidade e autorização para publicar.')).toBeTruthy();
  expect(dispatch).not.toHaveBeenCalled();
  fireEvent.press(screen.getByLabelText('Declaro que sou responsável pela vaga e possuo autorização para disponibilizá-la.'));
  fireEvent.press(screen.getByTestId('save-garage'));
  expect(await screen.findByTestId('garage-saved')).toBeTruthy();
  expect(dispatch).toHaveBeenCalledWith(expect.objectContaining({ input: expect.objectContaining({ name: 'Título que atravessa as etapas', authorized: true }) }));
});

test('rapid repeated taps start only one save and one photo selection', async () => {
  let resolvePicker: ((uris: string[]) => void) | undefined;
  jest.mocked(pickGaragePhotos).mockImplementationOnce(() => new Promise(resolve => { resolvePicker = resolve; }));
  let resolveSave: (() => void) | undefined;
  dispatch.mockImplementation(() => new Promise(resolve => { resolveSave = resolve; }));
  const screen = render(<GarageEditor garageId="boa-viagem" onBack={jest.fn()} />);
  await advance(screen, 2);
  const picker = screen.getByTestId('garage-pick-photos');
  await act(async () => { fireEvent.press(picker); fireEvent.press(picker); });
  expect(pickGaragePhotos).toHaveBeenCalledTimes(1);
  await act(async () => { resolvePicker?.([]); });
  await advance(screen);
  const save = screen.getByTestId('save-garage');
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
