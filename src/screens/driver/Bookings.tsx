import React, { useState } from 'react';
import { Alert, Linking, Pressable, ScrollView, View } from 'react-native';
import { money, statusLabels } from '../../domain/model';
import type { Booking, BookingStatus } from '../../domain/types';
import { useReadyApp } from '../../state/AppProvider';
import { Button, Card, common, Empty, Field, Header, Icon, Notice, Pill, Row, Screen, Txt } from '../../ui/components';
import { colors } from '../../ui/theme';
import { bookingPeriod, paymentLabels, useNow } from './shared';

const tabs: { status: BookingStatus; title: string }[] = [{ status: 'confirmed', title: 'Próximas' }, { status: 'active', title: 'Em andamento' }, { status: 'completed', title: 'Concluídas' }, { status: 'cancelled', title: 'Canceladas' }];
export function BookingsScreen({ onBooking, onExplore }: { onBooking: (id: string) => void; onExplore: () => void }) {
  const { state } = useReadyApp();
  const [selected, setSelected] = useState<BookingStatus>('confirmed');
  const mine = state.bookings.filter(booking => booking.driverId === 'local');
  const bookings = mine.filter(booking => booking.status === selected).sort((a, b) => selected === 'confirmed' || selected === 'active' ? a.startAt.localeCompare(b.startAt) : b.startAt.localeCompare(a.startAt));
  return <Screen testID="bookings-screen"><Header title="Minhas reservas" subtitle="Acompanhe cada parada, do início ao fim." />
    <ScrollView horizontal style={{ flexGrow: 0 }} showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 8, alignItems: 'flex-start' }}>{tabs.map(tab => <Pill key={tab.status} title={`${tab.title} (${mine.filter(booking => booking.status === tab.status).length})`} selected={selected === tab.status} onPress={() => setSelected(tab.status)} />)}</ScrollView>
    {bookings.length ? bookings.map(booking => <BookingCard key={booking.id} booking={booking} onPress={() => onBooking(booking.id)} />) : <Empty icon="calendar" title={selected === 'confirmed' ? 'Sua próxima vaga está esperando' : `Nenhuma reserva ${selected === 'active' ? 'em andamento' : selected === 'completed' ? 'concluída' : 'cancelada'}`} description={selected === 'confirmed' ? 'Encontre uma vaga perto do seu destino e reserve em poucos passos.' : 'As reservas aparecerão aqui quando estiverem neste status.'} action={selected === 'confirmed' ? <Button title="Encontrar uma vaga" onPress={onExplore} /> : undefined} />}
  </Screen>;
}
export function BookingCard({ booking, onPress }: { booking: Booking; onPress: () => void }) {
  return <Pressable accessibilityRole="button" accessibilityLabel={`Reserva ${booking.garageName}, ${statusLabels[booking.status]}, código ${booking.code}`} onPress={onPress}><Card><View style={common.between}><Pill title={statusLabels[booking.status]} /><Txt variant="label" color={colors.primary}>{money(booking.total)}</Txt></View><Txt variant="heading">{booking.garageName}</Txt><Row><Icon name="calendar" size={16} color={colors.muted} /><Txt variant="small" color={colors.muted} style={{ flex: 1 }}>{bookingPeriod(booking)}</Txt></Row><Txt variant="small" color={colors.muted}>{booking.plate} · {booking.vehicle}</Txt><View style={common.between}><Txt variant="label">{booking.code}</Txt><Icon name="arrow-up-right" color={colors.primary} size={20} /></View></Card></Pressable>;
}
function BookingReceipt({ booking, address }: { booking: Booking; address: string }) {
  return <Card style={{ borderStyle: 'dashed', borderColor: colors.primary }}><View style={common.between}><Txt variant="label" style={{ flex: 1 }}>{booking.garageName}</Txt><Icon name="map-pin" color={colors.primary} /></View><Txt variant="small" color={colors.muted}>{address}</Txt><View style={common.divider} /><Row><Icon name="calendar" size={18} /><Txt style={{ flex: 1 }}>{bookingPeriod(booking)}</Txt></Row><Row><Icon name="truck" size={18} /><View style={{ flex: 1 }}><Txt>{booking.plate}</Txt><Txt variant="small" color={colors.muted}>{booking.vehicle} · {booking.driverName}</Txt></View></Row><View style={common.divider} /><View style={{ alignItems: 'center', gap: 5 }}><Txt variant="small" color={colors.muted}>CÓDIGO DA RESERVA</Txt><Txt variant="heading" style={{ letterSpacing: 2 }}>{booking.code}</Txt><Txt variant="small" color={colors.muted}>Apresente este código na chegada</Txt></View><View style={common.divider} /><View style={common.between}><Txt variant="label" style={{ flex: 1 }}>Total simulado</Txt><Txt variant="heading" color={colors.primary} style={{ flexShrink: 0 }}>{money(booking.total)}</Txt></View><Txt variant="small" color={colors.muted}>{paymentLabels[booking.paymentMethod]} · {booking.billingMode === 'day' ? 'Por diária' : 'Por hora'}</Txt><Txt variant="small" color={colors.muted}>Nenhuma cobrança real · salvo neste aparelho</Txt></Card>;
}
function BookingReview({ booking }: { booking: Booking }) {
  const { state, dispatch } = useReadyApp();
  const existing = state.reviews.find(review => review.bookingId === booking.id && review.authorRole === state.role);
  const [score, setScore] = useState(0); const [comment, setComment] = useState(''); const [error, setError] = useState('');
  async function save() {
    setError('');
    if (!score) { setError('Selecione de 1 a 5 estrelas.'); return; }
    try { await dispatch({ type: 'review', review: { id: `review-${booking.id}-${state.role}`, bookingId: booking.id, authorRole: state.role, score, comment } }); }
    catch (reason) { setError(reason instanceof Error ? reason.message : 'Não foi possível salvar sua avaliação.'); }
  }
  if (existing) return <Card><Row><Icon name="check-circle" color={colors.primary} /><Txt variant="label">Sua avaliação foi salva</Txt></Row><Txt>{'★'.repeat(existing.score)}{'☆'.repeat(5 - existing.score)} · {existing.score} de 5</Txt>{!!existing.comment && <Txt color={colors.muted}>{existing.comment}</Txt>}</Card>;
  return <Card><Txt variant="heading">{state.role === 'owner' ? 'Como foi receber o motorista?' : 'Como foi sua experiência?'}</Txt><Txt variant="small" color={colors.muted}>{state.role === 'owner' ? `Avalie ${booking.driverName} nesta reserva concluída.` : 'Sua avaliação ficará salva com esta reserva.'}</Txt><View style={common.wrap}>{[1, 2, 3, 4, 5].map(value => <Pressable key={value} accessibilityRole="button" accessibilityLabel={`Avaliar com ${value} ${value === 1 ? 'estrela' : 'estrelas'}`} accessibilityState={{ selected: value === score }} onPress={() => setScore(value)} style={{ minWidth: 44, minHeight: 48, alignItems: 'center', justifyContent: 'center', backgroundColor: value <= score ? colors.orange : colors.background, borderRadius: 12 }}><Icon name="star" size={23} color={colors.ink} /></Pressable>)}</View><Txt variant="small">{score ? `${score} de 5 estrelas` : 'Escolha uma nota de 1 a 5'}</Txt><Field label="Comentário (opcional)" value={comment} onChangeText={setComment} placeholder="Conte como foi, sem dados pessoais." multiline maxLength={300} />{!!error && <Txt color={colors.danger}>{error}</Txt>}<Button title={state.role === 'owner' ? 'Salvar avaliação do motorista' : 'Salvar avaliação da vaga'} onPress={save} /></Card>;
}

export function BookingDetail({ bookingId, onBack, onHome, justBooked = false }: { bookingId: string; onBack: () => void; onHome?: () => void; justBooked?: boolean }) {
  const { state, dispatch } = useReadyApp();
  const [confirmation, setConfirmation] = useState(justBooked);
  const [feedback, setFeedback] = useState('');
  const now = useNow();
  const booking = state.bookings.find(item => item.id === bookingId);
  const garage = state.garages.find(item => item.id === booking?.garageId);
  const permitted = booking && (state.role === 'driver' ? booking.driverId === 'local' : garage?.ownerId === 'local');
  if (!booking || !permitted) return <Screen><Header title="Reserva indisponível" back={onBack} /><Empty title="Não foi possível abrir esta reserva" description="Você só pode consultar suas reservas ou, no modo Proprietário, reservas das suas vagas." /></Screen>;
  const ownedBooking = booking;
  const owner = state.role === 'owner';
  const start = Date.parse(booking.startAt); const end = Date.parse(booking.endAt);
  const canCheckIn = now >= start - 30 * 60000 && now < end;
  const canCancel = !owner && booking.status === 'confirmed' && start > now;
  const address = booking.status === 'cancelled' && !owner ? (garage?.approximateAddress ?? 'Acesso encerrado') : booking.address;
  async function update(status: 'cancelled' | 'active' | 'completed') {
    await dispatch({ type: 'bookingStatus', id: ownedBooking.id, status, now: new Date().toISOString() });
    setFeedback(status === 'cancelled' ? 'Reserva cancelada. Nenhum valor foi cobrado.' : status === 'active' ? 'Chegada registrada. Boa estadia!' : 'Estadia encerrada. Agora você pode avaliar.');
  }
  function updateWithFeedback(status: 'cancelled' | 'completed') {
    void update(status).catch((error: unknown) => Alert.alert('Não foi possível alterar a reserva', error instanceof Error ? error.message : 'Tente novamente.'));
  }
  function cancel() { Alert.alert('Cancelar esta reserva?', 'A vaga ficará disponível novamente. Nenhum valor foi cobrado.', [{ text: 'Manter reserva', style: 'cancel' }, { text: 'Cancelar reserva', style: 'destructive', onPress: () => updateWithFeedback('cancelled') }]); }
  function complete() { Alert.alert('Encerrar estadia?', 'Confirme que o veículo saiu da vaga. A estadia não poderá ser reaberta.', [{ text: 'Continuar estadia', style: 'cancel' }, { text: 'Encerrar estadia', onPress: () => updateWithFeedback('completed') }]); }
  if (confirmation && booking.status === 'confirmed' && !owner) return <Screen testID="booking-confirmation"><Header title="Reserva confirmada" /><View style={{ alignItems: 'center', gap: 12 }}><View style={{ width: 78, height: 78, borderRadius: 28, backgroundColor: colors.primaryLight, alignItems: 'center', justifyContent: 'center' }}><Icon name="check-circle" color={colors.primary} size={38} /></View><Txt variant="title" style={{ textAlign: 'center' }}>Sua vaga está garantida!</Txt><Txt color={colors.muted} style={{ textAlign: 'center' }}>Confirmação demonstrativa salva neste aparelho.</Txt></View><BookingReceipt booking={booking} address={address} /><Card><Txt variant="heading">Instruções de acesso</Txt><Txt>{booking.accessInstructions}</Txt></Card><Button title="Abrir reserva" icon="arrow-right" onPress={() => setConfirmation(false)} /><Button title="Voltar ao início" variant="secondary" onPress={onHome ?? onBack} /></Screen>;
  return <Screen testID="booking-detail"><Header title="Detalhes da reserva" back={onBack} /><Pill title={statusLabels[booking.status]} icon={booking.status === 'cancelled' ? 'x-circle' : booking.status === 'completed' ? 'check-circle' : 'clock'} />
    {!!feedback && <View accessibilityLiveRegion="polite"><Notice>{feedback}</Notice></View>}
    <BookingReceipt booking={booking} address={address} />
    {booking.status !== 'cancelled' && <Card><Txt variant="heading">Instruções de acesso</Txt><Txt>{booking.accessInstructions}</Txt><Txt variant="small" color={colors.muted}>Endereço e instruções fictícios para a demonstração.</Txt></Card>}
    <Card><Txt variant="label">Valores da reserva</Txt><View style={common.between}><Txt color={colors.muted} style={{ flex: 1 }}>Valor bruto</Txt><Txt style={{ flexShrink: 0 }}>{money(booking.total)}</Txt></View><View style={common.between}><Txt color={colors.muted} style={{ flex: 1 }}>Comissão incluída · 15%</Txt><Txt style={{ flexShrink: 0 }}>{money(booking.commission)}</Txt></View><View style={common.between}><Txt color={colors.muted} style={{ flex: 1 }}>Repasse simulado · 85%</Txt><Txt style={{ flexShrink: 0 }}>{money(booking.net)}</Txt></View></Card>
    {booking.status === 'confirmed' && <><Notice>{now >= end ? 'O período terminou sem check-in. A entrada e o cancelamento não estão mais disponíveis.' : canCheckIn ? 'O check-in está disponível. Registre a chegada ao entrar na vaga.' : 'O check-in ficará disponível 30 minutos antes da entrada prevista.'}</Notice><Button title={owner ? 'Registrar chegada do motorista' : 'Fazer check-in'} icon="log-in" disabled={!canCheckIn} onPress={() => update('active')} />{canCancel && <Button title="Cancelar reserva" variant="danger" onPress={cancel} />}{!owner && !canCancel && now < end && <Txt variant="small" color={colors.muted}>O cancelamento é permitido somente antes do horário de entrada.</Txt>}</>}
    {booking.status === 'active' && <><Notice>Ao sair, encerre a estadia para liberar a vaga e habilitar a avaliação.</Notice><Button title={owner ? 'Registrar saída do motorista' : 'Encerrar estadia'} icon="check-circle" onPress={complete} /></>}
    {booking.status === 'completed' && <BookingReview key={`${booking.id}-${state.role}`} booking={booking} />}
    {garage && booking.status !== 'cancelled' && <Button title="Ver região no aplicativo de mapas" variant="secondary" icon="navigation" onPress={() => Linking.openURL(`geo:${garage.latitude},${garage.longitude}?q=${garage.latitude},${garage.longitude}(${encodeURIComponent('Garagem PE - ponto fictício')})`)} />}
    <Button title="Voltar às reservas" variant="secondary" onPress={onBack} />
    {onHome && <Button title="Voltar ao início" variant="secondary" onPress={onHome} />}
  </Screen>;
}
