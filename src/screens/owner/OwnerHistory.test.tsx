import React from 'react';
import { beforeEach, expect, jest, test } from '@jest/globals';
import { act, fireEvent, render } from '@testing-library/react-native';
import { createInitialState, money } from '../../domain/model';
import { useReadyApp } from '../../state/AppProvider';
import { EarningsScreen } from './EarningsScreen';
import { OwnerBookings } from './OwnerBookings';
import { OwnerGarages } from './OwnerGarages';
import { monthKey, monthLabel } from './ownerAnalytics';

jest.mock('../../state/AppProvider', () => ({ useReadyApp: jest.fn() }));

const previousYear = new Date();
previousYear.setFullYear(previousYear.getFullYear() - 1);
const state = { ...createInitialState(previousYear), role: 'owner' as const };

beforeEach(() => {
  jest.mocked(useReadyApp).mockReturnValue({ state, dispatch: jest.fn<() => Promise<void>>(), loading: false, error: null, reload: jest.fn(), restore: jest.fn<() => Promise<void>>() });
});

test('owner reservation status filters really change the visible bookings and empty state', async () => {
  const onBooking = jest.fn();
  const screen = render(<OwnerBookings onBooking={onBooking} />);
  await act(async () => undefined);
  const completed = state.bookings.find(booking => booking.status === 'completed')!;
  const upcoming = state.bookings.find(booking => booking.garageId === 'boa-viagem' && booking.status === 'confirmed')!;
  expect(screen.getByText(upcoming.code)).toBeTruthy();
  expect(screen.queryByText(completed.code)).toBeNull();
  fireEvent.press(screen.getByText('Concluída (1)'));
  expect(screen.getByText(completed.code)).toBeTruthy();
  expect(screen.queryByText(upcoming.code)).toBeNull();
  fireEvent.press(screen.getByLabelText(new RegExp(`Reserva ${completed.code}`)));
  expect(onBooking).toHaveBeenCalledWith(completed.id);
  fireEvent.press(screen.getByText('Cancelada (0)'));
  expect(screen.getByText('Sua agenda, organizada')).toBeTruthy();
});

test('selecting an older earnings month updates the chart period and open/completed values', async () => {
  const screen = render(<EarningsScreen />);
  await act(async () => undefined);
  const completed = state.bookings.find(booking => booking.status === 'completed')!;
  const month = monthKey(completed.startAt);
  fireEvent.press(screen.getByText(monthLabel(month)));
  const label = `${monthLabel(month)}: líquido de ${money(completed.net)}. Selecionar mês.`;
  expect(screen.getByLabelText(label)).toBeTruthy();
  fireEvent.press(screen.getByText('Previstos'));
  expect(screen.queryByText(completed.code)).toBeNull();
  expect(screen.queryByLabelText(label)).toBeNull();
});

test('rapid activation taps cannot enqueue two toggles and end with the listing paused again', async () => {
  let resolveSave: (() => void) | undefined;
  const dispatch = jest.fn<() => Promise<void>>().mockImplementation(() => new Promise(resolve => { resolveSave = resolve; }));
  jest.mocked(useReadyApp).mockReturnValue({ state: { ...state, garages: state.garages.map(garage => ({ ...garage, active: false })) }, dispatch, loading: false, error: null, reload: jest.fn(), restore: jest.fn<() => Promise<void>>() });
  const screen = render(<OwnerGarages onEdit={jest.fn()} />);
  await act(async () => undefined);
  const activate = screen.getByLabelText('Ativar anúncio');
  await act(async () => { fireEvent.press(activate); fireEvent.press(activate); });
  expect(dispatch).toHaveBeenCalledTimes(1);
  await act(async () => { resolveSave?.(); });
});
