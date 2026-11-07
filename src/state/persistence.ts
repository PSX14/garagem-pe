import AsyncStorage from '@react-native-async-storage/async-storage';
import { calculatePrice, createInitialState, generateBookingCode } from '../domain/model';
import { validateFilters, validateGarage, validatePreferences, validatedProfile, validateVehicle } from '../domain/validation';
import type { AppState, Booking, Garage, Profile, Review, Vehicle } from '../domain/types';

export const STORAGE_KEY = '@garagem-pe/state/v2';
export const LEGACY_KEY = '@garagem-pe/state/v1';
export const BACKUP_KEY = '@garagem-pe/state/corrupted/v2';
type RecordValue = Record<string, unknown>;
const isRecord = (value: unknown): value is RecordValue => typeof value === 'object' && value !== null && !Array.isArray(value);
const isString = (value: unknown): value is string => typeof value === 'string';
const isNumber = (value: unknown): value is number => typeof value === 'number' && Number.isFinite(value);
const isInteger = (value: unknown): value is number => typeof value === 'number' && Number.isSafeInteger(value);
const isDate = (value: unknown): value is string => isString(value) && value.trim().length > 0 && Number.isFinite(Date.parse(value));
const isStringList = (value: unknown): value is string[] => Array.isArray(value) && value.every(isString);
const isUnique = (values: string[]) => new Set(values).size === values.length;
const strings = (value: RecordValue, keys: string[]) => keys.every((key) => isString(value[key]));
const nonempty = (value: RecordValue, keys: string[]) => keys.every((key) => isString(value[key]) && String(value[key]).trim().length > 0);
const platePattern = /^[A-Z]{3}(?:\d{4}|\d[A-Z]\d{2})$/;

function isProfile(value: unknown): value is Profile {
  if (!isRecord(value) || !strings(value, ['name', 'email', 'phone', 'plate', 'vehicle'])) return false;
  try { validatedProfile(value as unknown as Profile); return true; } catch { return false; }
}
function isGarage(value: unknown): value is Garage {
  if (!isRecord(value) || !nonempty(value, ['id', 'ownerId', 'ownerName']) || !strings(value, ['name', 'neighborhood', 'address', 'approximateAddress', 'complement', 'landmark', 'description', 'rules', 'accessInstructions'])) return false;
  if (typeof value.active !== 'boolean' || typeof value.authorized !== 'boolean' || (value.active && !value.authorized)) return false;
  if (!isNumber(value.rating) || value.rating < 0 || value.rating > 5 || !isInteger(value.reviews) || value.reviews < 0 || !isString(value.theme) || !['mint', 'sand', 'blue'].includes(value.theme)) return false;
  if (!isStringList(value.amenities) || !isUnique(value.amenities) || !isStringList(value.vehicleTypes) || !isUnique(value.vehicleTypes) || !isStringList(value.photos) || !isUnique(value.photos) || !isRecord(value.availability) || !Array.isArray(value.availability.days) || new Set(value.availability.days).size !== value.availability.days.length) return false;
  // Early v2 builds allowed six photos. Preserve those local files when loading;
  // the next listing edit must obey the five-photo limit from the supplied mockup.
  if (value.photos.length > 6 || value.photos.some((uri) => !uri.startsWith('file:///'))) return false;
  try { validateGarage({ ...value, authorized: true, photos: value.photos.slice(0, 5) } as unknown as Garage); return true; } catch { return false; }
}
function isBooking(value: unknown, garageIds: string[]): value is Booking {
  if (!isRecord(value) || !nonempty(value, ['id', 'garageId', 'garageName', 'address', 'accessInstructions', 'driverId', 'driverName', 'plate', 'vehicle', 'code'])) return false;
  if (!garageIds.includes(String(value.garageId)) || !isString(value.status) || !['confirmed', 'active', 'completed', 'cancelled'].includes(value.status)) return false;
  if (!isString(value.vehicleType) || !['car', 'motorcycle'].includes(value.vehicleType) || !isString(value.paymentMethod) || !['pix', 'card', 'cash'].includes(value.paymentMethod) || !isString(value.billingMode) || !['hour', 'day'].includes(value.billingMode)) return false;
  if (!isDate(value.startAt) || !isDate(value.endAt) || !isDate(value.createdAt) || Date.parse(value.endAt) <= Date.parse(value.startAt) || Date.parse(value.createdAt) > Date.parse(value.startAt)) return false;
  if (!isInteger(value.total) || !isInteger(value.commission) || !isInteger(value.net) || !isInteger(value.pricePerHour) || value.pricePerHour < 100 || value.pricePerHour > 100000 || !(value.pricePerDay === null || (isInteger(value.pricePerDay) && value.pricePerDay >= 100 && value.pricePerDay <= 2_400_000))) return false;
  if (!platePattern.test(String(value.plate)) || !/^GPE-[A-Z0-9]{6}$/.test(String(value.code))) return false;
  const hours = (Date.parse(value.endAt) - Date.parse(value.startAt)) / 3_600_000;
  try {
    const expected = calculatePrice({ pricePerHour: value.pricePerHour, pricePerDay: value.pricePerDay }, hours, value.billingMode as Booking['billingMode']);
    return expected.total === value.total && expected.commission === value.commission && expected.net === value.net;
  } catch { return false; }
}
function isVehicle(value: unknown): value is Vehicle {
  if (!isRecord(value) || !strings(value, ['id', 'label', 'plate', 'type']) || !platePattern.test(String(value.plate))) return false;
  try { validateVehicle(value as unknown as Vehicle); return true; } catch { return false; }
}
function isReview(value: unknown, bookings: Booking[], garages: Garage[]): value is Review {
  if (!isRecord(value) || !nonempty(value, ['id', 'bookingId']) || !isString(value.comment) || value.comment.length > 500 || !isInteger(value.score) || value.score < 1 || value.score > 5 || (value.authorRole !== 'driver' && value.authorRole !== 'owner')) return false;
  const booking = bookings.find((item) => item.id === value.bookingId);
  if (!booking || booking.status !== 'completed') return false;
  return value.authorRole === 'driver' ? booking.driverId === 'local' : garages.some((garage) => garage.id === booking.garageId && garage.ownerId === 'local');
}
/** Validate the complete versioned payload before exposing it to a screen or overwriting storage. */
export function isAppState(value: unknown): value is AppState {
  if (!isRecord(value) || value.version !== 2 || typeof value.onboarded !== 'boolean' || (value.role !== 'driver' && value.role !== 'owner') || !isProfile(value.profile) || !isProfile(value.ownerProfile)) return false;
  if (!Array.isArray(value.garages) || !value.garages.every(isGarage) || !isStringList(value.favorites) || !isUnique(value.favorites)) return false;
  const garageIds = value.garages.map((garage) => garage.id);
  if (!isUnique(garageIds) || value.favorites.some((id) => !garageIds.includes(id))) return false;
  if (!Array.isArray(value.bookings) || !value.bookings.every((booking) => isBooking(booking, garageIds)) || !isUnique(value.bookings.map((booking) => booking.id)) || !isUnique(value.bookings.map((booking) => booking.code))) return false;
  if (!Array.isArray(value.vehicles) || !value.vehicles.every(isVehicle) || !isUnique(value.vehicles.map((vehicle) => vehicle.id)) || !isUnique(value.vehicles.map((vehicle) => vehicle.plate))) return false;
  const bookings = value.bookings as Booking[];
  const garages = value.garages as Garage[];
  if (!Array.isArray(value.reviews) || !value.reviews.every((review) => isReview(review, bookings, garages)) || !isUnique(value.reviews.map((review) => review.id)) || !isUnique(value.reviews.map((review) => `${review.bookingId}:${review.authorRole}`))) return false;
  if (!isRecord(value.filters) || !isRecord(value.preferences) || !isRecord(value.preferences.location)) return false;
  try { validateFilters(value.filters as unknown as AppState['filters']); validatePreferences(value.preferences as unknown as AppState['preferences']); return true; } catch { return false; }
}

/** v1 has no authorization evidence: keep local listings paused until the owner confirms it. */
export function migrateLegacyState(value: unknown): AppState | null {
  if (!isRecord(value) || value.version !== 1 || typeof value.onboarded !== 'boolean' || (value.role !== 'driver' && value.role !== 'owner') || !isRecord(value.profile) || !strings(value.profile, ['name', 'email', 'phone', 'plate', 'vehicle']) || !Array.isArray(value.garages) || !Array.isArray(value.bookings) || !isStringList(value.favorites)) return null;
  const initial = createInitialState();
  const profile = { ...value.profile, name: String(value.profile.name).trim() || initial.profile.name } as unknown as Profile;
  if (!isProfile(profile)) return null;
  const garages: Garage[] = [];
  for (const item of value.garages) {
    if (!isRecord(item) || !nonempty(item, ['id', 'ownerId', 'name', 'neighborhood', 'address', 'description']) || typeof item.active !== 'boolean' || !isStringList(item.amenities) || !isUnique(item.amenities) || item.amenities.some((amenity) => !['covered', 'camera', 'accessible', 'electric'].includes(amenity))) return null;
    if (!isInteger(item.pricePerHour) || !isInteger(item.capacity) || !isNumber(item.latitude) || !isNumber(item.longitude) || !isNumber(item.rating) || !isInteger(item.reviews) || !isString(item.theme)) return null;
    const garage: Garage = {
      ...initial.garages[0]!, ...item, ownerName: item.ownerId === 'local' ? profile.name : 'Proprietário · demonstração',
      approximateAddress: `Região de ${String(item.neighborhood)} · Recife`, complement: '', landmark: String(item.neighborhood), pricePerDay: null,
      photos: [], spaceType: 'garage', width: 2.6, length: 5.2, vehicleTypes: ['car', 'motorcycle'], availability: { days: [0, 1, 2, 3, 4, 5, 6], opens: '00:00', closes: '24:00' },
      authorized: item.ownerId !== 'local', active: item.ownerId === 'local' ? false : item.active,
    } as Garage;
    if (!isGarage(garage)) return null;
    garages.push(garage);
  }
  const bookings: Booking[] = [];
  for (const item of value.bookings) {
    if (!isRecord(item) || !nonempty(item, ['id', 'garageId', 'garageName', 'address', 'driverName', 'plate', 'vehicle', 'code']) || !isDate(item.startAt) || !isDate(item.endAt) || !isDate(item.createdAt) || !isInteger(item.pricePerHour)) return null;
    const garage = garages.find((candidate) => candidate.id === item.garageId);
    if (!garage) return null;
    try {
      const price = calculatePrice({ pricePerHour: item.pricePerHour, pricePerDay: null }, (Date.parse(item.endAt) - Date.parse(item.startAt)) / 3_600_000, 'hour');
      if (item.total !== price.total) return null;
      const booking = { ...item, ...price, driverId: 'local', vehicleType: 'car', pricePerDay: null, billingMode: 'hour', paymentMethod: 'pix', accessInstructions: garage.accessInstructions, code: generateBookingCode(String(item.id), bookings.map((existing) => existing.code)), createdAt: new Date(Math.min(Date.parse(item.createdAt), Date.parse(item.startAt))).toISOString() } as Booking;
      if (!isBooking(booking, garages.map((candidate) => candidate.id))) return null;
      bookings.push(booking);
    } catch { return null; }
  }
  const vehicles = profile.plate && profile.vehicle.length >= 2 ? [{ id: 'legacy-vehicle', label: profile.vehicle, plate: profile.plate, type: 'car' as const }] : initial.vehicles;
  const migrated: AppState = { ...initial, onboarded: value.onboarded, role: value.role, profile, ownerProfile: { ...profile }, garages, bookings, vehicles, favorites: value.favorites };
  return isAppState(migrated) ? migrated : null;
}
function errorDetail(error: unknown): string { return error instanceof Error ? error.message : String(error); }
export async function loadState(): Promise<AppState> {
  let serialized: string | null;
  let legacy = false;
  try {
    serialized = await AsyncStorage.getItem(STORAGE_KEY);
    if (serialized === null) { serialized = await AsyncStorage.getItem(LEGACY_KEY); legacy = serialized !== null; }
  } catch (error) { throw new Error(`Não foi possível ler os dados salvos. Tente novamente. Detalhe: ${errorDetail(error)}`); }
  if (serialized === null) {
    const initial = createInitialState();
    await persistState(initial);
    return initial;
  }
  let parsed: unknown;
  try { parsed = JSON.parse(serialized); } catch { parsed = null; }
  if (!legacy && isAppState(parsed)) return parsed;
  const migrated = migrateLegacyState(parsed);
  if (migrated) { await persistState(migrated); return migrated; }
  try {
    const previousBackup = await AsyncStorage.getItem(BACKUP_KEY);
    if (previousBackup === null) await AsyncStorage.setItem(BACKUP_KEY, serialized);
  } catch (error) { throw new Error(`Os dados salvos estão inválidos e não foi possível criar uma cópia de segurança. Nenhum dado foi apagado. Detalhe: ${errorDetail(error)}`); }
  throw new Error('Os dados salvos estão inválidos. Uma cópia de segurança foi preservada. Você pode tentar novamente ou recomeçar com os dados de demonstração.');
}
export async function persistState(state: AppState): Promise<void> {
  if (!isAppState(state)) throw new Error('Não foi possível salvar: os dados do aplicativo estão inválidos.');
  try { await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(state)); } catch (error) { throw new Error(`Não foi possível salvar os dados neste aparelho. Tente novamente. Detalhe: ${errorDetail(error)}`); }
}
