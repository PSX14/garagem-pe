import React, { useEffect } from 'react';
import { Pressable, Text } from 'react-native';
import { act, fireEvent, render, screen, waitFor } from '@testing-library/react-native';
import { beforeEach, describe, expect, it, jest } from '@jest/globals';
import { createInitialState } from '../domain/model';
import { AppProvider, useApp } from './AppProvider';
import { loadState, persistState } from './persistence';

jest.mock('./persistence', () => ({ loadState: jest.fn(), persistState: jest.fn() }));
const mockedLoad = jest.mocked(loadState);
const mockedPersist = jest.mocked(persistState);
let app: ReturnType<typeof useApp>;
function Observer() {
  const value = useApp();
  useEffect(() => { app = value; }, [value]);
  return <><Text testID="role">{value.state?.role ?? 'loading'}</Text><Text testID="name">{value.state?.ownerProfile.name}</Text><Text testID="error">{value.error ?? ''}</Text><Pressable accessibilityLabel="Recarregar" onPress={value.reload} /></>;
}
async function setup() {
  render(<AppProvider><Observer /></AppProvider>);
  await waitFor(() => expect(screen.getByTestId('role')).toHaveTextContent('driver'));
}
beforeEach(() => {
  jest.clearAllMocks();
  mockedLoad.mockResolvedValue(createInitialState());
  mockedPersist.mockResolvedValue(undefined);
});
describe('Transações do estado local', () => {
  it('não confirma a mudança na interface quando a gravação falha', async () => {
    await setup();
    mockedPersist.mockRejectedValueOnce(new Error('Armazenamento cheio'));
    await act(async () => { await expect(app.dispatch({ type: 'role', role: 'owner' })).rejects.toThrow('Armazenamento cheio'); });
    expect(screen.getByTestId('role')).toHaveTextContent('driver');
    await act(async () => { await app.dispatch({ type: 'role', role: 'owner' }); });
    expect(screen.getByTestId('role')).toHaveTextContent('owner');
  });
  it('serializa gravações concorrentes e aplica a segunda ação sobre o estado confirmado', async () => {
    await setup();
    let release: () => void = () => undefined;
    mockedPersist.mockImplementationOnce(() => new Promise<void>(resolve => { release = resolve; }));
    let first: Promise<void>; let second: Promise<void>;
    await act(async () => {
      first = app.dispatch({ type: 'role', role: 'owner' });
      second = app.dispatch({ type: 'profile', profile: { name: 'Anfitrião de teste', email: '', phone: '', plate: '', vehicle: '' } });
      await Promise.resolve();
    });
    expect(mockedPersist).toHaveBeenCalledTimes(1);
    expect(screen.getByTestId('role')).toHaveTextContent('driver');
    await act(async () => { release(); await first; await second; });
    expect(mockedPersist).toHaveBeenCalledTimes(2);
    expect(screen.getByTestId('name')).toHaveTextContent('Anfitrião de teste');
  });
  it('permite tentar novamente após falha de leitura', async () => {
    mockedLoad.mockRejectedValueOnce(new Error('Falha de leitura'));
    render(<AppProvider><Observer /></AppProvider>);
    await waitFor(() => expect(screen.getByTestId('error')).toHaveTextContent('Falha de leitura'));
    fireEvent.press(screen.getByLabelText('Recarregar'));
    await waitFor(() => expect(screen.getByTestId('role')).toHaveTextContent('driver'));
    expect(screen.getByTestId('error')).toHaveTextContent('');
  });
});
