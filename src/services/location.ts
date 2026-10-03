import * as Location from 'expo-location';
import type { Preferences } from '../domain/types';

export const manualLocations: Preferences['location'][] = [
  { label: 'Boa Viagem', latitude: -8.1238, longitude: -34.9001 },
  { label: 'Recife Antigo', latitude: -8.0614, longitude: -34.8712 },
  { label: 'Ilha do Leite', latitude: -8.0634, longitude: -34.8970 },
  { label: 'Derby', latitude: -8.0551, longitude: -34.9017 },
  { label: 'Madalena', latitude: -8.0526, longitude: -34.9124 },
  { label: 'Casa Forte', latitude: -8.0342, longitude: -34.9206 },
  { label: 'Graças', latitude: -8.0397, longitude: -34.9011 },
  { label: 'Várzea', latitude: -8.0486, longitude: -34.9581 },
];

/** Location is optional: search and bookings keep working without permission or GPS. */
export async function currentLocation(): Promise<Preferences['location']> {
  const permission = await Location.requestForegroundPermissionsAsync();
  if (!permission.granted) throw new Error('Localização não autorizada. Escolha um bairro abaixo ou pesquise seu destino; todas as reservas continuam disponíveis.');
  if (!await Location.hasServicesEnabledAsync()) throw new Error('A localização do aparelho está desligada. Ative o GPS ou escolha um bairro manualmente.');
  let timeout: ReturnType<typeof setTimeout> | undefined;
  try {
    const position = await Promise.race([
      Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Balanced }),
      new Promise<never>((_, reject) => { timeout = setTimeout(() => reject(new Error('Não foi possível localizar o aparelho agora. Escolha um bairro manualmente e tente novamente quando houver sinal.')), 12000); }),
    ]);
    return { latitude: position.coords.latitude, longitude: position.coords.longitude, label: 'Minha localização atual' };
  } finally { if (timeout) clearTimeout(timeout); }
}
