import React, { useState } from 'react';
import { View } from 'react-native';
import { money } from '../../domain/model';
import { useReadyApp } from '../../state/AppProvider';
import { Button, Card, common, Empty, Header, Icon, Notice, Pill, Row, Screen, Txt } from '../../ui/components';
import { colors } from '../../ui/theme';
import { GarageCover, ownerStyles } from './OwnerShared';
import { nextAvailability } from './ownerAnalytics';
import { useGarageActivation } from './useGarageActivation';

export function OwnerGarages({ onEdit, onGarage, onBooking }: { onEdit: (id?: string) => void; onGarage?: (id: string) => void; onBooking?: (id: string) => void }) {
  const { state } = useReadyApp();
  const [filter, setFilter] = useState<'all' | 'active' | 'paused'>('all');
  const { toggle, feedback, pending } = useGarageActivation();
  const all = state.garages.filter(garage => garage.ownerId === 'local');
  const garages = all.filter(garage => filter === 'all' || garage.active === (filter === 'active'));

  return <Screen testID="owner-garages">
    <Header title="Minhas vagas" subtitle="Seus espaços, no seu ritmo." />
    <Button title="Cadastrar vaga" icon="plus" onPress={() => onEdit()} testID="add-garage" />
    <View style={common.wrap}><Pill title={`Todas (${all.length})`} selected={filter === 'all'} onPress={() => setFilter('all')} /><Pill title="Ativas" selected={filter === 'active'} onPress={() => setFilter('active')} /><Pill title="Pausadas" selected={filter === 'paused'} onPress={() => setFilter('paused')} /></View>
    {feedback ? <Notice>{feedback}</Notice> : null}
    {!garages.length ? <Card><Empty icon="home" title={all.length ? 'Nenhuma vaga neste filtro' : 'Seu primeiro espaço'} description={all.length ? 'Escolha outro status para ver seus anúncios.' : 'Cadastre uma vaga privada, escolha os horários e acompanhe suas reservas por aqui.'} /></Card> : garages.map(garage => {
      const bookings = state.bookings.filter(booking => booking.garageId === garage.id);
      const next = bookings.filter(booking => ['confirmed', 'active'].includes(booking.status) && Date.parse(booking.endAt) > Date.now()).sort((a, b) => a.startAt.localeCompare(b.startAt))[0];
      return <Card key={garage.id}>
        <GarageCover garage={garage} />
        <View style={common.between}><Txt variant="heading" style={{ flex: 1 }}>{garage.name}</Txt><View style={[ownerStyles.badge, { backgroundColor: garage.active ? colors.primaryLight : colors.sand }]}><Icon name={garage.active ? 'check-circle' : 'pause-circle'} size={14} color={colors.primary} /><Txt variant="small">{garage.active ? 'Ativa' : 'Pausada'}</Txt></View></View>
        <Row><Icon name="map-pin" color={colors.muted} size={15} /><Txt variant="small" color={colors.muted}>{garage.neighborhood}</Txt></Row>
        <Row><Txt variant="heading" color={colors.primary}>{money(garage.pricePerHour)}</Txt><Txt variant="small" color={colors.muted}>/ hora</Txt></Row>
        {garage.pricePerDay !== null && <Txt variant="small" color={colors.muted}>{money(garage.pricePerDay)} / diária</Txt>}
        <Txt variant="small">{garage.capacity} {garage.capacity === 1 ? 'vaga' : 'vagas'} · {bookings.length} {bookings.length === 1 ? 'reserva recebida' : 'reservas recebidas'}</Txt>
        <Row><Icon name="clock" size={15} color={colors.primary} /><Txt variant="small" color={colors.primary} style={{ flex: 1 }}>{nextAvailability(garage, state.bookings)}</Txt></Row>
        <View style={ownerStyles.actions}><View style={ownerStyles.action}><Button title="Editar" icon="edit-2" variant="secondary" onPress={() => onEdit(garage.id)} /></View>{onGarage && <View style={ownerStyles.action}><Button title="Visualizar" icon="eye" variant="secondary" onPress={() => onGarage(garage.id)} /></View>}</View>
        <Button title={garage.active ? 'Pausar anúncio' : 'Ativar anúncio'} icon={garage.active ? 'pause' : 'play'} variant="secondary" disabled={pending === garage.id} onPress={() => toggle(garage)} />
        {next && onBooking && <Button title="Abrir próxima reserva" variant="secondary" icon="calendar" onPress={() => onBooking(next.id)} />}
      </Card>;
    })}
  </Screen>;
}
