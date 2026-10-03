import React from 'react';
import { Image, Pressable, StyleSheet, View } from 'react-native';
import { money, statusLabels } from '../../domain/model';
import type { Booking, Garage } from '../../domain/types';
import { Card, common, GarageArt, Icon, Row, Txt } from '../../ui/components';
import { colors } from '../../ui/theme';
import { bookingDate } from './ownerAnalytics';

export function GarageCover({ garage }: { garage: Garage }) {
  const [failed, setFailed] = React.useState(false);
  return garage.photos[0] && !failed ? <Image source={{ uri: garage.photos[0] }} onError={() => setFailed(true)} accessibilityLabel={`Foto da vaga ${garage.name}`} style={{ height: 160, borderRadius: 16, width: '100%' }} /> : <GarageArt theme={garage.theme} />;
}

export function BookingCard({ booking, onPress }: { booking: Booking; onPress?: () => void }) {
  const content = <Card>
    <View style={common.between}><Row style={{ flex: 1 }}><View style={ownerStyles.avatar}><Icon name="user" color={colors.primary} /></View><View style={{ flex: 1 }}><Txt variant="label">{booking.driverName}</Txt><Txt variant="small" color={colors.muted}>{booking.vehicle} · {booking.plate}</Txt></View></Row>{onPress && <Icon name="chevron-right" color={colors.muted} />}</View>
    <Txt variant="label">{booking.garageName}</Txt>
    <Row><Icon name="calendar" size={16} color={colors.muted} /><View style={{ flex: 1 }}><Txt variant="small">Entrada: {bookingDate(booking.startAt)}</Txt><Txt variant="small">Saída: {bookingDate(booking.endAt)}</Txt></View></Row>
    <View style={common.between}><View style={[ownerStyles.badge, { backgroundColor: booking.status === 'cancelled' ? colors.dangerLight : colors.primaryLight }]}><Txt variant="small" color={booking.status === 'cancelled' ? colors.danger : colors.primary}>{statusLabels[booking.status]}</Txt></View><Txt variant="small" color={colors.muted}>{booking.code}</Txt></View>
    <View style={common.divider} />
    <MoneyRow label="Valor total" value={booking.total} />
    <MoneyRow label="Comissão da plataforma · 15%" value={booking.commission} />
    <MoneyRow label="Repasse líquido · 85%" value={booking.net} emphasis />
    {booking.status === 'cancelled' && <Txt variant="small" color={colors.muted}>Cancelada: valores apenas para histórico, excluídos dos ganhos.</Txt>}
  </Card>;
  return onPress ? <Pressable accessibilityRole="button" accessibilityLabel={`Reserva ${booking.code} de ${booking.driverName}. ${booking.vehicle}, placa ${booking.plate}. Entrada ${bookingDate(booking.startAt)}, saída ${bookingDate(booking.endAt)}. ${statusLabels[booking.status]}. Total ${money(booking.total)}, comissão ${money(booking.commission)}, líquido ${money(booking.net)}.`} accessibilityHint="Abrir detalhes da reserva" onPress={onPress} style={({ pressed }) => ({ opacity: pressed ? 0.75 : 1 })}>{content}</Pressable> : content;
}

export function MoneyRow({ label, value, emphasis = false }: { label: string; value: number; emphasis?: boolean }) {
  return <View style={common.between}><Txt variant="small" color={colors.muted} style={{ flex: 1 }}>{label}</Txt><Txt variant={emphasis ? 'label' : 'small'} color={emphasis ? colors.primary : colors.ink}>{money(value)}</Txt></View>;
}

export const ownerStyles = StyleSheet.create({
  avatar: { width: 42, height: 42, borderRadius: 15, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.primaryLight },
  badge: { borderRadius: 20, paddingHorizontal: 11, paddingVertical: 7, flexDirection: 'row', alignItems: 'center', gap: 6 },
  actions: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  action: { flex: 1, minWidth: 140 },
  balance: { backgroundColor: colors.primary, padding: 24, borderRadius: 26, gap: 10 },
  metric: { flex: 1, gap: 5 },
});
