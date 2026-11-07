import { afterEach, beforeEach, describe, expect, it, jest } from '@jest/globals';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { createInitialState, defaultFilters, transition } from '../domain/model';
import { BACKUP_KEY, isAppState, LEGACY_KEY, loadState, migrateLegacyState, persistState, STORAGE_KEY } from './persistence';
import type { AppState } from '../domain/types';

beforeEach(async () => {
  jest.useFakeTimers().setSystemTime(new Date('2030-09-04T12:00:00Z'));
  jest.clearAllMocks();
  await AsyncStorage.clear();
});
afterEach(() => { jest.useRealTimers(); });
function legacyFixture() {
  const state = createInitialState();
  return { version: 1, onboarded: true, role: 'driver', profile: state.profile, favorites: ['boa-viagem'], garages: state.garages.slice(0, 2).map((garage) => ({ id: garage.id, ownerId: garage.ownerId, name: garage.name, neighborhood: garage.neighborhood, address: garage.address, description: garage.description, pricePerHour: garage.pricePerHour, capacity: garage.capacity, amenities: ['covered'], active: garage.active, latitude: garage.latitude, longitude: garage.longitude, rating: garage.rating, reviews: garage.reviews, theme: garage.theme })), bookings: state.bookings.slice(0, 2).map((booking) => ({ id: booking.id, garageId: booking.garageId, garageName: booking.garageName, address: booking.address, driverName: booking.driverName, plate: booking.plate, vehicle: booking.vehicle, startAt: booking.startAt, endAt: booking.endAt, total: booking.total, pricePerHour: booking.pricePerHour, status: booking.status, code: 'PE-ABC123', createdAt: booking.createdAt })) };
}

describe('local persistence', () => {
  it('returns complete initial state only when no current or legacy data exists', async () => {
    const initial = createInitialState();
    await expect(loadState()).resolves.toEqual(initial);
    expect(AsyncStorage.getItem).toHaveBeenCalledWith(STORAGE_KEY);
    expect(AsyncStorage.getItem).toHaveBeenCalledWith(LEGACY_KEY);
    expect(AsyncStorage.setItem).toHaveBeenCalledWith(STORAGE_KEY, JSON.stringify(initial));
    jest.setSystemTime(new Date('2031-01-01T12:00:00Z'));
    await expect(loadState()).resolves.toEqual(initial);
  });
  it('roundtrips role, both profiles, garage edit, photo, favorites, vehicles, booking, reviews, filters and preferences', async () => {
    let state = transition(createInitialState(), { type: 'onboard', name: 'Maria · demonstração', role: 'owner' });
    state = transition(state, { type: 'favorite', garageId: 'boa-viagem' });
    state = transition(state, { type: 'saveGarage', id: 'boa-viagem', input: { ...state.garages[0]!, name: 'Minha garagem editada', photos: ['file:///documents/garagem-pe/test.jpg'] } });
    state = transition(state, { type: 'role', role: 'driver' });
    state = transition(state, { type: 'book', id: 'persisted-booking', now: '2030-09-04T12:00:00Z', input: { garageId: 'boa-viagem', startAt: '2030-09-04T14:00:00Z', hours: 1.5, plate: 'ABC1D23', vehicle: 'Onix' } });
    state = transition(state, { type: 'filters', filters: { ...defaultFilters(), covered: true, maxPrice: 1500, query: 'Boa Viagem' } });
    state = transition(state, { type: 'preferences', preferences: { ...state.preferences, view: 'map' } });
    state = transition(state, { type: 'saveVehicle', vehicle: { id: 'new', label: 'Moto azul', plate: 'ABC4D56', type: 'motorcycle' } });
    state = transition(state, { type: 'review', review: { id: 'persisted-review', bookingId: 'demo-completed', authorRole: 'driver', score: 4, comment: 'Acesso fácil.' } });
    await persistState(state);
    expect(AsyncStorage.setItem).toHaveBeenCalledWith(STORAGE_KEY, JSON.stringify(state));
    await expect(loadState()).resolves.toEqual(state);
    // New process/time must read original dates and edited data, never regenerate seeds.
    jest.setSystemTime(new Date('2031-01-01T12:00:00Z'));
    await expect(loadState()).resolves.toEqual(state);
  });
  it('reports a first-use save failure instead of showing an unsaved demonstration', async () => {
    jest.mocked(AsyncStorage.setItem).mockRejectedValueOnce(new Error('initial disk full'));
    await expect(loadState()).rejects.toThrow('initial disk full');
    await expect(AsyncStorage.getItem(STORAGE_KEY)).resolves.toBeNull();
  });
  it.each(['{broken json', JSON.stringify({ version: 2 }), JSON.stringify({ ...createInitialState(), garages: [{ id: 'incomplete' }] })])('backs up invalid payload without overwriting it: %s', async (serialized) => {
    await AsyncStorage.setItem(STORAGE_KEY, serialized);
    await expect(loadState()).rejects.toThrow('cópia de segurança foi preservada');
    await expect(AsyncStorage.getItem(BACKUP_KEY)).resolves.toBe(serialized);
    await expect(AsyncStorage.getItem(STORAGE_KEY)).resolves.toBe(serialized);
    await expect(loadState()).rejects.toThrow('dados salvos estão inválidos');
    await expect(AsyncStorage.getItem(BACKUP_KEY)).resolves.toBe(serialized);
  });
  it('retains the first backup even if another corrupt payload is encountered', async () => {
    await AsyncStorage.setItem(BACKUP_KEY, 'original damaged data');
    await AsyncStorage.setItem(STORAGE_KEY, 'new damaged data');
    await expect(loadState()).rejects.toThrow('cópia de segurança');
    await expect(AsyncStorage.getItem(BACKUP_KEY)).resolves.toBe('original damaged data');
  });
  it('surfaces read, write and failed-backup errors without deleting data', async () => {
    jest.mocked(AsyncStorage.getItem).mockRejectedValueOnce(new Error('read failure'));
    await expect(loadState()).rejects.toThrow('ler os dados salvos');
    jest.mocked(AsyncStorage.setItem).mockRejectedValueOnce(new Error('disk full'));
    await expect(persistState(createInitialState())).rejects.toThrow('disk full');
    await AsyncStorage.setItem(STORAGE_KEY, '{');
    jest.mocked(AsyncStorage.setItem).mockRejectedValueOnce(new Error('backup failure'));
    await expect(loadState()).rejects.toThrow('Nenhum dado foi apagado');
    await expect(AsyncStorage.getItem(STORAGE_KEY)).resolves.toBe('{');
  });
  it('rejects invalid state before overwriting a valid save', async () => {
    const state = createInitialState(); await persistState(state);
    await expect(persistState({ ...state, favorites: ['missing-garage'] })).rejects.toThrow('dados do aplicativo estão inválidos');
    await expect(loadState()).resolves.toEqual(state);
  });
  it('explicit restore replaces all app data and preserves damaged backup', async () => {
    await AsyncStorage.setItem(STORAGE_KEY, 'broken');
    await expect(loadState()).rejects.toThrow('dados salvos estão inválidos');
    const reset = transition({ ...createInitialState(), favorites: ['boa-viagem'] }, { type: 'reset' });
    await persistState(reset);
    await expect(loadState()).resolves.toEqual(createInitialState());
    await expect(AsyncStorage.getItem(BACKUP_KEY)).resolves.toBe('broken');
  });
});

describe('complete stored schema', () => {
  it('accepts a freshly initialized and serialized v2 state', () => {
    expect(isAppState(createInitialState())).toBe(true);
    expect(isAppState(JSON.parse(JSON.stringify(createInitialState())))).toBe(true);
  });
  it('preserves saved list preference and accepts earlier v2 filters without today', async () => {
    const state = createInitialState();
    expect(state.preferences.view).toBe('map');
    state.preferences.view = 'list';
    delete state.filters.today;
    await persistState(state);
    await expect(loadState()).resolves.toEqual(state);
    expect(isAppState({ ...state, filters: { ...state.filters, today: 'yes' } })).toBe(false);
  });
  it('preserves six historical v2 local photos without allowing seventh or remote files', async () => {
    const state = createInitialState();
    state.garages[0]!.photos = Array.from({ length: 6 }, (_, index) => `file:///documents/historical-${index}.jpg`);
    await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(state));
    await expect(loadState()).resolves.toEqual(state);
    expect(isAppState({ ...state, garages: state.garages.map((garage, index) => index === 0 ? { ...garage, photos: [...garage.photos, 'file:///documents/seventh.jpg'] } : garage) })).toBe(false);
    state.garages[0]!.photos[5] = 'https://remote/photo.jpg';
    expect(isAppState(state)).toBe(false);
  });
  it.each([
    null, [], { ...createInitialState(), version: 3 }, { ...createInitialState(), role: 'admin' }, { ...createInitialState(), role: ['driver'] },
    { ...createInitialState(), profile: { name: 123 } }, { ...createInitialState(), ownerProfile: undefined }, { ...createInitialState(), favorites: ['missing'] },
    { ...createInitialState(), favorites: ['boa-viagem', 'boa-viagem'] }, { ...createInitialState(), garages: [...createInitialState().garages, createInitialState().garages[0]] },
    { ...createInitialState(), vehicles: undefined }, { ...createInitialState(), reviews: undefined }, { ...createInitialState(), filters: undefined }, { ...createInitialState(), preferences: undefined },
  ])('rejects malformed, incomplete or incompatible payload %#', (state) => { expect(isAppState(state)).toBe(false); });
  it.each([
    { pricePerHour: Infinity }, { amenities: ['unknown'] }, { authorized: false }, { vehicleTypes: ['truck'] }, { photos: ['https://remote/image.jpg'] },
    { width: -2 }, { pricePerDay: 1.5 }, { availability: { days: [0, 0], opens: '00:00', closes: '24:00' } }, { availability: { days: [7], opens: '00:00', closes: '24:00' } },
    { availability: { days: [1], opens: '18:00', closes: '08:00' } }, { rules: undefined }, { accessInstructions: undefined },
  ])('rejects invalid or missing garage field %j', (overrides) => {
    const state = createInitialState(); expect(isAppState({ ...state, garages: state.garages.map((garage, index) => index === 0 ? { ...garage, ...overrides } : garage) })).toBe(false);
  });
  it.each([
    { garageId: 'missing' }, { total: 1 }, { commission: 1 }, { net: 1 }, { startAt: 'bad date' }, { endAt: '2030-01-01T00:00:00Z' },
    { code: 'PE-123456' }, { billingMode: 'weekly' }, { paymentMethod: 'real-card' }, { vehicleType: 'truck' }, { pricePerDay: undefined }, { driverId: undefined },
  ])('rejects invalid reservation snapshot %j', (overrides) => {
    const state = createInitialState(); expect(isAppState({ ...state, bookings: state.bookings.map((booking, index) => index === 0 ? { ...booking, ...overrides } : booking) })).toBe(false);
  });
  it('rejects duplicate codes, malformed vehicles, filters, location and unauthorized reviews', () => {
    const state = createInitialState();
    expect(isAppState({ ...state, bookings: state.bookings.map((booking) => ({ ...booking, code: state.bookings[0]!.code })) })).toBe(false);
    expect(isAppState({ ...state, vehicles: [state.vehicles[0], state.vehicles[0]] })).toBe(false);
    expect(isAppState({ ...state, filters: { ...state.filters, maxPrice: -1 } })).toBe(false);
    expect(isAppState({ ...state, preferences: { ...state.preferences, location: { latitude: 91, longitude: 0, label: 'Inválida' } } })).toBe(false);
    const review = { id: 'one', bookingId: 'demo-active', authorRole: 'driver', score: 5, comment: '' };
    expect(isAppState({ ...state, reviews: [review] })).toBe(false);
    const completed = { ...review, bookingId: 'demo-completed' };
    expect(isAppState({ ...state, reviews: [completed, { ...completed, id: 'two' }] })).toBe(false);
    expect(isAppState({ ...state, reviews: [{ ...completed, score: 6 }] })).toBe(false);
  });
});

describe('version 1 migration', () => {
  it('preserves profiles, edited garages, favorites and booking money; adds v2 metadata and unique codes', async () => {
    const legacy = legacyFixture();
    legacy.garages[0]!.name = 'Vaga editada antiga';
    await AsyncStorage.setItem(LEGACY_KEY, JSON.stringify(legacy));
    const migrated = await loadState();
    expect(migrated.version).toBe(2); expect(migrated.profile).toEqual(legacy.profile);
    expect(migrated.garages[0]?.name).toBe('Vaga editada antiga');
    expect(migrated.garages[0]).toMatchObject({ active: false, authorized: false });
    expect(migrated.favorites).toEqual(legacy.favorites);
    expect(migrated.bookings.map((booking) => booking.total)).toEqual(legacy.bookings.map((booking) => booking.total));
    expect(migrated.bookings.every((booking) => /^GPE-[A-Z0-9]{6}$/.test(booking.code))).toBe(true);
    expect(new Set(migrated.bookings.map((booking) => booking.code)).size).toBe(migrated.bookings.length);
    await expect(AsyncStorage.getItem(LEGACY_KEY)).resolves.toBe(JSON.stringify(legacy));
    await expect(AsyncStorage.getItem(STORAGE_KEY)).resolves.toBe(JSON.stringify(migrated));
    await expect(loadState()).resolves.toEqual(migrated);
  });
  it('fills an empty not-yet-onboarded legacy profile and rejects corrupted legacy state', () => {
    const legacy = legacyFixture(); legacy.onboarded = false; legacy.profile.name = '';
    expect(migrateLegacyState(legacy)?.profile.name).toContain('demonstração');
    expect(migrateLegacyState({ ...legacy, garages: [{ id: 'broken' }] })).toBeNull();
    expect(migrateLegacyState({ ...legacy, garages: [{ ...legacy.garages[0], pricePerHour: undefined }] })).toBeNull();
    expect(migrateLegacyState({ ...legacy, bookings: [{ ...legacy.bookings[0], total: 1 }] })).toBeNull();
  });
  it('does not discard a legacy save if migration write fails', async () => {
    const serialized = JSON.stringify(legacyFixture());
    await AsyncStorage.setItem(LEGACY_KEY, serialized);
    jest.mocked(AsyncStorage.setItem).mockRejectedValueOnce(new Error('migration disk full'));
    await expect(loadState()).rejects.toThrow('migration disk full');
    await expect(AsyncStorage.getItem(LEGACY_KEY)).resolves.toBe(serialized);
    await expect(AsyncStorage.getItem(STORAGE_KEY)).resolves.toBeNull();
  });
  it('backs up unsupported legacy payload and never silently resets it', async () => {
    const invalid = JSON.stringify({ version: 1, profile: { name: 'old' } });
    await AsyncStorage.setItem(LEGACY_KEY, invalid);
    await expect(loadState()).rejects.toThrow('cópia de segurança');
    await expect(AsyncStorage.getItem(LEGACY_KEY)).resolves.toBe(invalid);
    await expect(AsyncStorage.getItem(BACKUP_KEY)).resolves.toBe(invalid);
  });
  it('prefers current v2 state when an old legacy snapshot remains', async () => {
    const state: AppState = { ...createInitialState(), favorites: ['varzea'] };
    await AsyncStorage.setItem(LEGACY_KEY, JSON.stringify(legacyFixture()));
    await persistState(state);
    await expect(loadState()).resolves.toEqual(state);
  });
});
