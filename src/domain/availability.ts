import type { Booking, Garage } from './types';
import { dateValue, HOUR_MS, requireCondition, timeMinutes } from './validation';

/** Recife uses UTC−03:00 year-round. Never use the device's local timezone. */
export function isWithinAvailability(garage: Garage, startAt: string, endAt: string): boolean {
  const start = Date.parse(startAt);
  const end = Date.parse(endAt);
  const opens = timeMinutes(garage.availability.opens);
  const closes = timeMinutes(garage.availability.closes);
  if (!Number.isFinite(start) || !Number.isFinite(end) || end <= start || !Number.isFinite(opens) || !Number.isFinite(closes) || closes <= opens) return false;
  const days = new Set(garage.availability.days);
  if (days.size === 7 && opens === 0 && closes === 1440) return true;
  // Any period spanning over a week must encounter a closed day or hour.
  if (end - start > 7 * 24 * HOUR_MS) return false;
  const shiftedStart = start - 3 * HOUR_MS;
  const shiftedEnd = end - 3 * HOUR_MS;
  const date = new Date(shiftedStart);
  let dayStart = Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate());
  while (dayStart < shiftedEnd) {
    const dayEnd = dayStart + 24 * HOUR_MS;
    if (!days.has(new Date(dayStart).getUTCDay()) || Math.max(shiftedStart, dayStart) < dayStart + opens * 60_000 || Math.min(shiftedEnd, dayEnd) > dayStart + closes * 60_000) return false;
    dayStart = dayEnd;
  }
  return true;
}
/** Peak occupancy; checkout releases the space exactly at the end time. */
export function peakOccupancy(bookings: Booking[], start: number, end: number): number {
  const events: { time: number; delta: number }[] = [];
  for (const booking of bookings) {
    if (booking.status !== 'confirmed' && booking.status !== 'active') continue;
    const bookingStart = dateValue(booking.startAt);
    const bookingEnd = dateValue(booking.endAt);
    if (bookingStart < end && bookingEnd > start) {
      events.push({ time: Math.max(start, bookingStart), delta: 1 });
      events.push({ time: Math.min(end, bookingEnd), delta: -1 });
    }
  }
  events.sort((a, b) => a.time - b.time || a.delta - b.delta);
  let occupancy = 0;
  let peak = 0;
  for (const event of events) { occupancy += event.delta; peak = Math.max(peak, occupancy); }
  return peak;
}
export function availableSpaces(garage: Garage, bookings: Booking[], startAt: string, endAt: string): number {
  const start = dateValue(startAt);
  const end = dateValue(endAt);
  requireCondition(end > start, 'O horário de saída deve ser depois da entrada.');
  return Math.max(0, garage.capacity - peakOccupancy(bookings.filter((booking) => booking.garageId === garage.id), start, end));
}
