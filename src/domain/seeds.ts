import type { AppState, Booking, BookingStatus, Garage } from './types';
import { defaultFilters } from './filters';
import { calculatePrice, generateBookingCode } from './pricing';
import { HOUR_MS } from './validation';

/** People, vehicles and addresses are fictitious. Landmarks locate the demonstration. */
export function createDemoGarages(): Garage[] {
  const shared: Garage = {
    id: '', ownerId: 'demo', ownerName: '', name: '', neighborhood: '', address: '', approximateAddress: '', complement: 'Espaço fictício para demonstração', landmark: '',
    description: 'Espaço privado de demonstração. Entrada prática, ambiente iluminado e localização aproximada.',
    active: true, authorized: true, photos: [], pricePerHour: 1000, pricePerDay: null, capacity: 3, amenities: ['lighting'], latitude: -8.05, longitude: -34.9, rating: 4.8, reviews: 12,
    theme: 'mint', spaceType: 'garage', width: 2.6, length: 5.2, vehicleTypes: ['car', 'motorcycle'], availability: { days: [0, 1, 2, 3, 4, 5, 6], opens: '00:00', closes: '24:00' },
    rules: 'Estacione dentro da demarcação. Não deixe objetos de valor. Respeite o horário reservado.',
    accessInstructions: 'Acesso demonstrativo: apresente o código GPE no portão e utilize a vaga sinalizada. Não se dirija a um endereço real.',
  };
  const entries: Partial<Garage>[] = [
    { id: 'boa-viagem', ownerId: 'local', ownerName: 'Cris · demonstração', name: 'Garagem Boa Viagem', neighborhood: 'Boa Viagem', landmark: 'Praça de Boa Viagem', approximateAddress: 'Região da Praça de Boa Viagem · Recife', pricePerHour: 1200, pricePerDay: 6500, amenities: ['covered', 'camera', 'gate', 'lighting', 'attendant'], latitude: -8.1238, longitude: -34.9001, rating: 4.9, reviews: 28 },
    { id: 'recife-antigo', ownerName: 'Lia · demonstração', name: 'Pátio do Recife Antigo', neighborhood: 'Recife Antigo', landmark: 'Marco Zero e Rua do Bom Jesus', approximateAddress: 'Região do Marco Zero · Centro do Recife', pricePerHour: 800, pricePerDay: 4500, capacity: 6, amenities: ['camera', 'accessible', 'lighting'], latitude: -8.0614, longitude: -34.8712, rating: 4.8, reviews: 42, theme: 'sand', spaceType: 'private_lot', width: 3.2, length: 5.5 },
    { id: 'ilha-do-leite', ownerName: 'Bia · demonstração', name: 'Vaga Jardim da Ilha', neighborhood: 'Ilha do Leite', landmark: 'Polo médico da Ilha do Leite', approximateAddress: 'Região do polo médico · Centro do Recife', pricePerHour: 1400, capacity: 2, amenities: ['covered', 'gate', 'lighting'], latitude: -8.0667, longitude: -34.8976, rating: 4.7, reviews: 19, theme: 'blue', vehicleTypes: ['car'], availability: { days: [1, 2, 3, 4, 5], opens: '06:00', closes: '22:00' } },
    { id: 'derby', ownerName: 'Dani · demonstração', name: 'Quintal do Derby', neighborhood: 'Derby', landmark: 'Praça do Derby', approximateAddress: 'Região da Praça do Derby · Centro do Recife', pricePerHour: 900, capacity: 2, amenities: ['lighting', 'attendant'], latitude: -8.0551, longitude: -34.9012, rating: 4.5, reviews: 12, spaceType: 'driveway', availability: { days: [1, 2, 3, 4, 5, 6], opens: '07:00', closes: '20:00' } },
    { id: 'madalena', ownerName: 'Rui · demonstração', name: 'Garagem Vila Madalena', neighborhood: 'Madalena', landmark: 'Mercado da Madalena', approximateAddress: 'Região do Mercado da Madalena · Zona Oeste', pricePerHour: 1000, pricePerDay: 5500, amenities: ['covered', 'electric', 'gate', 'lighting'], latitude: -8.0512, longitude: -34.9127, rating: 4.8, reviews: 24, theme: 'sand', vehicleTypes: ['car'] },
    { id: 'casa-forte', ownerName: 'Téo · demonstração', name: 'Pátio das Flores', neighborhood: 'Casa Forte', landmark: 'Praça de Casa Forte', approximateAddress: 'Região da Praça de Casa Forte · Zona Norte', pricePerHour: 1100, pricePerDay: 6000, capacity: 4, amenities: ['camera', 'accessible', 'attendant', 'lighting'], latitude: -8.0335, longitude: -34.9193, rating: 4.9, reviews: 31, spaceType: 'private_lot', width: 3.1, length: 5.5 },
    { id: 'gracas', ownerName: 'Lu · demonstração', name: 'Abrigo das Graças', neighborhood: 'Graças', landmark: 'Parque da Jaqueira', approximateAddress: 'Região do Parque da Jaqueira · Zona Norte', description: 'Pequeno abrigo privado e coberto exclusivo para motocicletas, com portão eletrônico. Espaço fictício.', pricePerHour: 500, pricePerDay: 2500, capacity: 5, amenities: ['covered', 'gate', 'lighting'], latitude: -8.0416, longitude: -34.9008, rating: 4.6, reviews: 15, theme: 'blue', width: 1.4, length: 2.6, vehicleTypes: ['motorcycle'] },
    { id: 'varzea', ownerName: 'Nina · demonstração', name: 'Quintal Universitário', neighborhood: 'Várzea', landmark: 'Universidade Federal de Pernambuco e Praça da Várzea', approximateAddress: 'Região da UFPE · Zona Oeste', pricePerHour: 600, capacity: 4, amenities: ['lighting', 'accessible'], latitude: -8.0471, longitude: -34.9506, rating: 4.4, reviews: 9, theme: 'sand', spaceType: 'driveway', availability: { days: [1, 2, 3, 4, 5], opens: '06:00', closes: '23:00' } },
  ];
  return entries.map((entry, index) => {
    const garage = { ...shared, ...entry };
    return { ...garage, address: `Rua Fictícia da Demonstração, ${(index + 1) * 10} · ${garage.neighborhood}, Recife – PE (fictício)`, amenities: [...garage.amenities], vehicleTypes: [...garage.vehicleTypes], photos: [], availability: { ...garage.availability, days: [...garage.availability.days] } };
  });
}
export function createInitialState(now: Date = new Date()): AppState {
  const garages = createDemoGarages();
  const anchor = Math.floor(now.getTime() / 60_000) * 60_000;
  const bookings: Booking[] = [];
  const add = (id: string, garageIndex: number, offsetHours: number, hours: number, status: BookingStatus, driverId: string) => {
    const garage = garages[garageIndex]!;
    const start = anchor + offsetHours * HOUR_MS;
    bookings.push({ id, garageId: garage.id, garageName: garage.name, address: garage.address, accessInstructions: garage.accessInstructions, driverId, driverName: driverId === 'local' ? 'Ana · demonstração' : 'Alex · demonstração', plate: driverId === 'local' ? 'GPE1A23' : 'DEM4B56', vehicle: driverId === 'local' ? 'Compacto branco · fictício' : 'Sedã azul · fictício', vehicleType: 'car', startAt: new Date(start).toISOString(), endAt: new Date(start + hours * HOUR_MS).toISOString(), ...calculatePrice(garage, hours, 'hour'), pricePerHour: garage.pricePerHour, pricePerDay: garage.pricePerDay, billingMode: 'hour', paymentMethod: 'pix', status, code: generateBookingCode(id, bookings.map((booking) => booking.code)), createdAt: new Date(Math.min(anchor, start) - 24 * HOUR_MS).toISOString() });
  };
  add('demo-upcoming-driver', 1, 26, 2, 'confirmed', 'local');
  add('demo-upcoming-owner', 0, 28, 3, 'confirmed', 'demo-driver');
  add('demo-active', 0, -0.5, 2, 'active', 'local');
  add('demo-completed', 0, -48, 2, 'completed', 'local');
  add('demo-cancelled', 5, -24, 1, 'cancelled', 'local');
  return {
    version: 2, onboarded: false, role: 'driver',
    profile: { name: 'Ana · demonstração', email: '', phone: '', plate: 'GPE1A23', vehicle: 'Compacto branco · fictício' },
    ownerProfile: { name: 'Cris · demonstração', email: '', phone: '', plate: '', vehicle: '' },
    garages, bookings, favorites: [], reviews: [],
    vehicles: [{ id: 'demo-car', label: 'Compacto branco · fictício', plate: 'GPE1A23', type: 'car' }, { id: 'demo-motorcycle', label: 'Moto vermelha · fictícia', plate: 'GPE4B56', type: 'motorcycle' }],
    filters: defaultFilters(), preferences: { view: 'map', location: { latitude: -8.1238, longitude: -34.9001, label: 'Boa Viagem, Recife' } },
  };
}
