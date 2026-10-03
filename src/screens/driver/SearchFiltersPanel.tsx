import React, { useState } from 'react';
import { Switch, View } from 'react-native';
import type { SearchFilters } from '../../domain/types';
import { defaultFilters } from '../../domain/model';
import { Button, Card, common, Field, Pill, Txt } from '../../ui/components';
import { colors } from '../../ui/theme';

export function SearchFiltersPanel({ filters, onApply, onClose }: { filters: SearchFilters; onApply: (value: SearchFilters) => void; onClose: () => void }) {
  const [draft, setDraft] = useState(filters);
  const [price, setPrice] = useState(filters.maxPrice === null ? '' : String(filters.maxPrice / 100).replace('.', ','));
  const [distance, setDistance] = useState(filters.maxDistanceKm === null ? '' : String(filters.maxDistanceKm).replace('.', ','));
  const [error, setError] = useState('');
  function apply() {
    const maxPrice = price.trim() ? Math.round(Number(price.replace(',', '.')) * 100) : null;
    const maxDistanceKm = distance.trim() ? Number(distance.replace(',', '.')) : null;
    if ((maxPrice !== null && (!Number.isSafeInteger(maxPrice) || maxPrice <= 0)) || (maxDistanceKm !== null && (!Number.isFinite(maxDistanceKm) || maxDistanceKm <= 0))) {
      setError('Informe preço e distância maiores que zero, ou deixe em branco para não limitar.'); return;
    }
    onApply({ ...draft, maxPrice, maxDistanceKm });
  }
  const update = (patch: Partial<SearchFilters>) => setDraft(current => ({ ...current, ...patch }));
  return <Card>
    <Txt variant="heading">Encontre a vaga ideal</Txt>
    <Field label={draft.billingMode === 'day' ? 'Preço máximo por diária (R$)' : 'Preço máximo por hora (R$)'} value={price} onChangeText={setPrice} keyboardType="decimal-pad" placeholder="Sem limite" maxLength={9} />
    <Field label="Distância máxima (km)" value={distance} onChangeText={setDistance} keyboardType="decimal-pad" placeholder="Sem limite" maxLength={7} />
    <Txt variant="small" color={colors.muted}>Distâncias em linha reta a partir do local selecionado.</Txt>
    <Txt variant="label">Veículo</Txt>
    <View style={common.wrap}>{(['all', 'car', 'motorcycle'] as const).map(value => <Pill key={value} title={value === 'all' ? 'Todos' : value === 'car' ? 'Carro' : 'Motocicleta'} selected={draft.vehicleType === value} onPress={() => update({ vehicleType: value })} />)}</View>
    <Txt variant="label">Tipo de reserva</Txt>
    <View style={common.wrap}>{(['all', 'hour', 'day'] as const).map(value => <Pill key={value} title={value === 'all' ? 'Hora ou diária' : value === 'hour' ? 'Por hora' : 'Por diária'} selected={draft.billingMode === value} onPress={() => update({ billingMode: value })} />)}</View>
    {([{ key: 'covered', label: 'Vaga coberta' }, { key: 'gate', label: 'Portão eletrônico' }, { key: 'immediate', label: draft.billingMode === 'day' ? 'Disponível agora por 24 horas' : 'Disponível agora por 1 hora' }, { key: 'today', label: 'Possibilidade de entrada hoje' }] as const).map(({ key, label }) => <View key={key} style={common.between}><Txt style={{ flex: 1 }}>{label}</Txt><Switch accessibilityLabel={label} value={Boolean(draft[key])} onValueChange={value => update({ [key]: value })} trackColor={{ false: colors.line, true: colors.primary }} /></View>)}
    <Txt variant="label">Avaliação mínima</Txt>
    <View style={common.wrap}>{[0, 3, 4, 4.5].map(value => <Pill key={value} title={value === 0 ? 'Qualquer nota' : `${value.toLocaleString('pt-BR')}+ ★`} selected={draft.minRating === value} onPress={() => update({ minRating: value })} />)}</View>
    <Txt variant="label">Ordenar por</Txt>
    <View style={common.wrap}>{([{ value: 'rating', label: 'Avaliação' }, { value: 'price', label: 'Menor preço' }, { value: 'distance', label: 'Mais próximas' }] as const).map(({ value, label }) => <Pill key={value} title={label} selected={draft.sort === value} onPress={() => update({ sort: value })} />)}</View>
    {!!error && <Txt color={colors.danger}>{error}</Txt>}
    <Button title="Aplicar filtros" icon="check" onPress={apply} />
    <Button title="Limpar filtros" variant="secondary" onPress={() => { const next = { ...defaultFilters(), query: filters.query }; setDraft(next); setPrice(''); setDistance(''); setError(''); }} />
    <Button title="Fechar filtros" variant="secondary" onPress={onClose} />
  </Card>;
}
