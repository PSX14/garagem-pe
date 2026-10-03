export type Role = 'driver' | 'owner';
export type Amenity = 'covered' | 'camera' | 'accessible' | 'electric' | 'gate' | 'lighting' | 'attendant';
export type VehicleType = 'car' | 'motorcycle';
export type BookingStatus = 'confirmed' | 'active' | 'completed' | 'cancelled';
export type PaymentMethod = 'pix' | 'card' | 'cash';
export type BillingMode = 'hour' | 'day';
export interface Profile { name: string; email: string; phone: string; plate: string; vehicle: string }
export interface Vehicle { id: string; label: string; plate: string; type: VehicleType }
export interface Availability { days: number[]; opens: string; closes: string }
export interface Garage {
  id: string; ownerId: string; ownerName: string; name: string; neighborhood: string; address: string;
  approximateAddress: string; complement: string; landmark: string; description: string;
  pricePerHour: number; pricePerDay: number | null; capacity: number; amenities: Amenity[];
  active: boolean; latitude: number; longitude: number; rating: number; reviews: number;
  theme: 'mint' | 'sand' | 'blue'; photos: string[]; spaceType: 'garage' | 'driveway' | 'private_lot';
  width: number; length: number; vehicleTypes: VehicleType[]; availability: Availability;
  rules: string; accessInstructions: string; authorized: boolean;
}
export interface Booking {
  id: string; garageId: string; garageName: string; address: string; accessInstructions: string;
  driverId: string; driverName: string; plate: string; vehicle: string; vehicleType: VehicleType;
  startAt: string; endAt: string; total: number; commission: number; net: number;
  pricePerHour: number; pricePerDay: number | null; billingMode: BillingMode; paymentMethod: PaymentMethod;
  status: BookingStatus; code: string; createdAt: string;
}
export interface Review { id: string; bookingId: string; authorRole: Role; score: number; comment: string }
export interface SearchFilters {
  query: string; maxPrice: number | null; maxDistanceKm: number | null; covered: boolean; gate: boolean;
  vehicleType: VehicleType | 'all'; immediate: boolean; today?: boolean; billingMode: BillingMode | 'all';
  minRating: number; sort: 'rating' | 'price' | 'distance';
}
export interface Preferences { view: 'list' | 'map'; location: { latitude: number; longitude: number; label: string } }
export interface AppState {
  version: 2; onboarded: boolean; role: Role; profile: Profile; ownerProfile: Profile;
  garages: Garage[]; bookings: Booking[]; favorites: string[]; vehicles: Vehicle[]; reviews: Review[];
  filters: SearchFilters; preferences: Preferences;
}
export interface BookingInput { garageId: string; startAt: string; hours: number; endAt?: string; plate: string; vehicle: string; vehicleType?: VehicleType; billingMode?: BillingMode; paymentMethod?: PaymentMethod }
export type GarageInput = Omit<Garage, 'id' | 'ownerId' | 'ownerName' | 'active' | 'rating' | 'reviews' | 'theme'>;
export type Action =
  | { type: 'onboard'; name: string; role: Role }
  | { type: 'role'; role: Role }
  | { type: 'profile'; profile: Profile }
  | { type: 'favorite'; garageId: string }
  | { type: 'book'; input: BookingInput; now: string; id: string }
  | { type: 'bookingStatus'; id: string; status: BookingStatus; now: string }
  | { type: 'saveGarage'; input: GarageInput; id: string }
  | { type: 'toggleGarage'; id: string }
  | { type: 'filters'; filters: SearchFilters }
  | { type: 'preferences'; preferences: Preferences }
  | { type: 'saveVehicle'; vehicle: Vehicle }
  | { type: 'deleteVehicle'; id: string }
  | { type: 'review'; review: Review }
  | { type: 'reset' };
