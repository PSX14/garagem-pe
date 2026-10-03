import type { AppState, Garage, SearchFilters } from './types';
import { availableSpaces, isWithinAvailability } from './availability';
import { HOUR_MS, timeMinutes, validateCoordinates } from './validation';

export function defaultFilters(): SearchFilters {
  return { query: '', maxPrice: null, maxDistanceKm: null, covered: false, gate: false, vehicleType: 'all', immediate: false, today: false, billingMode: 'all', minRating: 0, sort: 'rating' };
}
export function distanceKm(a: { latitude: number; longitude: number }, b: { latitude: number; longitude: number }): number {
  validateCoordinates(a); validateCoordinates(b);
  const radians = (degrees: number) => degrees * Math.PI / 180;
  const deltaLatitude = radians(b.latitude - a.latitude);
  const deltaLongitude = radians(b.longitude - a.longitude);
  const haversine = Math.sin(deltaLatitude / 2) ** 2 + Math.cos(radians(a.latitude)) * Math.cos(radians(b.latitude)) * Math.sin(deltaLongitude / 2) ** 2;
  return 6371 * 2 * Math.atan2(Math.sqrt(Math.min(1, haversine)), Math.sqrt(Math.max(0, 1 - haversine)));
}
function searchable(value: string): string { return value.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase().trim(); }
/** A stay can begin later today in Recife. Checkout may be on the next day. */
function canStartToday(garage: Garage, state: AppState, now: Date, hours: number): boolean {
  const recifeDate = new Date(now.getTime() - 3 * HOUR_MS);
  const dayStart = Date.UTC(recifeDate.getUTCFullYear(), recifeDate.getUTCMonth(), recifeDate.getUTCDate()) + 3 * HOUR_MS;
  const dayEnd = dayStart + 24 * HOUR_MS;
  const current = now.getTime();
  // Availability can first improve at opening or when an occupied space is released.
  // Using event boundaries avoids dropping a valid one-hour slot between grid ticks.
  const candidates = new Set([current, dayStart + timeMinutes(garage.availability.opens) * 60_000]);
  for (const booking of state.bookings) {
    if (booking.garageId === garage.id && (booking.status === 'confirmed' || booking.status === 'active')) candidates.add(Date.parse(booking.endAt));
  }
  return [...candidates].filter((start) => Number.isFinite(start) && start >= current && start < dayEnd).some((start) => {
    const startAt = new Date(start).toISOString();
    const endAt = new Date(start + hours * HOUR_MS).toISOString();
    return isWithinAvailability(garage, startAt, endAt) && availableSpaces(garage, state.bookings, startAt, endAt) > 0;
  });
}
export function filterGarages(state: AppState, now: Date = new Date()): Garage[] {
  const filters = state.filters;
  const tokens = searchable(filters.query).split(/\s+/).filter(Boolean);
  const startAt = now.toISOString();
  const endAt = new Date(now.getTime() + (filters.billingMode === 'day' ? 24 : 1) * HOUR_MS).toISOString();
  const price = (garage: Garage): number => filters.billingMode === 'day' ? garage.pricePerDay ?? Infinity : garage.pricePerHour;
  return state.garages.filter((garage) => {
    if (!garage.active || !garage.authorized) return false;
    const haystack = searchable(`${garage.name} ${garage.neighborhood} ${garage.approximateAddress} ${garage.landmark} ${garage.description}`);
    if (!tokens.every((token) => haystack.includes(token))) return false;
    if (filters.maxPrice !== null && price(garage) > filters.maxPrice) return false;
    if (filters.maxDistanceKm !== null && distanceKm(state.preferences.location, garage) > filters.maxDistanceKm) return false;
    if (filters.covered && !garage.amenities.includes('covered')) return false;
    if (filters.gate && !garage.amenities.includes('gate')) return false;
    if (filters.vehicleType !== 'all' && !garage.vehicleTypes.includes(filters.vehicleType)) return false;
    if (filters.billingMode === 'day' && garage.pricePerDay === null) return false;
    if (garage.rating < filters.minRating) return false;
    if (filters.today && !canStartToday(garage, state, now, filters.billingMode === 'day' ? 24 : 1)) return false;
    if (filters.immediate && (!isWithinAvailability(garage, startAt, endAt) || availableSpaces(garage, state.bookings, startAt, endAt) < 1)) return false;
    return true;
  }).sort((a, b) => {
    const primary = filters.sort === 'price' ? price(a) - price(b) : filters.sort === 'distance' ? distanceKm(state.preferences.location, a) - distanceKm(state.preferences.location, b) : b.rating - a.rating;
    return primary || a.id.localeCompare(b.id);
  });
}
