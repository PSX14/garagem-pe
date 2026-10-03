import React, { useEffect, useRef, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, useWindowDimensions, View } from 'react-native';
import { money } from '../../domain/model';
import { useReadyApp } from '../../state/AppProvider';
import { Card, common, Empty, Header, Notice, Pill, Screen, Txt } from '../../ui/components';
import { colors } from '../../ui/theme';
import { BookingCard, MoneyRow, ownerStyles } from './OwnerShared';
import { finances, monthKey, monthLabel, recentMonths } from './ownerAnalytics';

export function EarningsScreen({ onBooking }: { onBooking?: (id: string) => void }) {
  const { state } = useReadyApp();
  const [month, setMonth] = useState(() => monthKey(new Date()));
  const [scope, setScope] = useState<'completed' | 'open' | 'all'>('completed');
  const [garageId, setGarageId] = useState('all');
  const { width, fontScale } = useWindowDimensions();
  const chartRef = useRef<ScrollView>(null);
  const columnWidth = Math.max(48 * fontScale, (Math.min(width, 660) - 110) / 6);
  useEffect(() => { chartRef.current?.scrollToEnd({ animated: false }); }, [month]);
  const garages = state.garages.filter(garage => garage.ownerId === 'local');
  const ids = new Set(garages.map(garage => garage.id));
  const all = state.bookings.filter(booking => ids.has(booking.garageId));
  const months = recentMonths(new Date(), all);
  const eligible = all.filter(booking => booking.status !== 'cancelled' && (garageId === 'all' || booking.garageId === garageId) && (scope === 'all' || (scope === 'completed' ? booking.status === 'completed' : booking.status === 'confirmed' || booking.status === 'active')));
  const bookings = eligible.filter(booking => monthKey(booking.startAt) === month).sort((a, b) => b.startAt.localeCompare(a.startAt));
  const totals = finances(bookings);
  const chartMonths = recentMonths(new Date(`${month}-15T12:00:00-03:00`), []).reverse();
  const bars = chartMonths.map(key => ({ key, ...finances(eligible.filter(booking => monthKey(booking.startAt) === key)) }));
  const max = Math.max(1, ...bars.map(bar => bar.net));

  return <Screen testID="owner-earnings">
    <Header title="Meus ganhos" subtitle="Uma visão clara de cada reserva." />
    <ScrollView horizontal style={{ flexGrow: 0 }} showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 8, alignItems: 'flex-start' }}>{months.map(key => <Pill key={key} title={monthLabel(key)} selected={month === key} onPress={() => setMonth(key)} />)}</ScrollView>
    <View style={common.wrap}><Pill title="Concluídos" selected={scope === 'completed'} onPress={() => setScope('completed')} /><Pill title="Previstos" selected={scope === 'open'} onPress={() => setScope('open')} /><Pill title="Todos" selected={scope === 'all'} onPress={() => setScope('all')} /></View>
    {garages.length > 1 && <View style={common.section}><Txt variant="label">Filtrar por vaga</Txt><View style={common.wrap}><Pill title="Todas as vagas" selected={garageId === 'all'} onPress={() => setGarageId('all')} />{garages.map(garage => <Pill key={garage.id} title={garage.name} selected={garageId === garage.id} onPress={() => setGarageId(garage.id)} />)}</View></View>}
    <View style={ownerStyles.balance}><Txt variant="label" color={colors.white}>{scope === 'open' ? 'Líquido previsto' : scope === 'all' ? 'Líquido concluído + previsto' : 'Ganhos líquidos concluídos'}</Txt><Txt variant="title" color={colors.white}>{money(totals.net)}</Txt><Txt variant="small" color="#DCE5F1">{monthLabel(month)} · {bookings.length} {bookings.length === 1 ? 'reserva' : 'reservas'}</Txt></View>
    <Card><MoneyRow label="Ganhos brutos" value={totals.gross} /><MoneyRow label="Comissão da plataforma · 15%" value={totals.commission} /><View style={common.divider} /><MoneyRow label="Seu repasse líquido · 85%" value={totals.net} emphasis /></Card>
    <Card>
      <Txt variant="heading">Resumo mensal</Txt>
      <Txt variant="small" color={colors.muted}>Líquido simulado · 6 meses até o mês selecionado</Txt>
      <ScrollView ref={chartRef} horizontal style={{ flexGrow: 0 }} contentContainerStyle={styles.chart} onContentSizeChange={() => chartRef.current?.scrollToEnd({ animated: false })} showsHorizontalScrollIndicator={false}>{bars.map(bar => <Pressable key={bar.key} onPress={() => setMonth(bar.key)} accessibilityRole="button" accessibilityLabel={`${monthLabel(bar.key)}: líquido de ${money(bar.net)}. Selecionar mês.`} accessibilityState={{ selected: bar.key === month }} style={[styles.column, { width: columnWidth }]}>
        <Txt variant="small" style={styles.barAmount}>{money(bar.net)}</Txt>
        <View style={styles.track}><View style={[styles.bar, { height: Math.max(bar.net > 0 ? 5 : 2, bar.net / max * 110), backgroundColor: bar.key === month ? colors.orange : colors.primary }]} /></View>
        <Txt variant="small" color={bar.key === month ? colors.primary : colors.muted}>{monthLabel(bar.key, true)}</Txt>
      </Pressable>)}</ScrollView>
      <Txt variant="small" color={colors.muted}>Deslize o gráfico para consultar os meses.</Txt>
      {!bars.some(bar => bar.net > 0) && <Txt variant="small" color={colors.muted}>Nenhum ganho nos meses e filtros exibidos.</Txt>}
    </Card>
    <View style={common.section}><Txt variant="heading">Histórico por reserva</Txt>{bookings.length ? bookings.map(booking => <BookingCard key={booking.id} booking={booking} onPress={onBooking ? () => onBooking(booking.id) : undefined} />) : <Card><Empty title="Sem ganhos neste período" description="Altere o mês ou consulte os valores previstos. Reservas canceladas ficam fora dos ganhos." icon="bar-chart-2" /></Card>}</View>
    <Notice>Resumo pelo mês da entrada da reserva, no horário de Recife. Reservas canceladas não geram ganhos. Nenhum pagamento ou transferência real é realizado.</Notice>
  </Screen>;
}

const styles = StyleSheet.create({
  chart: { flexDirection: 'row', alignItems: 'flex-end', gap: 6, paddingTop: 8 },
  column: { minHeight: 160, alignItems: 'center', gap: 7 },
  track: { height: 110, width: '100%', justifyContent: 'flex-end', alignItems: 'center' },
  bar: { width: '68%', borderRadius: 6 },
  barAmount: { textAlign: 'center', minHeight: 36, width: '100%' },
});
