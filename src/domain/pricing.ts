import type { BillingMode, Garage } from './types';
import { requireCondition } from './validation';

/** All prices and all returned monetary values are integer centavos. */
export function quote(pricePerHour: number, hours: number): number {
  requireCondition(Number.isSafeInteger(pricePerHour) && pricePerHour > 0, 'Informe um valor por hora válido.');
  requireCondition(Number.isFinite(hours) && hours > 0, 'Informe uma duração válida.');
  const total = Math.round(pricePerHour * hours);
  requireCondition(Number.isSafeInteger(total) && total > 0, 'O valor total da reserva é inválido.');
  return total;
}
export function splitPrice(total: number): { total: number; commission: number; net: number } {
  requireCondition(Number.isSafeInteger(total) && total > 0, 'O valor total da reserva é inválido.');
  const commission = Math.round(total * 15 / 100);
  return { total, commission, net: total - commission };
}
export function calculatePrice(garage: Pick<Garage, 'pricePerHour' | 'pricePerDay'>, hours: number, mode: BillingMode): { total: number; commission: number; net: number } {
  requireCondition(mode === 'hour' || mode === 'day', 'Escolha uma modalidade de reserva válida.');
  requireCondition(Number.isFinite(hours) && hours >= 1, 'A reserva deve durar pelo menos 1 hora.');
  if (mode === 'day') {
    requireCondition(garage.pricePerDay !== null && Number.isSafeInteger(garage.pricePerDay) && garage.pricePerDay > 0, 'Esta vaga não oferece reserva por diária.');
    return splitPrice(quote(garage.pricePerDay, Math.ceil(hours / 24)));
  }
  return splitPrice(quote(garage.pricePerHour, hours));
}
export function money(value: number): string {
  return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value / 100);
}
export function generateBookingCode(id: string, existingCodes: string[]): string {
  requireCondition(typeof id === 'string' && id.trim().length > 0, 'Não foi possível identificar a reserva. Tente novamente.');
  const combinations = 36 ** 6;
  let hash = 2166136261;
  for (let index = 0; index < id.length; index += 1) hash = Math.imul(hash ^ id.charCodeAt(index), 16777619) >>> 0;
  const used = new Set(existingCodes);
  for (let attempt = 0; attempt <= used.size; attempt += 1) {
    const code = `GPE-${((hash + attempt) % combinations).toString(36).toUpperCase().padStart(6, '0')}`;
    if (!used.has(code)) return code;
  }
  throw new Error('Não foi possível gerar um código disponível. Tente novamente.');
}
