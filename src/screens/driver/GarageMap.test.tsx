import React from 'react';
import { afterEach, beforeAll, beforeEach, expect, it, jest } from '@jest/globals';
import { act, fireEvent, render } from '@testing-library/react-native';
import { Feather } from '@expo/vector-icons';
import { createInitialState, money } from '../../domain/model';
import { GarageMap } from './GarageMap';

jest.mock('react-native-maps', () => ({ __esModule: true, default: 'NativeGarageMap', Marker: 'NativeGarageMarker' }));
const originalMapMode = process.env.EXPO_PUBLIC_MAP_MODE;
beforeAll(async () => { await Feather.loadFont(); });
beforeEach(() => { jest.useFakeTimers(); delete process.env.EXPO_PUBLIC_MAP_MODE; });
afterEach(() => { jest.useRealTimers(); if (originalMapMode === undefined) delete process.env.EXPO_PUBLIC_MAP_MODE; else process.env.EXPO_PUBLIC_MAP_MODE = originalMapMode; });

it('uses local markers immediately without native maps, timers or online retry in local builds', () => {
  process.env.EXPO_PUBLIC_MAP_MODE = 'local';
  const state = createInitialState(); const garage = state.garages[0]!; const open = jest.fn();
  const screen = render(<GarageMap garages={[garage]} location={state.preferences.location} billingMode="day" onGarage={open} />);
  expect(screen.getByTestId('offline-garage-map')).toBeTruthy();
  expect(screen.queryByTestId('native-garage-map')).toBeNull();
  expect(screen.queryByLabelText('Tentar mapa online')).toBeNull();
  expect(jest.getTimerCount()).toBe(0);
  fireEvent.press(screen.getByLabelText(`Abrir ${garage.name}, ${money(garage.pricePerDay!)}`));
  expect(open).toHaveBeenCalledWith(garage.id);
  screen.rerender(<GarageMap garages={[]} location={state.preferences.location} billingMode="day" onGarage={open} />);
  expect(screen.getByText('Nenhuma vaga nos filtros atuais.')).toBeTruthy();
  expect(screen.queryByLabelText(`Abrir ${garage.name}, ${money(garage.pricePerDay!)}`)).toBeNull();
  expect(screen.queryByTestId('native-garage-map')).toBeNull();
  expect(jest.getTimerCount()).toBe(0);
});

it('replaces an unrendered native map with working local price markers after the timeout', async () => {
  const state = createInitialState(); const open = jest.fn(); const garage = state.garages[0]!;
  const screen = render(<GarageMap garages={[garage]} location={state.preferences.location} billingMode="hour" onGarage={open} />);
  expect(screen.getByTestId('native-garage-map')).toBeTruthy();
  act(() => { jest.advanceTimersByTime(12000); });
  expect(screen.queryByTestId('native-garage-map')).toBeNull();
  expect(screen.getByTestId('offline-garage-map')).toBeTruthy();
  fireEvent.press(screen.getByLabelText(`Abrir ${garage.name}, ${money(garage.pricePerHour)}`));
  expect(open).toHaveBeenCalledWith(garage.id);
  await act(async () => { fireEvent.press(screen.getByLabelText('Tentar mapa online')); });
  expect(screen.getByTestId('native-garage-map')).toBeTruthy();
  expect(screen.queryByTestId('offline-garage-map')).toBeNull();
});

it('keeps the actual map once its tiles have finished loading', () => {
  const state = createInitialState();
  const screen = render(<GarageMap garages={state.garages} location={state.preferences.location} billingMode="hour" onGarage={jest.fn()} />);
  fireEvent(screen.getByTestId('native-garage-map'), 'mapLoaded');
  act(() => { jest.advanceTimersByTime(12000); });
  expect(screen.getByTestId('native-garage-map')).toBeTruthy();
  expect(screen.queryByTestId('offline-garage-map')).toBeNull();
});

it('applies filters to the local fallback without exposing a residential address', () => {
  const state = createInitialState(); const garage = state.garages[0]!;
  const screen = render(<GarageMap garages={[garage]} location={state.preferences.location} billingMode="day" onGarage={jest.fn()} />);
  act(() => { jest.advanceTimersByTime(12000); });
  expect(screen.getByLabelText(`Abrir ${garage.name}, ${money(garage.pricePerDay!)}`)).toBeTruthy();
  expect(screen.queryByText(garage.address)).toBeNull();
  screen.rerender(<GarageMap garages={[]} location={state.preferences.location} billingMode="day" onGarage={jest.fn()} />);
  expect(screen.getByText('Nenhuma vaga nos filtros atuais.')).toBeTruthy();
  expect(screen.queryByLabelText(`Abrir ${garage.name}, ${money(garage.pricePerDay!)}`)).toBeNull();
});
