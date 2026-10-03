import React, { useState } from 'react';
import { Pressable, View } from 'react-native';
import DateTimePicker from '@react-native-community/datetimepicker';
import { amenityLabels } from '../../domain/model';
import type { Amenity, Garage } from '../../domain/types';
import { Button, Card, common, Field, Icon, Notice, Pill, Row, Txt } from '../../ui/components';
import { colors } from '../../ui/theme';
import { APPROXIMATE_AREAS, currencyInput, DraftErrors, GarageDraft, UpdateDraft } from './garageForm';
import { OwnerColumns } from './OwnerLayout';

interface Props { draft: GarageDraft; update: UpdateDraft; errors: DraftErrors; disabled: boolean }

export function CheckRow({ title, checked, onPress, disabled = false }: { title: string; checked: boolean; onPress: () => void; disabled?: boolean }) {
  return <Pressable accessibilityRole="checkbox" accessibilityLabel={title} accessibilityState={{ checked, disabled }} disabled={disabled} onPress={onPress} style={{ flexDirection: 'row', alignItems: 'center', gap: 12, minHeight: 48, paddingVertical: 10 }}><View style={{ width: 26, height: 26, borderRadius: 8, borderWidth: 2, borderColor: colors.primary, backgroundColor: checked ? colors.primary : colors.white, alignItems: 'center', justifyContent: 'center' }}>{checked && <Icon name="check" size={18} color={colors.white} />}</View><Txt style={{ flex: 1 }}>{title}</Txt></Pressable>;
}

export function LocationFields({ draft, update, errors, disabled }: Props) {
  return <View style={common.section}>
    <Txt variant="heading">Localização da vaga</Txt>
    <Txt variant="small" color={colors.muted}>Escolha a região do ponto aproximado no mapa. Apenas esse ponto será exibido antes da confirmação.</Txt>
    <View style={common.wrap}>{APPROXIMATE_AREAS.map(area => <Pill key={area.label} title={area.label} selected={draft.latitude === area.latitude && draft.longitude === area.longitude && !!draft.approximateAddress} onPress={disabled ? undefined : () => { update('latitude', area.latitude); update('longitude', area.longitude); update('neighborhood', area.label); update('approximateAddress', `Região de ${area.label}, Recife – PE`); }} />)}</View>
    <Field label="Bairro" value={draft.neighborhood} onChangeText={value => update('neighborhood', value)} placeholder="Ex.: Boa Viagem" error={errors.neighborhood} maxLength={80} editable={!disabled} testID="garage-neighborhood" />
    <Field label="Endereço aproximado público" value={draft.approximateAddress} onChangeText={value => update('approximateAddress', value)} placeholder="Ex.: Região da Praça de Boa Viagem" error={errors.approximateAddress} maxLength={180} editable={!disabled} testID="garage-approximate-address" />
    <Txt variant="small" color={colors.muted}>Ponto demonstrativo: {draft.latitude.toFixed(4)}, {draft.longitude.toFixed(4)}. Não informe número residencial no endereço público.</Txt>
    <Field label="Endereço completo · privado" value={draft.address} onChangeText={value => update('address', value)} placeholder="Ex.: Rua Fictícia do Parque, 100" error={errors.address} maxLength={180} editable={!disabled} testID="garage-address" />
    <Field label="Complemento · opcional e privado" value={draft.complement} onChangeText={value => update('complement', value)} placeholder="Ex.: Vaga B, térreo" maxLength={120} editable={!disabled} testID="garage-complement" />
    <Field label="Ponto de referência" value={draft.landmark} onChangeText={value => update('landmark', value)} placeholder="Ex.: Próximo à praça do bairro" maxLength={120} error={errors.landmark} editable={!disabled} testID="garage-landmark" />
    <Notice>Use dados fictícios. O endereço completo, o complemento e as instruções de acesso só serão liberados para o motorista após confirmar a reserva.</Notice>
  </View>;
}

const amenities: Amenity[] = ['covered', 'gate', 'lighting', 'attendant', 'camera', 'accessible', 'electric'];
const spaceTypes: { value: Garage['spaceType']; label: string }[] = [{ value: 'garage', label: 'Garagem privada' }, { value: 'driveway', label: 'Área interna privada' }, { value: 'private_lot', label: 'Estacionamento privado' }];

export function StructureFields({ draft, update, errors, disabled }: Props) {
  return <View style={common.section}>
    <Txt variant="label">Tipo de vaga privada</Txt>
    <View style={common.wrap}>{spaceTypes.map(type => <Pill key={type.value} title={type.label} selected={draft.spaceType === type.value} onPress={disabled ? undefined : () => update('spaceType', type.value)} />)}</View>
    <Txt variant="small" color={colors.muted}>Vagas públicas na rua e calçadas não podem ser anunciadas.</Txt>
    <OwnerColumns><Field label="Largura (m)" value={draft.width} onChangeText={value => update('width', value)} placeholder="2,5" keyboardType="decimal-pad" maxLength={5} error={errors.width} editable={!disabled} testID="garage-width" /><Field label="Comprimento (m)" value={draft.length} onChangeText={value => update('length', value)} placeholder="5,0" keyboardType="decimal-pad" maxLength={5} error={errors.length} editable={!disabled} testID="garage-length" /></OwnerColumns>
    <Field label="Quantidade de vagas" value={draft.capacity} onChangeText={value => update('capacity', value.replace(/\D/g, ''))} keyboardType="number-pad" maxLength={3} error={errors.capacity} editable={!disabled} testID="garage-capacity" />
    <Txt variant="label">Veículos aceitos</Txt>
    <View style={common.wrap}>{(['car', 'motorcycle'] as const).map(type => <Pill key={type} title={type === 'car' ? 'Carro' : 'Motocicleta'} selected={draft.vehicleTypes.includes(type)} onPress={disabled ? undefined : () => update('vehicleTypes', draft.vehicleTypes.includes(type) ? draft.vehicleTypes.filter(item => item !== type) : [...draft.vehicleTypes, type])} />)}</View>
    {errors.vehicleTypes && <Txt variant="small" color={colors.danger}>{errors.vehicleTypes}</Txt>}
    <Txt variant="label">Comodidades</Txt>
    <View style={common.wrap}>{amenities.map(amenity => <Pill key={amenity} title={amenityLabels[amenity]} selected={draft.amenities.includes(amenity)} onPress={disabled ? undefined : () => update('amenities', draft.amenities.includes(amenity) ? draft.amenities.filter(item => item !== amenity) : [...draft.amenities, amenity])} />)}</View>
  </View>;
}

const dayLabels = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'];

export function PricingFields({ draft, update, errors, disabled }: Props) {
  const [picker, setPicker] = useState<'opens' | 'closes' | null>(null);
  const [expanded, setExpanded] = useState(false);
  const allDay = draft.availability.opens === '00:00' && draft.availability.closes === '24:00';
  const pickerTime = new Date();
  if (picker) { const [hours = '8', minutes = '0'] = draft.availability[picker].split(':'); pickerTime.setHours(Number(hours) % 24, Number(minutes), 0, 0); }
  return <View style={common.section}>
    <Txt variant="label">Disponibilidade</Txt>
    <Pressable accessibilityRole="button" accessibilityLabel={`Editar disponibilidade: ${draft.availability.days.map(day => dayLabels[day]).join(', ')}, ${draft.availability.opens} às ${draft.availability.closes}`} accessibilityState={{ expanded }} disabled={disabled} onPress={() => setExpanded(!expanded)}><Card><Row><View style={{ flex: 1, gap: 4 }}><Txt variant="label">{draft.availability.days.length === 7 ? 'Todos os dias' : draft.availability.days.map(day => dayLabels[day]).join(' · ') || 'Selecione os dias'}</Txt><Txt variant="small" color={colors.muted}>{draft.availability.opens} às {draft.availability.closes}</Txt></View><Icon name={expanded ? 'chevron-up' : 'edit-2'} color={colors.primary} /></Row></Card></Pressable>
    {(expanded || errors.availability) && <>
    <Txt variant="label">Dias disponíveis</Txt>
    <View style={common.wrap}>{dayLabels.map((label, day) => <Pill key={label} title={label} selected={draft.availability.days.includes(day)} onPress={disabled ? undefined : () => update('availability', { ...draft.availability, days: draft.availability.days.includes(day) ? draft.availability.days.filter(item => item !== day) : [...draft.availability.days, day].sort() })} />)}</View>
    <CheckRow title="Disponível 24 horas nos dias selecionados" checked={allDay} disabled={disabled} onPress={() => update('availability', { ...draft.availability, opens: allDay ? '08:00' : '00:00', closes: allDay ? '18:00' : '24:00' })} />
    <OwnerColumns><View style={{ gap: 8 }}><Txt variant="label">Horário inicial</Txt><Button title={draft.availability.opens} icon="clock" variant="secondary" disabled={disabled || allDay} onPress={() => setPicker('opens')} /></View><View style={{ gap: 8 }}><Txt variant="label">Horário final</Txt><Button title={draft.availability.closes} icon="clock" variant="secondary" disabled={disabled || allDay} onPress={() => setPicker('closes')} /></View></OwnerColumns>
    {!allDay && <CheckRow title="Encerrar à meia-noite (24:00)" checked={draft.availability.closes === '24:00'} disabled={disabled} onPress={() => update('availability', { ...draft.availability, closes: draft.availability.closes === '24:00' ? '18:00' : '24:00' })} />}
    {picker && <DateTimePicker value={pickerTime} mode="time" is24Hour onChange={(event, selected) => { const field = picker; setPicker(null); if (event.type === 'set' && selected) update('availability', { ...draft.availability, [field]: `${String(selected.getHours()).padStart(2, '0')}:${String(selected.getMinutes()).padStart(2, '0')}` }); }} />}
    {errors.availability && <Txt variant="small" color={colors.danger}>{errors.availability}</Txt>}
    <Txt variant="small" color={colors.muted}>Horários de Recife (UTC−3). O fim deve ser posterior ao início. Uma diária exige períodos de 24 horas disponíveis.</Txt>
    </>}
    <OwnerColumns>
      <Field label="Preço por hora (R$)" placeholder="0,00" value={draft.pricePerHour} onChangeText={value => update('pricePerHour', currencyInput(value))} keyboardType="number-pad" error={errors.pricePerHour} editable={!disabled} testID="garage-price" />
      <Field label="Diária opcional (R$)" placeholder="Opcional" value={draft.pricePerDay} onChangeText={value => update('pricePerDay', currencyInput(value))} keyboardType="number-pad" error={errors.pricePerDay} editable={!disabled} testID="garage-daily-price" />
    </OwnerColumns>
    <Txt variant="small" color={colors.muted}>Digite os centavos: 1500 = R$ 15,00. Diária = 24 horas. Seu repasse é de 85% do valor da reserva.</Txt>
  </View>;
}
