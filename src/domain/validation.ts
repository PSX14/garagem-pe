import type { Amenity, Availability, GarageInput, Preferences, Profile, Role, SearchFilters, Vehicle } from './types';

export const HOUR_MS = 3_600_000;
export const AMENITIES: Amenity[] = ['covered', 'camera', 'accessible', 'electric', 'gate', 'lighting', 'attendant'];
export function requireCondition(condition: unknown, message: string): asserts condition {
  if (!condition) throw new Error(message);
}
export function dateValue(value: string): number {
  const timestamp = typeof value === 'string' && value.trim() ? Date.parse(value) : NaN;
  requireCondition(Number.isFinite(timestamp), 'Informe uma data e um horário válidos.');
  return timestamp;
}
export function normalizePlate(value: string): string {
  const plate = value.trim().toUpperCase().replace(/[\s-]/g, '');
  requireCondition(/^[A-Z]{3}(?:\d{4}|\d[A-Z]\d{2})$/.test(plate), 'Informe uma placa válida, como ABC1234 ou ABC1D23.');
  return plate;
}
export function validateRole(role: Role): void {
  requireCondition(role === 'driver' || role === 'owner', 'Escolha um perfil válido.');
}
export function validateName(name: string): string {
  const cleaned = name.trim().replace(/\s+/g, ' ');
  requireCondition(cleaned.length >= 2 && cleaned.length <= 80, 'Informe seu nome com 2 a 80 caracteres.');
  return cleaned;
}
export function validatedProfile(profile: Profile): Profile {
  const name = validateName(profile.name);
  const email = profile.email.trim().toLowerCase();
  const phone = profile.phone.replace(/\D/g, '');
  const vehicle = profile.vehicle.trim();
  requireCondition(!email || (email.length <= 254 && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)), 'Informe um e-mail válido.');
  requireCondition(!phone || /^(?:55)?\d{10,11}$/.test(phone), 'Informe um telefone com DDD válido.');
  requireCondition(vehicle.length <= 80, 'A descrição do veículo deve ter até 80 caracteres.');
  return { name, email, phone, plate: profile.plate.trim() ? normalizePlate(profile.plate) : '', vehicle };
}
export function validateVehicle(vehicle: Vehicle): Vehicle {
  requireCondition(vehicle.id.trim().length > 0, 'Não foi possível identificar o veículo.');
  const label = vehicle.label.trim();
  requireCondition(label.length >= 2 && label.length <= 80, 'Informe o veículo com 2 a 80 caracteres.');
  requireCondition(vehicle.type === 'car' || vehicle.type === 'motorcycle', 'Escolha um tipo de veículo válido.');
  return { ...vehicle, label, plate: normalizePlate(vehicle.plate) };
}
export function timeMinutes(time: string): number {
  if (time === '24:00') return 1440;
  if (!/^([01]\d|2[0-3]):[0-5]\d$/.test(time)) return NaN;
  return Number(time.slice(0, 2)) * 60 + Number(time.slice(3));
}
export function validateAvailability(availability: Availability): Availability {
  requireCondition(Array.isArray(availability.days) && availability.days.length > 0 && availability.days.every((day) => Number.isInteger(day) && day >= 0 && day <= 6), 'Escolha pelo menos um dia disponível válido.');
  const opens = timeMinutes(availability.opens);
  const closes = timeMinutes(availability.closes);
  requireCondition(Number.isFinite(opens) && opens < 1440 && Number.isFinite(closes) && closes > opens, 'Informe horários disponíveis válidos: o horário final deve ser posterior ao inicial. Use 00:00–24:00 para o dia completo.');
  return { ...availability, days: [...new Set(availability.days)].sort((a, b) => a - b) };
}
export function validateCoordinates(coordinates: { latitude: number; longitude: number }): void {
  requireCondition(Number.isFinite(coordinates.latitude) && Math.abs(coordinates.latitude) <= 90 && Number.isFinite(coordinates.longitude) && Math.abs(coordinates.longitude) <= 180, 'Informe uma localização aproximada válida.');
}
export function validateGarage(input: GarageInput): GarageInput {
  const name = input.name.trim();
  const neighborhood = input.neighborhood.trim();
  const address = input.address.trim();
  const description = input.description.trim();
  requireCondition(name.length >= 3 && name.length <= 80, 'O nome da garagem deve ter 3 a 80 caracteres.');
  requireCondition(neighborhood.length >= 2 && neighborhood.length <= 80, 'Informe o bairro com 2 a 80 caracteres.');
  requireCondition(address.length >= 5 && address.length <= 180, 'Informe um endereço completo com 5 a 180 caracteres.');
  requireCondition(description.length >= 10 && description.length <= 600, 'A descrição deve ter 10 a 600 caracteres.');
  requireCondition(Number.isSafeInteger(input.pricePerHour) && input.pricePerHour >= 100 && input.pricePerHour <= 100000, 'O preço por hora deve ficar entre R$ 1,00 e R$ 1.000,00.');
  requireCondition(input.pricePerDay === null || (Number.isSafeInteger(input.pricePerDay) && input.pricePerDay >= 100 && input.pricePerDay <= 2_400_000), 'O preço por diária deve ficar entre R$ 1,00 e R$ 24.000,00.');
  requireCondition(Number.isInteger(input.capacity) && input.capacity >= 1 && input.capacity <= 100, 'Informe uma capacidade entre 1 e 100 vagas.');
  requireCondition(Array.isArray(input.amenities) && input.amenities.every((amenity) => AMENITIES.includes(amenity)), 'Escolha comodidades válidas.');
  requireCondition(['garage', 'driveway', 'private_lot'].includes(input.spaceType), 'Somente vagas privadas podem ser publicadas. Vagas públicas na rua não são permitidas.');
  requireCondition(input.authorized === true, 'Confirme que é responsável pela vaga e possui autorização para disponibilizá-la.');
  requireCondition(Number.isFinite(input.width) && input.width >= 1 && input.width <= 30 && Number.isFinite(input.length) && input.length >= 1 && input.length <= 50, 'Informe largura e comprimento válidos em metros.');
  requireCondition(Array.isArray(input.vehicleTypes) && input.vehicleTypes.length > 0 && input.vehicleTypes.every((type) => type === 'car' || type === 'motorcycle'), 'Escolha pelo menos um tipo de veículo aceito.');
  requireCondition(Array.isArray(input.photos) && input.photos.length <= 5 && input.photos.every((uri) => typeof uri === 'string' && uri.startsWith('file:///')), 'Selecione até 5 fotografias armazenadas neste aparelho.');
  const approximateAddress = input.approximateAddress.trim();
  const complement = input.complement.trim();
  const landmark = input.landmark.trim();
  const rules = input.rules.trim();
  const accessInstructions = input.accessInstructions.trim();
  requireCondition(approximateAddress.length >= 3 && approximateAddress.length <= 180, 'Informe uma localização aproximada com 3 a 180 caracteres.');
  requireCondition(complement.length <= 180 && landmark.length >= 2 && landmark.length <= 180, 'Informe um ponto de referência com 2 a 180 caracteres e complemento de até 180 caracteres.');
  requireCondition(rules.length >= 5 && rules.length <= 1000, 'Informe regras de utilização com 5 a 1.000 caracteres.');
  requireCondition(accessInstructions.length >= 5 && accessInstructions.length <= 1000, 'Informe instruções de acesso com 5 a 1.000 caracteres.');
  validateCoordinates(input);
  return { name, neighborhood, address, description, approximateAddress, complement, landmark, rules, accessInstructions,
    pricePerHour: input.pricePerHour, pricePerDay: input.pricePerDay, capacity: input.capacity, latitude: input.latitude, longitude: input.longitude,
    spaceType: input.spaceType, width: input.width, length: input.length, authorized: true,
    amenities: [...new Set(input.amenities)], vehicleTypes: [...new Set(input.vehicleTypes)], photos: [...new Set(input.photos)], availability: validateAvailability(input.availability) };
}
export function validateFilters(filters: SearchFilters): SearchFilters {
  requireCondition(typeof filters.query === 'string' && filters.query.length <= 180, 'A pesquisa deve ter até 180 caracteres.');
  requireCondition(filters.maxPrice === null || (Number.isSafeInteger(filters.maxPrice) && filters.maxPrice >= 0), 'Informe um preço máximo válido.');
  requireCondition(filters.maxDistanceKm === null || (Number.isFinite(filters.maxDistanceKm) && filters.maxDistanceKm > 0), 'Informe uma distância máxima válida.');
  requireCondition(['covered', 'gate', 'immediate'].every((key) => typeof filters[key as 'covered' | 'gate' | 'immediate'] === 'boolean'), 'Escolha filtros válidos.');
  requireCondition(filters.today === undefined || typeof filters.today === 'boolean', 'Escolha um filtro de entrada hoje válido.');
  requireCondition(['car', 'motorcycle', 'all'].includes(filters.vehicleType) && ['hour', 'day', 'all'].includes(filters.billingMode), 'Escolha tipo de veículo e período válidos.');
  requireCondition(Number.isFinite(filters.minRating) && filters.minRating >= 0 && filters.minRating <= 5 && ['rating', 'price', 'distance'].includes(filters.sort), 'Escolha uma avaliação e ordenação válidas.');
  return { ...filters, query: filters.query.trim() };
}
export function validatePreferences(preferences: Preferences): Preferences {
  requireCondition(preferences.view === 'map' || preferences.view === 'list', 'Escolha uma visualização válida.');
  validateCoordinates(preferences.location);
  requireCondition(typeof preferences.location.label === 'string' && preferences.location.label.trim().length >= 2 && preferences.location.label.length <= 180, 'Informe uma localização selecionada válida.');
  return { view: preferences.view, location: { ...preferences.location, label: preferences.location.label.trim() } };
}
