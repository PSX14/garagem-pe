import React from 'react';
import { beforeAll, beforeEach, expect, it, jest } from '@jest/globals';
import { fireEvent, render, waitFor } from '@testing-library/react-native';
import { Feather } from '@expo/vector-icons';
import { createInitialState, money, transition } from '../../domain/model';
import type { Action } from '../../domain/types';
import { useReadyApp } from '../../state/AppProvider';
import { GarageDetail } from './GarageDetail';
import { BookingForm, BookingSummary } from './BookingForm';
import { BookingCard, BookingDetail, BookingsScreen } from './Bookings';
import { fromRecifePickerDate, toRecifePickerDate } from './dateTime';
import { ExploreScreen, GarageCard } from './ExploreScreen';
import { GarageMap } from './GarageMap';

jest.mock('../../state/AppProvider', () => ({ useReadyApp: jest.fn() }));
jest.mock('@react-native-community/datetimepicker', () => 'DateTimePicker');
jest.mock('./GarageMap', () => ({ GarageMap: jest.fn(() => null) }));

const mockUseApp = jest.mocked(useReadyApp);
const now = new Date('2026-09-09T15:00:00.000Z');
let state = createInitialState(now);
const dispatch = jest.fn<(action: Action) => Promise<void>>().mockResolvedValue(undefined);
beforeAll(async () => { await Feather.loadFont(); });
beforeEach(() => {
  state = createInitialState(now); dispatch.mockClear(); jest.mocked(GarageMap).mockClear();
  mockUseApp.mockImplementation(() => ({ state, dispatch, loading: false, error: null, reload: jest.fn(), restore: async () => undefined }));
});

it('shows only the approximate address before reservation', () => {
  const garage = state.garages[0]!;
  const screen = render(<GarageDetail garageId={garage.id} onBack={jest.fn()} onReserve={jest.fn()} />);
  expect(screen.getByText(`${garage.neighborhood} · ${garage.approximateAddress}`)).toBeTruthy();
  expect(screen.queryByText(garage.address)).toBeNull();
  expect(screen.queryByText(garage.accessInstructions)).toBeNull();
  expect(screen.getByLabelText('Reservar vaga')).toBeTruthy();
});

it('opens a garage card and shows its price, neighborhood and approximate distance', () => {
  const garage = state.garages[0]!; const open = jest.fn();
  const screen = render(<GarageCard garage={garage} distance={1.2} onPress={open} />);
  fireEvent.press(screen.getByLabelText(`Detalhes de ${garage.name}, ${garage.neighborhood}, ${money(garage.pricePerHour)} por hora`));
  expect(open).toHaveBeenCalledTimes(1);
  expect(screen.getByText('Boa Viagem · 1,2 km')).toBeTruthy();
  expect(screen.queryByText(garage.address)).toBeNull();
});

it('formats a recalculated rating with one decimal without changing the stored score', () => {
  const garage = state.garages[0]!; garage.rating = 4.903;
  const screen = render(<GarageCard garage={garage} distance={1.2} onPress={jest.fn()} />);
  expect(screen.getByText('4,9')).toBeTruthy();
  expect(screen.queryByText('4,903')).toBeNull();
  expect(garage.rating).toBe(4.903);
});

it('applies the same search and price filters to the offline list and the map markers', async () => {
  state.preferences.view = 'map';
  const screen = render(<ExploreScreen onGarage={jest.fn()} />);
  fireEvent.changeText(screen.getByLabelText('Para onde você vai?'), 'UFPE');
  expect(screen.getByText('Quintal Universitário')).toBeTruthy();
  expect(screen.queryByText('Garagem Boa Viagem')).toBeNull();
  expect(jest.mocked(GarageMap).mock.lastCall?.[0].garages.map(garage => garage.id)).toEqual(['varzea']);
  fireEvent.press(screen.getByText('Filtros'));
  fireEvent.changeText(screen.getByLabelText('Preço máximo por hora (R$)'), '5');
  fireEvent.press(screen.getByLabelText('Aplicar filtros'));
  await waitFor(() => expect(screen.getByText('Nenhuma vaga encontrada')).toBeTruthy());
  expect(jest.mocked(GarageMap).mock.lastCall?.[0].garages).toEqual([]);
  expect(dispatch).toHaveBeenLastCalledWith({ type: 'filters', filters: { ...state.filters, query: 'UFPE', maxPrice: 500 } });
});

it('lets an owner preview a listing without offering an unauthorized booking action', () => {
  state.role = 'owner';
  const screen = render(<GarageDetail garageId={state.garages[0]!.id} onBack={jest.fn()} onReserve={jest.fn()} />);
  expect(screen.queryByLabelText('Reservar vaga')).toBeNull();
  expect(screen.getByText(/Você está no modo Proprietário/)).toBeTruthy();
});

it('shows embedded commission and net adding up to the advertised total', () => {
  const garage = state.garages[0]!;
  const screen = render(<BookingSummary garage={garage} hours={2} billingMode="hour" />);
  expect(screen.getByText(money(2400))).toBeTruthy();
  expect(screen.getByText(money(360))).toBeTruthy();
  expect(screen.getByText(money(2040))).toBeTruthy();
  expect(screen.queryByText(/Grátis/)).toBeNull();
});

it('submits selected saved vehicle, dates, billing and a simulated payment', async () => {
  const booked = jest.fn(); const garage = state.garages[0]!;
  const screen = render(<BookingForm garageId={garage.id} onBack={jest.fn()} onBooked={booked} />);
  fireEvent.press(screen.getByText('Cartão simulado'));
  fireEvent.press(screen.getByTestId('confirm-booking'));
  await waitFor(() => expect(dispatch).toHaveBeenCalledWith(expect.objectContaining({ type: 'book', input: expect.objectContaining({ garageId: garage.id, vehicle: state.vehicles[0]!.label, plate: state.vehicles[0]!.plate, paymentMethod: 'card', billingMode: 'hour', hours: 2 }) })));
  expect(booked).toHaveBeenCalledWith(expect.stringMatching(/^res-/));
  const action = dispatch.mock.calls[0]![0];
  expect(transition(state, action).bookings.at(-1)!.code).toMatch(/^GPE-[A-Z0-9]{6}$/);
});

it('uses the current picker value/dismiss callbacks and keeps Recife wall-clock time', () => {
  const garage = state.garages[0]!;
  const screen = render(<BookingForm garageId={garage.id} onBack={jest.fn()} onBooked={jest.fn()} />);
  fireEvent.press(screen.getByLabelText(/^Horário de entrada:/));
  const picker = screen.getByTestId('booking-datetime-picker');
  expect(picker.props.onChange).toBeUndefined();
  const selected = new Date(picker.props.value as Date); selected.setHours(17, 22, 0, 0);
  fireEvent(picker, 'valueChange', { nativeEvent: { timestamp: selected.getTime(), utcOffset: 0 } }, selected);
  expect(screen.queryByTestId('booking-datetime-picker')).toBeNull();
  expect(screen.getByLabelText('Horário de entrada: 17:22')).toBeTruthy();
  fireEvent.press(screen.getByLabelText('Horário de entrada: 17:22'));
  fireEvent(screen.getByTestId('booking-datetime-picker'), 'dismiss');
  expect(screen.queryByTestId('booking-datetime-picker')).toBeNull();
  expect(screen.getByLabelText('Horário de entrada: 17:22')).toBeTruthy();
});

it('keeps the driver history limited to their own bookings and exposes all four statuses', () => {
  const screen = render(<BookingsScreen onBooking={jest.fn()} onExplore={jest.fn()} />);
  expect(screen.getByText('Próximas (1)')).toBeTruthy();
  expect(screen.getByText('Em andamento (1)')).toBeTruthy();
  expect(screen.getByText('Concluídas (1)')).toBeTruthy();
  expect(screen.getByText('Canceladas (1)')).toBeTruthy();
  expect(screen.queryByText(state.bookings.find(item => item.id === 'demo-upcoming-owner')!.code)).toBeNull();
});

it('opens booking cards and shows their access code', () => {
  const booking = state.bookings[0]!; const open = jest.fn();
  const screen = render(<BookingCard booking={booking} onPress={open} />);
  fireEvent.press(screen.getByRole('button'));
  expect(open).toHaveBeenCalledTimes(1);
  expect(screen.getByText(booking.code)).toBeTruthy();
});

it('blocks details of another driver booking before revealing its address or instructions', () => {
  const booking = state.bookings.find(item => item.driverId !== 'local')!;
  const screen = render(<BookingDetail bookingId={booking.id} onBack={jest.fn()} />);
  expect(screen.getByText('Não foi possível abrir esta reserva')).toBeTruthy();
  expect(screen.queryByText(booking.address)).toBeNull();
  expect(screen.queryByText(booking.accessInstructions)).toBeNull();
});

it('confirms access and allows opening the reservation or returning home', () => {
  const booking = state.bookings[0]!; const home = jest.fn();
  const screen = render(<BookingDetail bookingId={booking.id} onBack={jest.fn()} onHome={home} justBooked />);
  expect(screen.getByTestId('booking-confirmation')).toBeTruthy();
  expect(screen.getByText(booking.code)).toBeTruthy();
  expect(screen.getByText(booking.accessInstructions)).toBeTruthy();
  fireEvent.press(screen.getByLabelText('Voltar ao início'));
  expect(home).toHaveBeenCalledTimes(1);
  fireEvent.press(screen.getByLabelText('Abrir reserva'));
  expect(screen.getByTestId('booking-detail')).toBeTruthy();
});

it('submits a 1–5 review only for a completed booking in the current role', async () => {
  const booking = state.bookings.find(item => item.status === 'completed')!;
  const screen = render(<BookingDetail bookingId={booking.id} onBack={jest.fn()} />);
  fireEvent.press(screen.getByLabelText('Avaliar com 4 estrelas'));
  fireEvent.changeText(screen.getByLabelText('Comentário (opcional)'), 'Entrada fácil e espaço iluminado.');
  fireEvent.press(screen.getByLabelText('Salvar avaliação da vaga'));
  await waitFor(() => expect(dispatch).toHaveBeenCalledWith({ type: 'review', review: { id: `review-${booking.id}-driver`, bookingId: booking.id, authorRole: 'driver', score: 4, comment: 'Entrada fácil e espaço iluminado.' } }));
});

it('round-trips Recife wall-clock picker fields across UTC date boundaries', () => {
  const instant = new Date('2026-09-10T01:30:00.000Z');
  const fields = toRecifePickerDate(instant);
  expect(fields.getDate()).toBe(9); expect(fields.getHours()).toBe(22); expect(fields.getMinutes()).toBe(30);
  expect(fromRecifePickerDate(fields).toISOString()).toBe(instant.toISOString());
});
