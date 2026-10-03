import { availableSpaces, isWithinAvailability } from '../../domain/model';
import type { Booking, Garage } from '../../domain/types';

const HOUR = 3_600_000;
const RECIFE_OFFSET = 3 * HOUR;

/** Recife has no DST; financial periods use the local booking start date. */
export function monthKey(date: string | Date): string {
  return new Date(new Date(date).getTime() - RECIFE_OFFSET).toISOString().slice(0, 7);
}

export function monthLabel(key: string, short = false): string {
  return new Date(`${key}-15T12:00:00-03:00`).toLocaleDateString('pt-BR', { month: short ? 'short' : 'long', ...(short ? {} : { year: 'numeric' }), timeZone: 'America/Recife' });
}

export function bookingDate(value: string): string {
  return new Date(value).toLocaleString('pt-BR', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit', timeZone: 'America/Recife' });
}

export function finances(bookings: readonly Booking[]) {
  return bookings.filter(booking => booking.status !== 'cancelled').reduce((sum, booking) => ({
    gross: sum.gross + booking.total, commission: sum.commission + booking.commission, net: sum.net + booking.net,
  }), { gross: 0, commission: 0, net: 0 });
}

export function weeklyReservations(bookings: readonly Booking[], now: Date) {
  const local = new Date(now.getTime() - RECIFE_OFFSET);
  const today = local.toISOString().slice(0, 10);
  const offset = (local.getUTCDay() + 6) % 7;
  local.setUTCHours(0, 0, 0, 0);
  local.setUTCDate(local.getUTCDate() - offset);
  return Array.from({ length: 7 }, (_, index) => {
    const day = new Date(local.getTime() + index * 24 * HOUR);
    const key = day.toISOString().slice(0, 10);
    return { key, label: ['Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb', 'Dom'][index]!, today: key === today, count: bookings.filter(booking => booking.status !== 'cancelled' && new Date(Date.parse(booking.startAt) - RECIFE_OFFSET).toISOString().slice(0, 10) === key).length };
  });
}

export function recentMonths(now: Date, bookings: readonly Booking[]): string[] {
  const keys = new Set<string>();
  const local = new Date(now.getTime() - RECIFE_OFFSET);
  for (let index = 0; index < 6; index += 1) {
    keys.add(`${local.getUTCFullYear()}-${String(local.getUTCMonth() + 1).padStart(2, '0')}`);
    local.setUTCDate(1);
    local.setUTCMonth(local.getUTCMonth() - 1);
  }
  for (const booking of bookings) keys.add(monthKey(booking.startAt));
  return [...keys].sort().reverse();
}

/** Used capacity-hours / scheduled capacity-hours; cancelled bookings do not occupy. */
export function monthlyOccupancy(garages: readonly Garage[], bookings: readonly Booking[], month: string): number {
  const start = Date.parse(`${month}-01T00:00:00-03:00`);
  const date = new Date(start - RECIFE_OFFSET);
  const nextMonth = new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth() + 1, 1)).getTime() + RECIFE_OFFSET;
  const garageIds = new Set(garages.map(garage => garage.id));
  const scheduledHours = garages.reduce((sum, garage) => {
    const minutes = (value: string) => Number(value.slice(0, 2)) * 60 + Number(value.slice(3));
    const hours = (minutes(garage.availability.closes) - minutes(garage.availability.opens)) / 60;
    let days = 0;
    for (let day = start; day < nextMonth; day += 24 * HOUR) {
      if (garage.availability.days.includes(new Date(day - RECIFE_OFFSET).getUTCDay())) days += 1;
    }
    return sum + days * hours * garage.capacity;
  }, 0);
  if (scheduledHours === 0) return 0;
  const usedHours = bookings.filter(booking => garageIds.has(booking.garageId) && booking.status !== 'cancelled').reduce((sum, booking) =>
    sum + Math.max(0, Math.min(nextMonth, Date.parse(booking.endAt)) - Math.max(start, Date.parse(booking.startAt))) / HOUR, 0);
  return Math.min(100, Math.round(usedHours / scheduledHours * 1000) / 10);
}

export function nextAvailability(garage: Garage, bookings: Booking[], now = new Date()): string {
  if (!garage.active) return 'Anúncio pausado';
  const currentStart = now.toISOString();
  const currentEnd = new Date(now.getTime() + HOUR).toISOString();
  if (isWithinAvailability(garage, currentStart, currentEnd) && availableSpaces(garage, bookings, currentStart, currentEnd) > 0) return 'Disponível agora · mínimo de 1 h';
  // Availability can begin at an exact opening minute or when a booking ends.
  // A fixed time grid would miss a one-hour window such as 08:07–09:07.
  const horizon = now.getTime() + 14 * 24 * HOUR;
  const candidates = new Set<number>();
  const localDay = new Date(now.getTime() - RECIFE_OFFSET);
  localDay.setUTCHours(0, 0, 0, 0);
  const openingMinutes = Number(garage.availability.opens.slice(0, 2)) * 60 + Number(garage.availability.opens.slice(3));
  for (let day = 0; day <= 14; day += 1) candidates.add(localDay.getTime() + RECIFE_OFFSET + day * 24 * HOUR + openingMinutes * 60_000);
  for (const booking of bookings) {
    if (booking.garageId === garage.id && (booking.status === 'confirmed' || booking.status === 'active')) candidates.add(Date.parse(booking.endAt));
  }
  for (const start of [...candidates].filter(value => value > now.getTime() && value <= horizon).sort((a, b) => a - b)) {
    const startAt = new Date(start).toISOString();
    const endAt = new Date(start + HOUR).toISOString();
    if (isWithinAvailability(garage, startAt, endAt) && availableSpaces(garage, bookings, startAt, endAt) > 0) {
      return `A partir de ${bookingDate(startAt)}`;
    }
  }
  return 'Sem período livre de 1 h nos próximos 14 dias';
}
