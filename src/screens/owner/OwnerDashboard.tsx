import React from 'react';
import { StyleSheet, Switch, View } from 'react-native';
import { money } from '../../domain/model';
import { useReadyApp } from '../../state/AppProvider';
import { BrandLogo, Button, Card, common, Empty, Icon, Notice, Row, Screen, Txt } from '../../ui/components';
import { colors } from '../../ui/theme';
import { BookingCard, MoneyRow } from './OwnerShared';
import { bookingDate, finances, monthKey, monthLabel, monthlyOccupancy, weeklyReservations } from './ownerAnalytics';
import { useGarageActivation } from './useGarageActivation';
import { useCompactOwnerLayout } from './OwnerLayout';

interface Props {
  onEdit: (id?: string) => void; onBooking: (id: string) => void; onGarage?: (id: string) => void;
  onGarages?: () => void; onEarnings?: () => void; onBookings?: () => void;
}

export function OwnerDashboard({ onEdit, onBooking, onGarages, onEarnings, onBookings }: Props) {
  const { state } = useReadyApp();
  const { toggle, feedback, pending } = useGarageActivation();
  const compact = useCompactOwnerLayout();
  const now = new Date();
  const month = monthKey(now);
  const garages = state.garages.filter(garage => garage.ownerId === 'local');
  const ids = new Set(garages.map(garage => garage.id));
  const bookings = state.bookings.filter(booking => ids.has(booking.garageId));
  const monthly = bookings.filter(booking => monthKey(booking.startAt) === month && booking.status !== 'cancelled');
  const realized = finances(monthly.filter(booking => booking.status === 'completed'));
  const forecast = finances(monthly.filter(booking => booking.status !== 'completed'));
  const next = bookings.filter(booking => (booking.status === 'confirmed' || booking.status === 'active') && Date.parse(booking.endAt) > now.getTime()).sort((a, b) => a.startAt.localeCompare(b.startAt))[0];
  const recent = [...bookings].sort((a, b) => b.createdAt.localeCompare(a.createdAt)).slice(0, 3);
  const transfers = bookings.filter(booking => booking.status === 'completed').sort((a, b) => b.endAt.localeCompare(a.endAt)).slice(0, 3);
  const reviewCount = garages.reduce((sum, garage) => sum + garage.reviews, 0);
  const rating = reviewCount ? (garages.reduce((sum, garage) => sum + garage.rating * garage.reviews, 0) / reviewCount).toLocaleString('pt-BR', { maximumFractionDigits: 1 }) : '—';
  const week = weeklyReservations(bookings, now);
  const maxCount = Math.max(1, ...week.map(day => day.count));

  return <Screen testID="owner-dashboard">
    <View style={styles.hero}>
      <View style={common.between}><BrandLogo light /><View style={styles.month}><Txt variant="small" color={colors.white}>{monthLabel(month, true)}</Txt></View></View>
      <View style={{ gap: 6, paddingTop: 20 }}><Txt variant="heading" color={colors.white}>Painel do proprietário</Txt><Txt color="#D3DEEE">Acompanhe suas vagas e seus ganhos.</Txt></View>
    </View>
    <Card style={styles.balance}>
      <View style={common.between}><Txt variant="label" color={colors.muted}>Ganhos no mês</Txt><View style={styles.badge}><Txt variant="small" color="#137348">85% para você</Txt></View></View>
      <Txt variant="title" color={colors.primary}>{money(realized.net)}</Txt>
      <Row style={{ paddingTop: 8, alignItems: 'stretch', flexDirection: compact ? 'column' : 'row' }}>
        <View style={compact ? styles.compactMetric : styles.metric}><Txt variant="heading">{monthly.length}</Txt><Txt variant="small" color={colors.muted}>Reservas</Txt></View>
        <View style={compact ? [styles.compactMetric, styles.compactBorder] : [styles.metric, styles.metricBorder]}><Txt variant="heading">{monthlyOccupancy(garages, bookings, month).toLocaleString('pt-BR')}%</Txt><Txt variant="small" color={colors.muted}>Ocupação</Txt></View>
        <View style={compact ? [styles.compactMetric, styles.compactBorder] : [styles.metric, styles.metricBorder]}><Txt variant="heading">{rating}</Txt><Txt variant="small" color={colors.muted}>Avaliação</Txt></View>
      </Row>
      <Txt variant="small" color={colors.muted}>Líquido de reservas concluídas · {monthLabel(month)}</Txt>
    </Card>
    <Card>
      <View style={common.between}><Txt variant="label">Reservas da semana</Txt><Txt variant="small" color={colors.muted}>7 dias</Txt></View>
      <View style={styles.chart}>{week.map(day => <View key={day.key} accessible accessibilityLabel={`${day.label}, ${day.key.slice(8, 10)}/${day.key.slice(5, 7)}: ${day.count} reservas${day.today ? ', hoje' : ''}`} style={styles.column}><Txt variant="small" color={colors.muted}>{day.count}</Txt><View style={styles.track}><View style={[styles.bar, { height: Math.max(3, day.count / maxCount * 95), backgroundColor: day.today ? colors.orange : '#C5D3E5' }]} /></View><Txt variant="small" color={colors.muted}>{day.label}</Txt></View>)}</View>
      {!week.some(day => day.count) && <Txt variant="small" color={colors.muted}>Ainda sem reservas nesta semana.</Txt>}
    </Card>
    <View style={common.section}>
      <Txt variant="heading">Próxima reserva</Txt>
      {next ? <Card><Row style={{ alignItems: 'flex-start' }}><View style={styles.garageIcon}><Icon name="home" size={30} color={colors.primary} /></View><View style={{ flex: 1, gap: 5 }}><Txt variant="small" color={colors.primary}>{bookingDate(next.startAt)}</Txt><Txt variant="label">{next.garageName}</Txt><Txt variant="small" color={colors.muted}>{next.vehicle} · {next.plate}</Txt></View></Row><Button title="Ver reserva" variant="secondary" onPress={() => onBooking(next.id)} /></Card> : <Card><Empty title="Agenda livre por enquanto" description="Suas próximas reservas aparecerão aqui." icon="calendar" /></Card>}
    </View>
    <View style={common.section}>
      <View style={common.between}><Txt variant="heading">Minhas vagas</Txt><Txt variant="small" color={colors.muted}>{garages.filter(garage => garage.active).length} ativas</Txt></View>
      {garages.slice(0, 2).map(garage => <Card key={garage.id}><Row><View style={{ flex: 1, gap: 5 }}><Txt variant="label">{garage.name}</Txt><Txt variant="small" color={colors.muted}>{money(garage.pricePerHour)}/h · {garage.rating.toLocaleString('pt-BR', { maximumFractionDigits: 1 })} ★ · {bookings.filter(booking => booking.garageId === garage.id).length} reservas</Txt></View><Switch accessibilityLabel={`${garage.active ? 'Pausar' : 'Ativar'} ${garage.name}`} value={garage.active} disabled={pending !== null} trackColor={{ false: colors.line, true: '#22A06B' }} thumbColor={colors.white} onValueChange={() => toggle(garage)} /></Row><Txt variant="small" color={garage.active ? '#137348' : colors.muted}>{garage.active ? 'Vaga ativa' : 'Anúncio pausado'}</Txt></Card>)}
      {!garages.length && <Card><Txt color={colors.muted}>Cadastre seu primeiro espaço privado para começar.</Txt></Card>}
      {feedback ? <Notice>{feedback}</Notice> : null}
      {onGarages && <Button title="Gerenciar minhas vagas" variant="secondary" onPress={onGarages} />}
      <Button title="Cadastrar nova vaga" icon="plus" onPress={() => onEdit()} testID="add-garage" />
    </View>
    <Card>
      <Txt variant="heading">Resumo de repasses</Txt>
      <MoneyRow label="Bruto concluído no mês" value={realized.gross} />
      <MoneyRow label="Comissão da plataforma · 15%" value={realized.commission} />
      <MoneyRow label="Líquido concluído · 85%" value={realized.net} emphasis />
      <MoneyRow label="Líquido previsto · reservas abertas do mês" value={forecast.net} />
      {onEarnings && <Button title="Ver meus ganhos" icon="bar-chart-2" variant="secondary" onPress={onEarnings} />}
    </Card>
    <View style={common.section}><Txt variant="heading">Repasses recentes</Txt>{transfers.length ? transfers.map(booking => <Card key={booking.id}><Txt variant="label">{booking.garageName}</Txt><MoneyRow label={`${booking.code} · líquido simulado`} value={booking.net} emphasis /><Button title="Ver reserva" variant="secondary" onPress={() => onBooking(booking.id)} /></Card>) : <Txt color={colors.muted}>Os repasses simulados aparecem quando uma reserva é concluída.</Txt>}</View>
    <View style={common.section}><Txt variant="heading">Histórico recente</Txt>{recent.map(booking => <BookingCard key={booking.id} booking={booking} onPress={() => onBooking(booking.id)} />)}{!recent.length && <Txt color={colors.muted}>Você ainda não recebeu reservas.</Txt>}{onBookings && <Button title="Todas as reservas recebidas" variant="secondary" icon="calendar" onPress={onBookings} />}</View>
    <Notice>Ocupação simulada: horas reservadas divididas pela capacidade e horários do mês. Canceladas não entram no cálculo. Avaliação ponderada pelas avaliações das suas vagas. Nenhum pagamento é realizado.</Notice>
  </Screen>;
}

const styles = StyleSheet.create({
  hero: { backgroundColor: colors.primary, marginHorizontal: -22, marginTop: -22, paddingHorizontal: 22, paddingTop: 24, paddingBottom: 64, gap: 10 },
  month: { paddingVertical: 9, paddingHorizontal: 14, borderRadius: 18, backgroundColor: '#203C60' },
  balance: { marginTop: -56, borderRadius: 26, borderWidth: 0, elevation: 4, shadowColor: colors.primary, shadowOpacity: 0.08, shadowRadius: 12, shadowOffset: { width: 0, height: 5 } },
  badge: { borderRadius: 24, backgroundColor: '#EAF7F0', paddingVertical: 6, paddingHorizontal: 10 },
  metric: { flex: 1, gap: 4 }, metricBorder: { borderLeftWidth: 1, borderLeftColor: colors.line, paddingLeft: 12 },
  compactMetric: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 12 },
  compactBorder: { borderTopWidth: 1, borderTopColor: colors.line, paddingTop: 10 },
  chart: { flexDirection: 'row', gap: 8, paddingTop: 8 }, column: { flex: 1, alignItems: 'center', gap: 6 },
  track: { height: 95, width: '100%', alignItems: 'center', justifyContent: 'flex-end' }, bar: { width: '72%', borderRadius: 12 },
  garageIcon: { width: 64, height: 70, backgroundColor: colors.blue, borderRadius: 15, alignItems: 'center', justifyContent: 'center' },
});
