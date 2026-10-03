import React, { useState } from 'react';
import { View } from 'react-native';
import { statusLabels } from '../../domain/model';
import type { BookingStatus } from '../../domain/types';
import { useReadyApp } from '../../state/AppProvider';
import { Card, common, Empty, Header, Notice, Pill, Screen, Txt } from '../../ui/components';
import { BookingCard } from './OwnerShared';

const statuses: BookingStatus[] = ['confirmed', 'active', 'completed', 'cancelled'];

export function OwnerBookings({ onBooking }: { onBooking: (id: string) => void }) {
  const { state } = useReadyApp();
  const [status, setStatus] = useState<BookingStatus>('confirmed');
  const ids = new Set(state.garages.filter(garage => garage.ownerId === 'local').map(garage => garage.id));
  const all = state.bookings.filter(booking => ids.has(booking.garageId));
  const bookings = all.filter(booking => booking.status === status).sort((a, b) => status === 'confirmed' || status === 'active' ? a.startAt.localeCompare(b.startAt) : b.startAt.localeCompare(a.startAt));
  return <Screen testID="owner-bookings">
    <Header title="Reservas recebidas" subtitle="Acompanhe quem chega ao seu espaço." />
    <View style={common.wrap}>{statuses.map(item => <Pill key={item} title={`${statusLabels[item]} (${all.filter(booking => booking.status === item).length})`} selected={item === status} onPress={() => setStatus(item)} />)}</View>
    <Txt variant="label">{bookings.length} {bookings.length === 1 ? 'reserva' : 'reservas'} · {statusLabels[status].toLowerCase()}</Txt>
    {!bookings.length ? <Card><Empty icon="calendar" title="Sua agenda, organizada" description={`Você ainda não tem reservas com status ${statusLabels[status].toLowerCase()}. Escolha outro status para consultar o histórico.`} /></Card> : bookings.map(booking => <BookingCard key={booking.id} booking={booking} onPress={() => onBooking(booking.id)} />)}
    <Notice>Abra uma reserva concluída para avaliar o motorista. A comissão é de 15% e seu repasse líquido é de 85%, sempre simulados.</Notice>
  </Screen>;
}
