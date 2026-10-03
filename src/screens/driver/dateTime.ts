/** Native pickers use device-local Date fields; bookings always use Recife (UTC−03). */
export function toRecifePickerDate(instant: Date): Date {
  const shifted = new Date(instant.getTime() - 3 * 3600000);
  return new Date(shifted.getUTCFullYear(), shifted.getUTCMonth(), shifted.getUTCDate(), shifted.getUTCHours(), shifted.getUTCMinutes());
}
export function fromRecifePickerDate(localFields: Date): Date {
  return new Date(Date.UTC(localFields.getFullYear(), localFields.getMonth(), localFields.getDate(), localFields.getHours() + 3, localFields.getMinutes()));
}
