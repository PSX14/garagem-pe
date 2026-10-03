import { afterEach, beforeEach, describe, expect, it, jest } from '@jest/globals';
import { availableSpaces, calculatePrice, createInitialState, defaultFilters, distanceKm, filterGarages, generateBookingCode, isWithinAvailability, money, quote, transition, validateGarage } from './model';
import type { AppState, BookingInput, Garage, GarageInput, SearchFilters } from './types';

const now = '2030-09-04T12:00:00.000Z';
const startAt = '2030-09-04T14:00:00.000Z';
const baseInput: BookingInput = { garageId: 'boa-viagem', startAt, hours: 2, plate: 'abc-1234', vehicle: 'Onix branco' };
const garageInput: GarageInput = { ...createInitialState(new Date(now)).garages[0]!, name: 'Minha garagem', address: 'Rua Fictícia, 123', description: 'Uma garagem privada coberta perto da praia.', pricePerHour: 1250, capacity: 2, amenities: ['covered'] };
beforeEach(() => { jest.useFakeTimers().setSystemTime(new Date(now)); });
afterEach(() => { jest.useRealTimers(); });
function initial(capacity = 1): AppState {
  const state = transition(createInitialState(), { type: 'onboard', name: 'Maria · demonstração', role: 'driver' });
  return { ...state, bookings: [], garages: state.garages.map((garage) => garage.id === 'boa-viagem' ? { ...garage, capacity } : garage) };
}
function book(state: AppState, id = 'reservation-1', overrides: Partial<BookingInput> = {}): AppState { return transition(state, { type: 'book', id, now, input: { ...baseInput, ...overrides } }); }
function owner(state: AppState): AppState { return transition(state, { type: 'role', role: 'owner' }); }
function filtered(filters: Partial<SearchFilters>, state = initial()): Garage[] { return filterGarages({ ...state, filters: { ...defaultFilters(), ...filters } }, new Date(now)); }

describe('demonstration, centavos and codes', () => {
  it('creates independent v2 seeds with eight required neighborhoods, profiles, vehicles and all statuses', () => {
    const state = createInitialState();
    expect(state.version).toBe(2);
    expect(state.garages.map((garage) => garage.neighborhood)).toEqual(['Boa Viagem', 'Recife Antigo', 'Ilha do Leite', 'Derby', 'Madalena', 'Casa Forte', 'Graças', 'Várzea']);
    expect(state.garages.filter((garage) => garage.ownerId === 'local')).toHaveLength(1);
    expect(state.garages.every((garage) => garage.address.includes('fictício'))).toBe(true);
    expect(state.profile.name).toContain('demonstração');
    expect(state.ownerProfile.name).toContain('demonstração');
    expect(state.vehicles).toHaveLength(2);
    expect(new Set(state.bookings.map((booking) => booking.status)).size).toBe(4);
    expect(state.bookings.find((booking) => booking.status === 'confirmed')!.startAt > now).toBe(true);
    state.garages[0]!.amenities.push('electric');
    state.garages[0]!.availability.days.pop();
    expect(createInitialState().garages[0]!.amenities).not.toContain('electric');
    expect(createInitialState().garages[0]!.availability.days).toHaveLength(7);
  });
  it('rounds duration price and commission once, preserving total = commission + net', () => {
    expect(quote(1299, 1.5)).toBe(1949);
    expect(quote(1200, 24)).toBe(28800);
    expect(money(1949).replace(/\s/g, ' ')).toBe('R$ 19,49');
    const garage = { ...initial().garages[0]!, pricePerHour: 1299 };
    expect(calculatePrice(garage, 1.5, 'hour')).toEqual({ total: 1949, commission: 292, net: 1657 });
    expect(calculatePrice(garage, 2, 'hour')).toEqual({ total: 2598, commission: 390, net: 2208 });
    expect(() => quote(1.2, 1)).toThrow('valor por hora');
    expect(() => quote(100, NaN)).toThrow('duração');
    expect(() => quote(100, 0)).toThrow('duração');
    expect(() => quote(Number.MAX_SAFE_INTEGER, 2)).toThrow('total');
  });
  it('charges daily price per started 24-hour block and rejects unavailable daily billing', () => {
    const garage = initial().garages[0]!;
    expect(calculatePrice(garage, 24, 'day')).toEqual({ total: 6500, commission: 975, net: 5525 });
    expect(calculatePrice(garage, 25, 'day').total).toBe(13000);
    expect(() => calculatePrice({ ...garage, pricePerDay: null }, 24, 'day')).toThrow('não oferece');
    expect(book(initial(), 'daily', { hours: 48, billingMode: 'day' }).bookings[0]?.total).toBe(13000);
  });
  it('generates GPE-XXXXXX identifiers and resolves collisions deterministically', () => {
    const first = generateBookingCode('same-id', []);
    const second = generateBookingCode('same-id', [first]);
    expect(first).toMatch(/^GPE-[A-Z0-9]{6}$/);
    expect(second).not.toBe(first);
    const codes: string[] = [];
    for (let index = 0; index < 500; index += 1) codes.push(generateBookingCode(`id-${index}`, codes));
    expect(new Set(codes).size).toBe(500);
    expect(() => generateBookingCode(' ', [])).toThrow('identificar');
  });
});

describe('bookings and peak availability', () => {
  it('confirms with normalized plate, private access and immutable pricing snapshots', () => {
    const before = initial();
    const state = book(before);
    expect(before.bookings).toHaveLength(0);
    expect(state.bookings[0]).toMatchObject({ plate: 'ABC1234', driverId: 'local', total: 2400, commission: 360, net: 2040, status: 'confirmed', driverName: 'Maria · demonstração', endAt: '2030-09-04T16:00:00.000Z' });
    expect(state.bookings[0]?.code).toMatch(/^GPE-/);
    expect(state.bookings[0]?.accessInstructions).toBe(before.garages[0]?.accessInstructions);
    const edited = transition(owner(state), { type: 'saveGarage', id: 'boa-viagem', input: { ...garageInput, pricePerHour: 2500 } });
    expect(edited.bookings[0]).toMatchObject({ pricePerHour: 1200, total: 2400, garageName: 'Garagem Boa Viagem' });
  });
  it('includes the private complement in new receipts and preserves it after the owner edits the listing', () => {
    const created = transition(owner(initial()), { type: 'saveGarage', id: 'private-new', input: { ...garageInput, address: '  Rua Fictícia Aurora, 100  ', complement: '  Vaga A - teste  ' } });
    const reserved = book({ ...created, role: 'driver' }, 'with-complement', { garageId: 'private-new' });
    const receipt = reserved.bookings[0]!;
    expect(receipt.address).toBe('Rua Fictícia Aurora, 100 · Vaga A - teste');
    const edited = transition(owner(reserved), { type: 'saveGarage', id: 'private-new', input: { ...garageInput, address: 'Rua Fictícia Nova, 200', complement: 'Vaga B - novo', accessInstructions: 'Acesso alterado somente para futuras reservas.' } });
    expect(edited.bookings[0]).toEqual(receipt);
    const next = book({ ...edited, role: 'driver' }, 'after-edit', { garageId: 'private-new' });
    expect(next.bookings[1]?.address).toBe('Rua Fictícia Nova, 200 · Vaga B - novo');
    expect(next.bookings[0]?.address).toBe('Rua Fictícia Aurora, 100 · Vaga A - teste');
  });
  it('does not add a separator when the complement is blank or whitespace', () => {
    for (const complement of ['', '  \t\n  ']) {
      const state = initial();
      state.garages[0]!.complement = complement;
      expect(book(state).bookings[0]?.address).toBe(state.garages[0]!.address);
    }
  });
  it('rejects overlapping capacity and accepts adjacent times', () => {
    const state = book(initial());
    expect(() => book(state, 'second', { startAt: '2030-09-04T15:00:00Z' })).toThrow('Não há vagas');
    expect(book(state, 'second', { startAt: '2030-09-04T16:00:00Z' }).bookings).toHaveLength(2);
    expect(book(state, 'second', { startAt: now }).bookings).toHaveLength(2);
  });
  it('uses peak simultaneous occupancy rather than all intersecting reservations', () => {
    let state = book(initial(2), 'one', { hours: 1 });
    state = book(state, 'two', { startAt: '2030-09-04T15:00:00Z', hours: 1 });
    expect(availableSpaces(state.garages[0]!, state.bookings, startAt, '2030-09-04T16:00:00Z')).toBe(1);
    state = book(state, 'three');
    expect(() => book(state, 'four')).toThrow('Não há vagas');
  });
  it('releases cancelled reservations and counts active stays', () => {
    const state = book(initial());
    const cancelled = transition(state, { type: 'bookingStatus', id: 'reservation-1', status: 'cancelled', now });
    expect(book(cancelled, 'new').bookings).toHaveLength(2);
    const active = transition(state, { type: 'bookingStatus', id: 'reservation-1', status: 'active', now: startAt });
    expect(() => book(active, 'new')).toThrow('Não há vagas');
  });
  it('replays the same booking id without duplicating submission', () => { const state = book(initial()); expect(book(state)).toBe(state); });
  it.each([
    [{ plate: 'INVALIDA' }, 'placa válida'], [{ vehicle: '' }, 'veículo'], [{ hours: 0 }, 'pelo menos 1'], [{ hours: 0.99 }, 'pelo menos 1'], [{ hours: NaN }, 'pelo menos 1'],
    [{ startAt: 'invalid' }, 'data e um horário'], [{ startAt: '2030-09-04T11:59:59.999Z' }, 'futuro'], [{ garageId: 'missing' }, 'Garagem não encontrada'],
    [{ endAt: '2030-09-04T13:00:00Z' }, 'depois da entrada'], [{ endAt: '2030-09-04T17:00:00Z' }, 'duração deve corresponder'],
  ] as [Partial<BookingInput>, string][])('rejects invalid booking %j', (overrides, error) => { expect(() => book(initial(), 'one', overrides)).toThrow(error); });
  it('accepts Mercosul plates with an exact present start and zero past tolerance', () => {
    expect(book(initial(), 'one', { plate: 'Abc1d23', startAt: now }).bookings[0]?.plate).toBe('ABC1D23');
    expect(() => book(initial(), 'one', { startAt: '2030-09-04T11:58:00Z' })).toThrow('futuro');
  });
  it('rejects paused, unauthorized, incompatible-vehicle or owner-mode reservations', () => {
    const paused = transition(owner(initial()), { type: 'toggleGarage', id: 'boa-viagem' });
    expect(() => book({ ...paused, role: 'driver' })).toThrow('pausada');
    const denied = initial(); denied.garages[0]!.authorized = false;
    expect(() => book(denied)).toThrow('autorização');
    expect(() => book(initial(), 'one', { garageId: 'gracas' })).toThrow('tipo de veículo');
    expect(() => book(owner(initial()))).toThrow('Motorista');
  });
});

describe('Recife availability', () => {
  const timed = { ...garageInput, availability: { days: [3], opens: '08:00', closes: '18:00' } } as Garage;
  it('uses Recife UTC−3 and accepts exact opening and closing boundaries', () => {
    expect(isWithinAvailability(timed, '2030-09-04T11:00:00Z', '2030-09-04T21:00:00Z')).toBe(true);
    expect(isWithinAvailability(timed, '2030-09-04T10:59:59Z', '2030-09-04T21:00:00Z')).toBe(false);
    expect(isWithinAvailability(timed, '2030-09-04T11:00:00Z', '2030-09-04T21:00:01Z')).toBe(false);
    expect(isWithinAvailability(timed, '2030-09-05T11:00:00Z', '2030-09-05T12:00:00Z')).toBe(false);
  });
  it('checks every touched day and handles a 24h reservation across midnight', () => {
    const allDayWednesday = { ...timed, availability: { days: [3], opens: '00:00', closes: '24:00' } };
    expect(isWithinAvailability(allDayWednesday, '2030-09-04T03:00:00Z', '2030-09-05T03:00:00Z')).toBe(true);
    expect(isWithinAvailability(allDayWednesday, '2030-09-04T04:00:00Z', '2030-09-05T04:00:00Z')).toBe(false);
    expect(isWithinAvailability(initial().garages[0]!, '2030-09-04T14:00:00Z', '2030-09-05T14:00:00Z')).toBe(true);
    expect(isWithinAvailability(timed, 'invalid', startAt)).toBe(false);
  });
  it('blocks reservation outside listed hours at the mutation boundary', () => {
    const state = initial(); state.garages[0]!.availability = timed.availability;
    expect(() => book(state, 'one', { startAt: '2030-09-04T20:30:00Z' })).toThrow('fora dos dias');
  });
});

describe('reservation lifecycle and authorization', () => {
  it('allows check-in 30 minutes before, then check-out, and rejects backwards transitions', () => {
    const state = book(initial());
    expect(() => transition(state, { type: 'bookingStatus', id: 'reservation-1', status: 'completed', now })).toThrow('status');
    expect(() => transition(state, { type: 'bookingStatus', id: 'reservation-1', status: 'active', now: '2030-09-04T13:29:59Z' })).toThrow('30 minutos');
    const active = transition(state, { type: 'bookingStatus', id: 'reservation-1', status: 'active', now: '2030-09-04T13:30:00Z' });
    const completed = transition(active, { type: 'bookingStatus', id: 'reservation-1', status: 'completed', now: startAt });
    expect(completed.bookings[0]?.status).toBe('completed');
    expect(availableSpaces(completed.garages[0]!, completed.bookings, startAt, '2030-09-04T16:00:00Z')).toBe(1);
    expect(() => transition(completed, { type: 'bookingStatus', id: 'reservation-1', status: 'active', now: startAt })).toThrow('status');
  });
  it('disallows expired check-in, active cancellation, and cancellation starting exactly now', () => {
    const state = book(initial());
    expect(() => transition(state, { type: 'bookingStatus', id: 'reservation-1', status: 'active', now: '2030-09-04T16:00:00Z' })).toThrow('terminou');
    expect(() => transition(state, { type: 'bookingStatus', id: 'reservation-1', status: 'cancelled', now: startAt })).toThrow('futura');
    const active = transition(state, { type: 'bookingStatus', id: 'reservation-1', status: 'active', now: startAt });
    expect(() => transition(active, { type: 'bookingStatus', id: 'reservation-1', status: 'cancelled', now: startAt })).toThrow('status');
  });
  it('prevents acting on a different driver or owner booking and preserves state on errors', () => {
    const state = book(initial()); state.bookings[0]!.driverId = 'other';
    const snapshot = JSON.stringify(state);
    expect(() => transition(state, { type: 'bookingStatus', id: 'reservation-1', status: 'active', now: startAt })).toThrow('seu perfil');
    expect(() => transition(state, { type: 'bookingStatus', id: 'unknown', status: 'active', now })).toThrow('não encontrada');
    expect(JSON.stringify(state)).toBe(snapshot);
    expect(transition(owner(state), { type: 'bookingStatus', id: 'reservation-1', status: 'active', now: startAt }).bookings[0]?.status).toBe('active');
    expect(() => transition(owner(state), { type: 'bookingStatus', id: 'reservation-1', status: 'cancelled', now })).toThrow('Somente o motorista');
    const remote = book(initial(), 'remote', { garageId: 'recife-antigo' });
    expect(() => transition(owner(remote), { type: 'bookingStatus', id: 'remote', status: 'active', now: startAt })).toThrow('seu perfil');
  });
});

describe('owner listing validation and protected reservations', () => {
  it('normalizes fields, publishes privately authorized input and snapshots independent arrays', () => {
    expect(validateGarage({ ...garageInput, name: ' Minha garagem ', amenities: ['covered', 'covered'] })).toMatchObject({ name: 'Minha garagem', amenities: ['covered'] });
    const state = transition(owner(initial()), { type: 'saveGarage', id: 'new-garage', input: garageInput });
    expect(state.garages.at(-1)).toMatchObject({ ownerId: 'local', active: true, rating: 0, reviews: 0, authorized: true });
  });
  it('does not accept identity or ownership fields smuggled into a listing draft', () => {
    const draft = { ...garageInput, id: 'different', ownerId: 'other', active: false, rating: 5 };
    const state = transition(owner(initial()), { type: 'saveGarage', id: 'boa-viagem', input: draft });
    expect(state.garages[0]).toMatchObject({ id: 'boa-viagem', ownerId: 'local', active: true, rating: 4.9 });
    expect(validateGarage(draft)).not.toHaveProperty('ownerId');
  });
  it('accepts five local photos and rejects a sixth in new or edited listings', () => {
    const photos = Array.from({ length: 5 }, (_, index) => `file:///documents/photo-${index}.jpg`);
    expect(validateGarage({ ...garageInput, photos }).photos).toEqual(photos);
    expect(() => validateGarage({ ...garageInput, photos: [...photos, 'file:///documents/photo-6.jpg'] })).toThrow('até 5');
  });
  it.each([
    [{ capacity: 1.5 }, 'capacidade'], [{ pricePerHour: 50 }, 'preço'], [{ address: '' }, 'endereço'], [{ description: 'curta' }, 'descrição'], [{ authorized: false }, 'autorização'],
    [{ spaceType: 'street' }, 'privadas'], [{ width: 0 }, 'largura'], [{ vehicleTypes: [] }, 'veículo'], [{ latitude: NaN }, 'localização'],
    [{ photos: ['https://example.com/photo.jpg'] }, 'fotografias'], [{ availability: { days: [], opens: '08:00', closes: '18:00' } }, 'dia disponível'],
    [{ availability: { days: [1], opens: '18:00', closes: '08:00' } }, 'horários disponíveis'], [{ rules: '' }, 'regras'], [{ accessInstructions: '' }, 'instruções'],
  ] as [Partial<GarageInput>, string][])('rejects invalid listing %j', (overrides, error) => { expect(() => validateGarage({ ...garageInput, ...overrides })).toThrow(error); });
  it('prevents editing or toggling a listing outside the current owner', () => {
    expect(() => transition(owner(initial()), { type: 'saveGarage', id: 'recife-antigo', input: garageInput })).toThrow('suas garagens');
    expect(() => transition(owner(initial()), { type: 'toggleGarage', id: 'recife-antigo' })).toThrow('suas garagens');
    expect(() => transition(initial(), { type: 'saveGarage', id: 'new', input: garageInput })).toThrow('Proprietário');
  });
  it('preserves reservations on pause and blocks capacity, schedule and vehicle edits invalidating future stays', () => {
    const state = book(book(initial(2), 'one'), 'two');
    expect(transition(owner(state), { type: 'toggleGarage', id: 'boa-viagem' }).bookings).toEqual(state.bookings);
    expect(() => transition(owner(state), { type: 'saveGarage', id: 'boa-viagem', input: { ...garageInput, capacity: 1 } })).toThrow('reservas já confirmadas');
    expect(() => transition(owner(state), { type: 'saveGarage', id: 'boa-viagem', input: { ...garageInput, availability: { days: [1], opens: '00:00', closes: '24:00' } } })).toThrow('dias e horários');
    expect(() => transition(owner(state), { type: 'saveGarage', id: 'boa-viagem', input: { ...garageInput, vehicleTypes: ['motorcycle'] } })).toThrow('tipos de veículo');
    const cancelled = transition(state, { type: 'bookingStatus', id: 'two', status: 'cancelled', now });
    expect(transition(owner(cancelled), { type: 'saveGarage', id: 'boa-viagem', input: { ...garageInput, capacity: 1 } }).garages[0]?.capacity).toBe(1);
  });
});

describe('actual search filters and coordinates', () => {
  it('searches accents, multiple terms, neighborhood, region, name and public landmark', () => {
    expect(filtered({ query: 'varzea' }).map((garage) => garage.id)).toEqual(['varzea']);
    expect(filtered({ query: 'zona norte' })).toHaveLength(2);
    expect(filtered({ query: 'marco zero' })[0]?.id).toBe('recife-antigo');
    expect(filtered({ query: 'garagem boa' })[0]?.id).toBe('boa-viagem');
    expect(filtered({ query: 'lugar inexistente' })).toEqual([]);
    expect(filtered({ query: 'Rua Fictícia da Demonstração' })).toEqual([]);
  });
  it('changes results with maximum price, daily billing, rating, cover, gate and accepted vehicle', () => {
    expect(filtered({ maxPrice: 600 }).map((garage) => garage.id).sort()).toEqual(['gracas', 'varzea']);
    expect(filtered({ billingMode: 'day', maxPrice: 5000 }).map((garage) => garage.id).sort()).toEqual(['gracas', 'recife-antigo']);
    expect(filtered({ covered: true, gate: true, vehicleType: 'car', minRating: 4.8 }).map((garage) => garage.id).sort()).toEqual(['boa-viagem', 'madalena']);
    expect(filtered({ vehicleType: 'motorcycle' }).every((garage) => garage.vehicleTypes.includes('motorcycle'))).toBe(true);
  });
  it('calculates haversine distance, filters radius and sorts without mutating input', () => {
    expect(distanceKm({ latitude: 0, longitude: 0 }, { latitude: 0, longitude: 1 })).toBeCloseTo(111.195, 2);
    expect(distanceKm({ latitude: 0, longitude: 0 }, { latitude: 0, longitude: 0 })).toBe(0);
    expect(filtered({ maxDistanceKm: 1 }).map((garage) => garage.id)).toEqual(['boa-viagem']);
    expect(filtered({ sort: 'distance' })[0]?.id).toBe('boa-viagem');
    expect(filtered({ sort: 'price' })[0]?.id).toBe('gracas');
    expect(filtered({ sort: 'rating' })[0]?.rating).toBe(4.9);
    const state = initial(); const ids = state.garages.map((garage) => garage.id);
    filtered({ sort: 'price' }, state); expect(state.garages.map((garage) => garage.id)).toEqual(ids);
  });
  it('immediate availability respects opening hours, daily duration, capacity and pause', () => {
    const state = book(initial(), 'full-now', { startAt: now });
    expect(filtered({ immediate: true }, state).map((garage) => garage.id)).not.toContain('boa-viagem');
    state.garages[1]!.active = false;
    expect(filtered({}, state).map((garage) => garage.id)).not.toContain('recife-antigo');
    const late = filterGarages({ ...initial(), filters: { ...defaultFilters(), immediate: true } }, new Date('2030-09-04T03:00:00Z'));
    expect(late.map((garage) => garage.id)).not.toContain('ilha-do-leite');
    expect(filtered({ billingMode: 'day', immediate: true }).every((garage) => garage.availability.opens === '00:00')).toBe(true);
  });
  it('today finds a later slot at an exact checkout boundary and differs from immediate', () => {
    const state = book(initial(), 'busy-now', { startAt: now, hours: 1.123 });
    expect(filtered({ immediate: true }, state).map((garage) => garage.id)).not.toContain('boa-viagem');
    expect(filtered({ today: true }, state).map((garage) => garage.id)).toContain('boa-viagem');
    state.garages[0]!.availability = { days: [3], opens: '09:00', closes: '11:08' };
    expect(filtered({ today: true }, state).map((garage) => garage.id)).toContain('boa-viagem');
    state.garages[0]!.availability.closes = '11:07';
    expect(filtered({ today: true }, state).map((garage) => garage.id)).not.toContain('boa-viagem');
  });
  it('today considers later opening, rejects closed days and respects Recife midnight', () => {
    const state = initial();
    state.garages[0]!.availability = { days: [3], opens: '14:00', closes: '18:00' };
    expect(filtered({ today: true }, state).map((garage) => garage.id)).toContain('boa-viagem');
    state.garages[0]!.availability.days = [4];
    expect(filtered({ today: true }, state).map((garage) => garage.id)).not.toContain('boa-viagem');
    state.garages[0]!.availability.days = [3];
    const late = { ...state, filters: { ...defaultFilters(), today: true } };
    expect(filterGarages(late, new Date('2030-09-05T00:30:00Z')).map((garage) => garage.id)).not.toContain('boa-viagem');
  });
  it('today plus daily billing allows checkout tomorrow if the full 24h stay fits', () => {
    expect(filtered({ today: true, billingMode: 'day' }).map((garage) => garage.id)).toContain('boa-viagem');
    const state = book(initial(), 'busy-full-day', { startAt: now, hours: 16 });
    expect(filtered({ today: true }, state).map((garage) => garage.id)).not.toContain('boa-viagem');
  });
});

describe('profiles, vehicles, reviews and reset', () => {
  it('validates optional contact and vehicle fields and preserves separate role profiles', () => {
    expect(() => transition(createInitialState(), { type: 'onboard', name: ' ', role: 'driver' })).toThrow('nome');
    const state = initial();
    const profile = { ...state.profile, email: ' MARIA@EXEMPLO.COM ', phone: '(81) 99999-1234', plate: 'abc1d23', vehicle: ' Onix ' };
    expect(transition(state, { type: 'profile', profile }).profile).toMatchObject({ email: 'maria@exemplo.com', phone: '81999991234', plate: 'ABC1D23', vehicle: 'Onix' });
    expect(() => transition(state, { type: 'profile', profile: { ...profile, email: 'invalid' } })).toThrow('e-mail');
    expect(() => transition(state, { type: 'profile', profile: { ...profile, phone: '123' } })).toThrow('telefone');
    const updated = transition(owner(state), { type: 'profile', profile: { ...state.ownerProfile, name: 'Pat · demo' } });
    expect(updated.profile).toEqual(state.profile); expect(updated.ownerProfile.name).toBe('Pat · demo');
    expect(updated.garages[0]?.ownerName).toBe('Pat · demo');
  });
  it('saves, edits and removes vehicles without altering historical bookings', () => {
    const state = book(initial());
    const vehicle = { id: 'new', label: 'Moto azul', plate: 'abc-1234', type: 'motorcycle' as const };
    const saved = transition(state, { type: 'saveVehicle', vehicle });
    expect(saved.vehicles.at(-1)?.plate).toBe('ABC1234');
    expect(() => transition(saved, { type: 'saveVehicle', vehicle: { ...vehicle, id: 'duplicate' } })).toThrow('placa já');
    const deleted = transition(saved, { type: 'deleteVehicle', id: 'new' });
    expect(deleted.vehicles).toHaveLength(2); expect(deleted.bookings).toEqual(state.bookings);
  });
  it('allows each authorized party one 1–5 review of a completed reservation', () => {
    const state = createInitialState();
    const review = { id: 'review-one', bookingId: 'demo-completed', authorRole: 'driver' as const, score: 5, comment: ' Muito prático! ' };
    const reviewed = transition(state, { type: 'review', review });
    expect(reviewed.reviews[0]?.comment).toBe('Muito prático!');
    expect(reviewed.garages[0]?.reviews).toBe(state.garages[0]!.reviews + 1);
    expect(() => transition(reviewed, { type: 'review', review })).toThrow('já avaliou');
    expect(() => transition(state, { type: 'review', review: { ...review, score: 0 } })).toThrow('1 a 5');
    expect(() => transition(state, { type: 'review', review: { ...review, bookingId: 'demo-active' } })).toThrow('concluídas');
    expect(() => transition(state, { type: 'review', review: { ...review, authorRole: 'owner' } })).toThrow('perfil atual');
    const both = transition(owner(reviewed), { type: 'review', review: { ...review, id: 'owner-review', authorRole: 'owner' } });
    expect(both.reviews).toHaveLength(2); expect(both.garages).toEqual(reviewed.garages);
    const foreign = { ...state, bookings: state.bookings.map((booking) => ({ ...booking, driverId: 'other' })) };
    expect(() => transition(foreign, { type: 'review', review })).toThrow('perfil atual');
  });
  it('persists filters and preferences, toggles favorites, switches roles and fully resets demo state', () => {
    const state = book(initial());
    const favorite = transition(state, { type: 'favorite', garageId: 'boa-viagem' });
    expect(favorite.favorites).toEqual(['boa-viagem']);
    expect(transition(favorite, { type: 'favorite', garageId: 'boa-viagem' }).favorites).toEqual([]);
    expect(owner(favorite).bookings).toEqual(state.bookings);
    const filters = { ...defaultFilters(), query: 'Recife', covered: true };
    expect(transition(state, { type: 'filters', filters }).filters).toEqual(filters);
    expect(() => transition(state, { type: 'filters', filters: { ...filters, minRating: 6 } })).toThrow('avaliação');
    const preferences = { view: 'map' as const, location: { latitude: -8.05, longitude: -34.9, label: 'Centro' } };
    expect(transition(state, { type: 'preferences', preferences }).preferences).toEqual(preferences);
    expect(transition(favorite, { type: 'reset' })).toEqual(createInitialState());
  });
});
