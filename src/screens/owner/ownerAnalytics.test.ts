import { expect, test } from '@jest/globals';
import { createInitialState } from '../../domain/model';
import type { Booking } from '../../domain/types';
import { finances, monthKey, monthlyOccupancy, nextAvailability, weeklyReservations } from './ownerAnalytics';
import { draftErrors, draftInput, initialDraft } from './garageForm';

const now = new Date('2026-09-09T08:00:00-03:00');
const state = createInitialState(now);
const garage = state.garages[0]!;
const booking: Booking = { ...state.bookings[0]!, garageId: garage.id, startAt: '2026-09-09T08:00:00-03:00', endAt: '2026-09-09T10:00:00-03:00', total: 2400, commission: 360, net: 2040, status: 'completed' };

test('finance periods follow Recife at the UTC month boundary', () => {
  expect(monthKey('2026-10-01T02:59:59Z')).toBe('2026-09');
  expect(monthKey('2026-10-01T03:00:00Z')).toBe('2026-10');
});

test('owner totals use saved snapshots and exclude cancelled revenue', () => {
  expect(finances([booking, { ...booking, status: 'cancelled' }])).toEqual({ gross: 2400, commission: 360, net: 2040 });
});

test('the weekly chart uses seven real Recife days and excludes cancelled reservations', () => {
  const week = weeklyReservations([booking, { ...booking, status: 'cancelled' }], now);
  expect(week).toHaveLength(7);
  expect(week[0]?.key).toBe('2026-09-07');
  expect(week.find(day => day.key === '2026-09-09')).toMatchObject({ label: 'Qua', count: 1, today: true });
  expect(week.reduce((sum, day) => sum + day.count, 0)).toBe(1);
});

test('occupancy uses scheduled capacity-hours and ignores cancellations', () => {
  const small = { ...garage, capacity: 1, availability: { days: [0, 1, 2, 3, 4, 5, 6], opens: '08:00', closes: '10:00' } };
  expect(monthlyOccupancy([small], [booking, { ...booking, status: 'cancelled' }], '2026-09')).toBe(3.3);
});

test('next availability skips occupied slots and respects a paused listing', () => {
  const small = { ...garage, capacity: 1, availability: { days: [0, 1, 2, 3, 4, 5, 6], opens: '08:00', closes: '18:00' } };
  expect(nextAvailability(small, [{ ...booking, status: 'confirmed' }], now)).toContain('10:00');
  expect(nextAvailability({ ...small, active: false }, [], now)).toBe('Anúncio pausado');
  expect(nextAvailability(small, [], new Date('2026-09-09T07:55:00-03:00'))).toContain('A partir de');
  expect(nextAvailability(small, [], now)).toContain('Disponível agora');
});

test('next availability keeps exact opening minutes instead of losing narrow valid windows', () => {
  const narrow = { ...garage, capacity: 1, availability: { days: [0, 1, 2, 3, 4, 5, 6], opens: '08:07', closes: '09:07' } };
  expect(nextAvailability(narrow, [], now)).toContain('08:07');
  const after = new Date('2026-09-09T08:08:00-03:00');
  expect(nextAvailability(narrow, [], after)).toContain('10 de set.');
});

test('draft conversion preserves optional daily pricing, measurements and all private fields', () => {
  const draft = { ...initialDraft(garage), pricePerHour: '15,25', pricePerDay: '', width: '2,8' };
  expect(draftErrors(draft)).toEqual({});
  const input = draftInput(draft);
  expect(input).toMatchObject({ pricePerHour: 1525, pricePerDay: null, width: 2.8, authorized: true, address: garage.address, accessInstructions: garage.accessInstructions });
});

test('new listing requires the authorization declaration and meaningful field values', () => {
  const errors = draftErrors(initialDraft());
  expect(errors.authorized).toBeDefined();
  expect(errors.name).toBeDefined();
  expect(errors.width).toBeDefined();
  expect(errors.landmark).toBeDefined();
  expect(draftErrors({ ...initialDraft(garage), width: '2m' }).width).toBeDefined();
});
