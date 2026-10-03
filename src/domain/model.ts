import type { Action, Amenity, AppState, Booking, BookingStatus, Garage } from './types';
import { availableSpaces, isWithinAvailability, peakOccupancy } from './availability';
import { calculatePrice, generateBookingCode } from './pricing';
import { createInitialState } from './seeds';
import { dateValue, HOUR_MS, normalizePlate, requireCondition, validateFilters, validateGarage, validateName, validatePreferences, validatedProfile, validateRole, validateVehicle } from './validation';

export { availableSpaces, isWithinAvailability } from './availability';
export { defaultFilters, distanceKm, filterGarages } from './filters';
export { calculatePrice, generateBookingCode, money, quote } from './pricing';
export { createInitialState } from './seeds';
export { validateGarage } from './validation';
export const statusLabels: Record<BookingStatus, string> = { confirmed: 'Confirmada', active: 'Em andamento', completed: 'Concluída', cancelled: 'Cancelada' };
export const amenityLabels: Record<Amenity, string> = { covered: 'Coberta', camera: 'Câmeras', accessible: 'Acessível', electric: 'Recarga elétrica', gate: 'Portão eletrônico', lighting: 'Iluminação', attendant: 'Responsável no local' };

function canManageBooking(state: AppState, booking: Booking): boolean {
  return state.role === 'driver' ? booking.driverId === 'local' : state.garages.some((garage) => garage.id === booking.garageId && garage.ownerId === 'local');
}
export function transition(state: AppState, action: Action): AppState {
  switch (action.type) {
    case 'onboard': {
      validateRole(action.role);
      const name = validateName(action.name);
      const field = action.role === 'driver' ? 'profile' : 'ownerProfile';
      return { ...state, onboarded: true, role: action.role, [field]: { ...state[field], name }, garages: action.role === 'owner' ? state.garages.map((garage) => garage.ownerId === 'local' ? { ...garage, ownerName: name } : garage) : state.garages };
    }
    case 'role': validateRole(action.role); return { ...state, role: action.role };
    case 'profile': {
      const profile = validatedProfile(action.profile);
      return state.role === 'driver' ? { ...state, profile } : { ...state, ownerProfile: profile, garages: state.garages.map((garage) => garage.ownerId === 'local' ? { ...garage, ownerName: profile.name } : garage) };
    }
    case 'favorite':
      requireCondition(state.garages.some((garage) => garage.id === action.garageId), 'Garagem não encontrada.');
      return { ...state, favorites: state.favorites.includes(action.garageId) ? state.favorites.filter((id) => id !== action.garageId) : [...state.favorites, action.garageId] };
    case 'book': {
      requireCondition(state.role === 'driver', 'Alterne para o modo Motorista para fazer uma reserva.');
      if (state.bookings.some((booking) => booking.id === action.id)) return state;
      requireCondition(action.id.trim().length > 0, 'Não foi possível identificar a reserva. Tente novamente.');
      const garage = state.garages.find((item) => item.id === action.input.garageId);
      requireCondition(garage, 'Garagem não encontrada.');
      requireCondition(garage.active, 'Esta garagem está pausada e não aceita novas reservas.');
      requireCondition(garage.authorized, 'Esta vaga privada não tem autorização para receber reservas.');
      const now = dateValue(action.now);
      const start = dateValue(action.input.startAt);
      requireCondition(start >= now, 'Escolha um horário de entrada no futuro.');
      requireCondition(Number.isFinite(action.input.hours) && action.input.hours >= 1, 'A reserva deve durar pelo menos 1 hora.');
      const end = action.input.endAt ? dateValue(action.input.endAt) : start + action.input.hours * HOUR_MS;
      requireCondition(Number.isFinite(end) && Number.isFinite(new Date(end).getTime()) && end > start, 'O horário de saída deve ser depois da entrada.');
      requireCondition(end - start >= HOUR_MS, 'A reserva deve durar pelo menos 1 hora.');
      requireCondition(Math.abs((end - start) / HOUR_MS - action.input.hours) < 1e-9, 'A duração deve corresponder aos horários de entrada e saída.');
      const endAt = new Date(end).toISOString();
      requireCondition(isWithinAvailability(garage, action.input.startAt, endAt), 'A reserva está fora dos dias ou horários disponíveis desta vaga.');
      requireCondition(availableSpaces(garage, state.bookings, action.input.startAt, endAt) > 0, 'Não há vagas disponíveis nesse período. Escolha outro horário.');
      const vehicleType = action.input.vehicleType ?? 'car';
      requireCondition(garage.vehicleTypes.includes(vehicleType), 'Esta vaga não aceita o tipo de veículo selecionado.');
      const plate = normalizePlate(action.input.plate);
      const vehicle = action.input.vehicle.trim();
      requireCondition(vehicle.length >= 2 && vehicle.length <= 80, 'Informe o veículo com 2 a 80 caracteres.');
      const billingMode = action.input.billingMode ?? 'hour';
      const paymentMethod = action.input.paymentMethod ?? 'pix';
      requireCondition(['pix', 'card', 'cash'].includes(paymentMethod), 'Escolha uma forma de pagamento simulada válida.');
      const address = [garage.address.trim(), garage.complement.trim()].filter(Boolean).join(' · ');
      const booking: Booking = {
        id: action.id, garageId: garage.id, garageName: garage.name, address, accessInstructions: garage.accessInstructions,
        driverId: 'local', driverName: validateName(state.profile.name), plate, vehicle, vehicleType, startAt: new Date(start).toISOString(), endAt,
        ...calculatePrice(garage, action.input.hours, billingMode), pricePerHour: garage.pricePerHour, pricePerDay: garage.pricePerDay, billingMode, paymentMethod,
        status: 'confirmed', code: generateBookingCode(action.id, state.bookings.map((item) => item.code)), createdAt: new Date(now).toISOString(),
      };
      return { ...state, bookings: [...state.bookings, booking], profile: { ...state.profile, plate, vehicle } };
    }
    case 'bookingStatus': {
      const booking = state.bookings.find((item) => item.id === action.id);
      requireCondition(booking, 'Reserva não encontrada.');
      requireCondition(canManageBooking(state, booking), 'Você só pode alterar reservas vinculadas ao seu perfil.');
      if (booking.status === action.status) return state;
      const validTransition = (booking.status === 'confirmed' && (action.status === 'active' || action.status === 'cancelled')) || (booking.status === 'active' && action.status === 'completed');
      requireCondition(validTransition, 'Esta reserva não permite essa alteração de status.');
      const now = dateValue(action.now);
      if (action.status === 'cancelled') {
        requireCondition(state.role === 'driver' && booking.driverId === 'local', 'Somente o motorista da reserva pode cancelá-la.');
        requireCondition(dateValue(booking.startAt) > now, 'Só é possível cancelar uma reserva futura, antes do horário de entrada.');
      }
      if (action.status === 'active') {
        requireCondition(now >= dateValue(booking.startAt) - 30 * 60_000, 'O check-in fica disponível 30 minutos antes da reserva.');
        requireCondition(now < dateValue(booking.endAt), 'O período desta reserva terminou. O check-in não está mais disponível.');
      }
      return { ...state, bookings: state.bookings.map((item) => item.id === action.id ? { ...item, status: action.status } : item) };
    }
    case 'saveGarage': {
      requireCondition(state.role === 'owner', 'Alterne para o modo Proprietário para cadastrar ou editar uma vaga.');
      requireCondition(action.id.trim().length > 0, 'Não foi possível identificar a garagem.');
      const existing = state.garages.find((garage) => garage.id === action.id);
      requireCondition(!existing || existing.ownerId === 'local', 'Você só pode editar as suas garagens.');
      const input = validateGarage(action.input);
      const garage: Garage = existing ? { ...existing, ...input } : { ...input, id: action.id, ownerId: 'local', ownerName: state.ownerProfile.name, active: true, rating: 0, reviews: 0, theme: 'mint' };
      if (existing) {
        const now = Date.now();
        const future = state.bookings.filter((booking) => booking.garageId === existing.id && (booking.status === 'confirmed' || booking.status === 'active') && dateValue(booking.endAt) > now);
        requireCondition(input.capacity >= peakOccupancy(future, now, Infinity), 'A capacidade não pode ser menor que as reservas já confirmadas para o mesmo período.');
        requireCondition(future.every((booking) => isWithinAvailability(garage, booking.startAt, booking.endAt)), 'Os novos dias e horários não podem invalidar reservas já confirmadas.');
        requireCondition(future.every((booking) => garage.vehicleTypes.includes(booking.vehicleType)), 'Os tipos de veículo não podem invalidar reservas já confirmadas.');
      }
      return { ...state, garages: existing ? state.garages.map((item) => item.id === action.id ? garage : item) : [...state.garages, garage] };
    }
    case 'toggleGarage': {
      requireCondition(state.role === 'owner', 'Alterne para o modo Proprietário para ativar ou pausar uma vaga.');
      const garage = state.garages.find((item) => item.id === action.id);
      requireCondition(garage, 'Garagem não encontrada.');
      requireCondition(garage.ownerId === 'local', 'Você só pode pausar ou ativar as suas garagens.');
      requireCondition(garage.authorized, 'Confirme a autorização da vaga antes de ativá-la.');
      return { ...state, garages: state.garages.map((item) => item.id === action.id ? { ...item, active: !item.active } : item) };
    }
    case 'filters': return { ...state, filters: validateFilters(action.filters) };
    case 'preferences': return { ...state, preferences: validatePreferences(action.preferences) };
    case 'saveVehicle': {
      const vehicle = validateVehicle(action.vehicle);
      requireCondition(!state.vehicles.some((item) => item.id !== vehicle.id && item.plate === vehicle.plate), 'Esta placa já está cadastrada em outro veículo.');
      return { ...state, vehicles: state.vehicles.some((item) => item.id === vehicle.id) ? state.vehicles.map((item) => item.id === vehicle.id ? vehicle : item) : [...state.vehicles, vehicle] };
    }
    case 'deleteVehicle': {
      requireCondition(state.vehicles.some((vehicle) => vehicle.id === action.id), 'Veículo não encontrado.');
      return { ...state, vehicles: state.vehicles.filter((vehicle) => vehicle.id !== action.id) };
    }
    case 'review': {
      const review = action.review;
      const booking = state.bookings.find((item) => item.id === review.bookingId);
      requireCondition(booking, 'Reserva não encontrada.');
      requireCondition(review.authorRole === state.role && canManageBooking(state, booking), 'Você só pode avaliar reservas vinculadas ao seu perfil atual.');
      requireCondition(booking.status === 'completed', 'Somente reservas concluídas podem receber avaliação.');
      requireCondition(!state.reviews.some((item) => item.bookingId === review.bookingId && item.authorRole === review.authorRole), 'Você já avaliou esta reserva.');
      requireCondition(review.id.trim().length > 0 && !state.reviews.some((item) => item.id === review.id), 'Não foi possível identificar a avaliação.');
      requireCondition(Number.isInteger(review.score) && review.score >= 1 && review.score <= 5, 'Escolha uma avaliação de 1 a 5 estrelas.');
      requireCondition(typeof review.comment === 'string' && review.comment.trim().length <= 500, 'O comentário deve ter até 500 caracteres.');
      const garages = review.authorRole === 'driver' ? state.garages.map((garage) => garage.id === booking.garageId ? { ...garage, rating: (garage.rating * garage.reviews + review.score) / (garage.reviews + 1), reviews: garage.reviews + 1 } : garage) : state.garages;
      return { ...state, garages, reviews: [...state.reviews, { ...review, comment: review.comment.trim() }] };
    }
    case 'reset': return createInitialState();
  }
}
