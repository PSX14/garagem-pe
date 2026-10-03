import React, { useState } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import DateTimePicker, { DateTimePickerChangeEvent } from '@react-native-community/datetimepicker';
import { availableSpaces, calculatePrice, isWithinAvailability, money } from '../../domain/model';
import type { AppState, BillingMode, Garage, PaymentMethod, VehicleType } from '../../domain/types';
import { useReadyApp } from '../../state/AppProvider';
import { Button, Card, common, Empty, Field, Header, Icon, Notice, Pill, Row, Screen, Txt } from '../../ui/components';
import { colors } from '../../ui/theme';
import { dateLabel, durationLabel, GarageGallery, paymentLabels, timeLabel } from './shared';
import { fromRecifePickerDate, toRecifePickerDate } from './dateTime';

type PickerTarget = 'startDate' | 'startTime' | 'endDate' | 'endTime';
function ScheduleRow({ label, value, onDate, onTime }: { label: 'entrada' | 'saída'; value: Date; onDate: () => void; onTime: () => void }) {
  return <Row style={{ alignItems: 'stretch' }}><Pressable accessibilityRole="button" accessibilityLabel={`Data de ${label}: ${dateLabel(value.toISOString())}`} onPress={onDate} style={[styles.dateControl, { flex: 1 }]}><Txt variant="small" color={colors.muted}>Data de {label}</Txt><Row style={{ gap: 6 }}><Icon name="calendar" size={16} /><Txt variant="label" style={{ flex: 1 }}>{dateLabel(value.toISOString())}</Txt></Row></Pressable><Pressable accessibilityRole="button" accessibilityLabel={`Horário de ${label}: ${timeLabel(value.toISOString())}`} onPress={onTime} style={[styles.dateControl, { minWidth: 91 }]}><Txt variant="small" color={colors.muted}>{label === 'entrada' ? 'Entrada' : 'Saída'}</Txt><Row style={{ gap: 6 }}><Icon name="clock" size={16} /><Txt variant="label">{timeLabel(value.toISOString())}</Txt></Row></Pressable></Row>;
}
function initialSchedule(garage: Garage | undefined, state: AppState) {
  const first = Math.ceil((Date.now() + 5 * 60000) / 900000) * 900000;
  if (garage) {
    for (let increment = 0; increment < 14 * 96; increment++) {
      const start = new Date(first + increment * 900000);
      const end = new Date(start.getTime() + 2 * 3600000);
      if (isWithinAvailability(garage, start.toISOString(), end.toISOString()) && availableSpaces(garage, state.bookings, start.toISOString(), end.toISOString()) > 0) return { start, end };
    }
  }
  return { start: new Date(first), end: new Date(first + 2 * 3600000) };
}
export function BookingSummary({ garage, hours, billingMode }: { garage: Garage; hours: number; billingMode: BillingMode }) {
  const price = calculatePrice(garage, hours, billingMode);
  return <Card><Txt variant="heading">Resumo de valores</Txt><View style={common.between}><Txt color={colors.muted} style={{ flex: 1 }}>Tempo total</Txt><Txt style={{ flexShrink: 0 }}>{durationLabel(hours)}</Txt></View><Txt variant="small" color={colors.muted}>{billingMode === 'day' ? `${Math.ceil(hours / 24)} diária(s) × ${money(garage.pricePerDay ?? 0)}` : `${money(garage.pricePerHour)}/h × ${durationLabel(hours)}`}</Txt><View style={common.between}><Txt color={colors.muted} style={{ flex: 1 }}>Valor da vaga (85%)</Txt><Txt style={{ flexShrink: 0 }}>{money(price.net)}</Txt></View><View style={common.between}><Txt color={colors.muted} style={{ flex: 1 }}>Comissão incluída (15%)</Txt><Txt style={{ flexShrink: 0 }}>{money(price.commission)}</Txt></View><View style={common.divider} /><View style={common.between}><Txt variant="label" style={{ flex: 1 }}>Total simulado</Txt><Txt variant="heading" color={colors.primary} style={{ flexShrink: 0 }}>{money(price.total)}</Txt></View><Txt variant="small" color={colors.muted}>O preço anunciado já inclui a comissão. Nenhum valor será cobrado.</Txt></Card>;
}
function AddVehicle({ onSaved, onClose }: { onSaved: (id: string) => void; onClose: () => void }) {
  const { dispatch } = useReadyApp();
  const [label, setLabel] = useState(''); const [plate, setPlate] = useState(''); const [type, setType] = useState<VehicleType>('car');
  const [error, setError] = useState('');
  async function save() {
    setError(''); const id = `vehicle-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
    try { await dispatch({ type: 'saveVehicle', vehicle: { id, label, plate, type } }); onSaved(id); }
    catch (reason) { setError(reason instanceof Error ? reason.message : 'Não foi possível salvar o veículo.'); }
  }
  return <Card><Txt variant="label">Novo veículo demonstrativo</Txt><Field label="Modelo e cor" value={label} onChangeText={setLabel} placeholder="Ex.: Compacto azul" maxLength={80} /><Field label="Placa fictícia" value={plate} onChangeText={setPlate} placeholder="ABC1D23" autoCapitalize="characters" autoCorrect={false} maxLength={8} /><View style={common.wrap}><Pill title="Carro" selected={type === 'car'} onPress={() => setType('car')} /><Pill title="Motocicleta" selected={type === 'motorcycle'} onPress={() => setType('motorcycle')} /></View>{!!error && <Txt color={colors.danger}>{error}</Txt>}<Button title="Salvar veículo" onPress={save} /><Button title="Fechar cadastro de veículo" variant="secondary" onPress={onClose} /></Card>;
}
export function BookingForm({ garageId, onBack, onBooked }: { garageId: string; onBack: () => void; onBooked: (id: string) => void }) {
  const { state, dispatch } = useReadyApp();
  const garage = state.garages.find(item => item.id === garageId);
  const [schedule, setSchedule] = useState(() => initialSchedule(garage, state));
  const [picker, setPicker] = useState<PickerTarget | null>(null);
  const [vehicleId, setVehicleId] = useState(() => state.vehicles.find(vehicle => garage?.vehicleTypes.includes(vehicle.type))?.id ?? '');
  const [addingVehicle, setAddingVehicle] = useState(false);
  const [payment, setPayment] = useState<PaymentMethod>('pix');
  const [billing, setBilling] = useState<BillingMode>(state.filters.billingMode === 'day' && garage?.pricePerDay ? 'day' : 'hour');
  const [error, setError] = useState('');
  const [submittedId] = useState(() => `res-${Date.now()}-${Math.random().toString(36).slice(2, 10)}`);
  if (!garage) return <Screen><Header title="Vaga indisponível" back={onBack} /><Empty title="Vaga não encontrada" description="Volte à busca e escolha outra vaga." /></Screen>;
  const hours = (schedule.end.getTime() - schedule.start.getTime()) / 3600000;
  const validDuration = hours >= 1;
  const spaces = validDuration ? availableSpaces(garage, state.bookings, schedule.start.toISOString(), schedule.end.toISOString()) : 0;
  const withinSchedule = validDuration && isWithinAvailability(garage, schedule.start.toISOString(), schedule.end.toISOString());
  const vehicle = state.vehicles.find(item => item.id === vehicleId);
  function selectDate(_event: DateTimePickerChangeEvent, selected: Date) {
    const target = picker; setPicker(null);
    if (!target) return;
    setSchedule(current => {
      const key = target.startsWith('start') ? 'start' : 'end'; const next = toRecifePickerDate(current[key]);
      if (target.endsWith('Date')) next.setFullYear(selected.getFullYear(), selected.getMonth(), selected.getDate());
      else next.setHours(selected.getHours(), selected.getMinutes(), 0, 0);
      return { ...current, [key]: fromRecifePickerDate(next) };
    });
    setError('');
  }
  async function submit() {
    setError('');
    if (!vehicle) { setError('Selecione ou cadastre um veículo.'); return; }
    try {
      await dispatch({ type: 'book', id: submittedId, now: new Date().toISOString(), input: { garageId, startAt: schedule.start.toISOString(), endAt: schedule.end.toISOString(), hours, plate: vehicle.plate, vehicle: vehicle.label, vehicleType: vehicle.type, billingMode: billing, paymentMethod: payment } });
      onBooked(submittedId);
    } catch (reason) { setError(reason instanceof Error ? reason.message : 'Não foi possível reservar. Tente novamente.'); }
  }
  return <Screen testID="booking-form"><Header title="Confirmar reserva" back={onBack} /><View style={{ gap: 5 }}><Txt variant="title" style={{ fontSize: 29, lineHeight: 35 }}>Revise os detalhes</Txt><Txt color={colors.muted}>Sua vaga ficará reservada após a confirmação.</Txt></View>
    <Card><Row style={{ alignItems: 'center' }}><View style={{ width: 85 }}><GarageGallery garage={garage} compact /></View><View style={{ flex: 1, gap: 5 }}><Txt variant="label" style={{ fontSize: 16 }}>{garage.name}</Txt><Txt variant="small" color={colors.muted}>{garage.neighborhood} · {garage.approximateAddress}</Txt><Row><Icon name="star" size={14} color={colors.success} /><Txt variant="small" color={colors.successText}>{garage.rating.toLocaleString('pt-BR', { minimumFractionDigits: 1, maximumFractionDigits: 1 })} · Vaga privada</Txt></Row><Txt variant="label" color={colors.primary}>{money(garage.pricePerHour)}/h</Txt></View></Row></Card>
    <Card><Txt variant="heading">Data e horário</Txt><ScheduleRow label="entrada" value={schedule.start} onDate={() => setPicker('startDate')} onTime={() => setPicker('startTime')} /><ScheduleRow label="saída" value={schedule.end} onDate={() => setPicker('endDate')} onTime={() => setPicker('endTime')} />
      <View style={common.wrap}>{[1, 2, 4, 8, 24].map(value => <Pill key={value} title={`Ficar ${value}h`} selected={hours === value} onPress={() => setSchedule(current => ({ ...current, end: new Date(current.start.getTime() + value * 3600000) }))} />)}</View>
      {!validDuration ? <Notice>A saída precisa ser posterior à entrada, com duração mínima de 1 hora.</Notice> : !withinSchedule ? <Notice>O período escolhido está fora dos horários disponíveis ({garage.availability.opens} às {garage.availability.closes}). Confira os dias nos detalhes e ajuste entrada ou saída.</Notice> : <Notice>{spaces} {spaces === 1 ? 'vaga livre' : 'vagas livres'} nesse período · {durationLabel(hours)} no total.</Notice>}
      <Txt variant="small" color={colors.muted}>Datas e horários no fuso de Recife (UTC−03).</Txt>
    </Card>
    {picker && <DateTimePicker testID="booking-datetime-picker" value={toRecifePickerDate(picker.startsWith('start') ? schedule.start : schedule.end)} mode={picker.endsWith('Date') ? 'date' : 'time'} minimumDate={picker.endsWith('Date') ? toRecifePickerDate(new Date()) : undefined} is24Hour display="default" onValueChange={selectDate} onDismiss={() => setPicker(null)} />}
    <Card><Txt variant="heading">Seu veículo</Txt>{state.vehicles.map(item => <Pill key={item.id} title={`${item.label} · ${item.plate}${garage.vehicleTypes.includes(item.type) ? '' : ' · não aceito nesta vaga'}`} selected={vehicleId === item.id} icon="truck" onPress={() => setVehicleId(item.id)} />)}{!state.vehicles.length && <Notice>Cadastre um veículo fictício para continuar.</Notice>}<Button title="Adicionar veículo" variant="secondary" icon="plus" onPress={() => setAddingVehicle(true)} />{addingVehicle && <AddVehicle onSaved={id => { setVehicleId(id); setAddingVehicle(false); }} onClose={() => setAddingVehicle(false)} />}</Card>
    <Card><Txt variant="heading">Tipo de reserva</Txt><View style={common.wrap}><Pill title={`Por hora · ${money(garage.pricePerHour)}`} selected={billing === 'hour'} onPress={() => setBilling('hour')} />{garage.pricePerDay !== null && <Pill title={`Por diária · ${money(garage.pricePerDay)}`} selected={billing === 'day'} onPress={() => setBilling('day')} />}</View>{billing === 'day' && <Txt variant="small" color={colors.muted}>Cada diária cobre até 24 horas. Os horários de funcionamento da vaga continuam valendo.</Txt>}</Card>
    <Card><Txt variant="heading">Pagamento</Txt><View style={common.wrap}>{(['pix', 'card', 'cash'] as const).map(value => <Pill key={value} title={paymentLabels[value]} selected={payment === value} onPress={() => setPayment(value)} />)}</View><Notice>Escolha apenas a forma simulada. Não informe cartão, CPF, conta bancária ou chave Pix.</Notice></Card>
    {validDuration && <BookingSummary garage={garage} hours={hours} billingMode={billing} />}
    <Notice>Cancelamento gratuito enquanto o horário de entrada estiver no futuro. Depois da entrada prevista, o cancelamento não estará disponível. Esta reserva é fictícia.</Notice>
    {!!error && <View accessibilityLiveRegion="polite"><Txt color={colors.danger} style={{ fontWeight: '600' }}>{error}</Txt></View>}
    <Button title="Confirmar reserva simulada" testID="confirm-booking" icon="check" disabled={!garage.active || state.role !== 'driver'} onPress={submit} />
  </Screen>;
}
const styles = StyleSheet.create({ dateControl: { padding: 12, minHeight: 65, borderRadius: 14, borderWidth: 1, borderColor: colors.line, backgroundColor: colors.background, gap: 5 } });
