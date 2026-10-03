import { validateGarage } from '../../domain/model';
import type { Garage, GarageInput } from '../../domain/types';
import { validateAvailability } from '../../domain/validation';

export const APPROXIMATE_AREAS = [
  { label: 'Boa Viagem', latitude: -8.1238, longitude: -34.9001 },
  { label: 'Recife Antigo', latitude: -8.0614, longitude: -34.8712 },
  { label: 'Ilha do Leite', latitude: -8.0642, longitude: -34.8941 },
  { label: 'Derby', latitude: -8.0563, longitude: -34.8996 },
  { label: 'Madalena', latitude: -8.0532, longitude: -34.9131 },
  { label: 'Casa Forte', latitude: -8.0349, longitude: -34.9191 },
  { label: 'Graças', latitude: -8.0414, longitude: -34.8990 },
  { label: 'Várzea', latitude: -8.0393, longitude: -34.9522 },
] as const;

export type GarageDraft = Omit<GarageInput, 'pricePerHour' | 'pricePerDay' | 'capacity' | 'width' | 'length'> & {
  pricePerHour: string; pricePerDay: string; capacity: string; width: string; length: string;
};
export type DraftErrors = Partial<Record<keyof GarageDraft | 'form', string>>;
export type UpdateDraft = <K extends keyof GarageDraft>(key: K, value: GarageDraft[K]) => void;

export function initialDraft(garage?: Garage): GarageDraft {
  return {
    name: garage?.name ?? '', neighborhood: garage?.neighborhood ?? '', address: garage?.address ?? '',
    approximateAddress: garage?.approximateAddress ?? '', complement: garage?.complement ?? '', landmark: garage?.landmark ?? '', description: garage?.description ?? '',
    pricePerHour: garage ? currencyField(garage.pricePerHour) : '', pricePerDay: garage?.pricePerDay ? currencyField(garage.pricePerDay) : '', capacity: String(garage?.capacity ?? 1),
    amenities: garage?.amenities ?? [], latitude: garage?.latitude ?? -8.1238, longitude: garage?.longitude ?? -34.9001,
    photos: garage?.photos ?? [], spaceType: garage?.spaceType ?? 'garage', width: garage ? String(garage.width).replace('.', ',') : '', length: garage ? String(garage.length).replace('.', ',') : '',
    vehicleTypes: garage?.vehicleTypes ?? ['car'], availability: garage?.availability ?? { days: [0, 1, 2, 3, 4, 5, 6], opens: '00:00', closes: '24:00' },
    rules: garage?.rules ?? '', accessInstructions: garage?.accessInstructions ?? '', authorized: garage?.authorized ?? false,
  };
}

export function currencyField(value: number): string { return (value / 100).toFixed(2).replace('.', ','); }

export function currencyInput(value: string): string {
  const digits = value.replace(/\D/g, '').slice(0, 7);
  return digits ? currencyField(Number(digits)) : '';
}

function decimal(value: string): number { return /^\d+(?:[,.]\d+)?$/.test(value.trim()) ? Number(value.replace(',', '.')) : NaN; }

export function draftErrors(draft: GarageDraft): DraftErrors {
  const errors: DraftErrors = {};
  if (draft.name.trim().length < 3) errors.name = 'Informe um título com pelo menos 3 caracteres.';
  if (draft.neighborhood.trim().length < 2) errors.neighborhood = 'Informe o bairro da vaga.';
  if (draft.address.trim().length < 5) errors.address = 'Informe o endereço completo fictício.';
  if (draft.approximateAddress.trim().length < 3) errors.approximateAddress = 'Defina a localização aproximada para a busca.';
  if (draft.landmark.trim().length < 2) errors.landmark = 'Informe um ponto de referência próximo à vaga.';
  if (draft.description.trim().length < 10) errors.description = 'Descreva a vaga em pelo menos 10 caracteres.';
  if (!Number.isFinite(decimal(draft.width)) || decimal(draft.width) < 1 || decimal(draft.width) > 30) errors.width = 'Informe uma largura de 1 a 30 metros.';
  if (!Number.isFinite(decimal(draft.length)) || decimal(draft.length) < 1 || decimal(draft.length) > 50) errors.length = 'Informe um comprimento de 1 a 50 metros.';
  const price = Math.round(decimal(draft.pricePerHour) * 100);
  if (!Number.isSafeInteger(price) || price < 100 || price > 100000) errors.pricePerHour = 'Use um valor entre R$ 1,00 e R$ 1.000,00 por hora.';
  if (draft.pricePerDay.trim() && (!Number.isFinite(decimal(draft.pricePerDay)) || decimal(draft.pricePerDay) < 1 || decimal(draft.pricePerDay) > 24000)) errors.pricePerDay = 'Use uma diária de R$ 1,00 a R$ 24.000,00 ou deixe em branco.';
  if (!/^\d+$/.test(draft.capacity) || Number(draft.capacity) < 1 || Number(draft.capacity) > 100) errors.capacity = 'Informe de 1 a 100 vagas.';
  if (!draft.vehicleTypes.length) errors.vehicleTypes = 'Selecione pelo menos um tipo de veículo.';
  try { validateAvailability(draft.availability); } catch (error) { errors.availability = error instanceof Error ? error.message : 'Revise os dias e horários disponíveis.'; }
  if (draft.photos.length > 5) errors.photos = 'Mantenha até 5 fotos. Remova uma foto antes de continuar.';
  if (draft.rules.trim().length < 5) errors.rules = 'Descreva as regras de uso em pelo menos 5 caracteres.';
  if (draft.accessInstructions.trim().length < 5) errors.accessInstructions = 'Descreva o acesso em pelo menos 5 caracteres.';
  if (!draft.authorized) errors.authorized = 'Confirme sua responsabilidade e autorização para publicar.';
  return errors;
}

export function draftInput(draft: GarageDraft): GarageInput {
  return validateGarage({ ...draft, pricePerHour: Math.round(decimal(draft.pricePerHour) * 100), pricePerDay: draft.pricePerDay.trim() ? Math.round(decimal(draft.pricePerDay) * 100) : null, capacity: Number(draft.capacity), width: decimal(draft.width), length: decimal(draft.length) });
}

export const stepFields: (keyof GarageDraft)[][] = [
  ['name', 'description', 'neighborhood', 'address', 'approximateAddress', 'landmark', 'complement'],
  ['spaceType', 'width', 'length', 'capacity', 'vehicleTypes', 'amenities'],
  ['photos', 'availability', 'pricePerHour', 'pricePerDay', 'rules'],
  ['accessInstructions', 'authorized'],
];
