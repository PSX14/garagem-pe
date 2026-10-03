import React, { useState } from 'react';
import { ActivityIndicator, Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { distanceKm, defaultFilters, filterGarages, money } from '../../domain/model';
import type { Garage, SearchFilters } from '../../domain/types';
import { currentLocation, manualLocations } from '../../services/location';
import { useReadyApp } from '../../state/AppProvider';
import { BrandLogo, Button, Card, common, Empty, Field, Header, Icon, Notice, Pill, Row, Screen, Txt } from '../../ui/components';
import { colors } from '../../ui/theme';
import { Favorite, GarageGallery, useNow } from './shared';
import { SearchFiltersPanel } from './SearchFiltersPanel';
import { GarageMap } from './GarageMap';

export function GarageCard({ garage, distance, onPress, billingMode = 'all' }: { garage: Garage; distance: number; onPress: () => void; billingMode?: SearchFilters['billingMode'] }) {
  const daily = billingMode === 'day' && garage.pricePerDay !== null;
  return <Card style={{ padding: 12 }}><Row style={{ alignItems: 'center', gap: 12 }}>
    <Pressable accessibilityRole="button" accessibilityLabel={`Ver foto e detalhes de ${garage.name}`} onPress={onPress} style={{ width: 86 }}><GarageGallery garage={garage} compact /></Pressable>
    <Pressable accessibilityRole="button" accessibilityLabel={`Detalhes de ${garage.name}, ${garage.neighborhood}, ${money(daily ? garage.pricePerDay! : garage.pricePerHour)} por ${daily ? 'diária' : 'hora'}`} onPress={onPress} style={{ flex: 1, gap: 5 }}>
      <Txt variant="label" style={{ fontSize: 15, paddingRight: 32 }}>{garage.name}</Txt>
      <Txt variant="small" color={colors.muted}>{garage.neighborhood} · {distance.toLocaleString('pt-BR', { maximumFractionDigits: 1 })} km</Txt>
      <Txt variant="small" color={colors.muted}>{garage.amenities.includes('covered') ? 'Coberta' : 'Descoberta'} · {garage.vehicleTypes.map(type => type === 'car' ? 'Carro' : 'Moto').join(' e ')}</Txt>
      <View style={common.between}><Row style={{ gap: 4 }}><Icon name="star" size={14} color="#B85D00" /><Txt variant="small">{garage.rating.toLocaleString('pt-BR', { minimumFractionDigits: 1, maximumFractionDigits: 1 })}</Txt></Row><Txt variant="label" color={colors.primary} style={{ fontSize: 18 }}>{money(daily ? garage.pricePerDay! : garage.pricePerHour)}<Txt variant="small" color={colors.muted}>/{daily ? 'dia' : 'h'}</Txt></Txt></View>
    </Pressable></Row><View style={styles.favoriteOverlay}><Favorite garage={garage} /></View>
  </Card>;
}

function QuickChoice({ title, selected, icon, onPress }: { title: string; selected?: boolean; icon?: React.ComponentProps<typeof Icon>['name']; onPress: () => void }) {
  return <Pressable accessibilityRole="button" accessibilityLabel={title} accessibilityState={{ selected }} onPress={onPress} style={[styles.quickChoice, selected && { backgroundColor: colors.orange, borderColor: colors.orange }]}>{icon && <Icon name={icon} size={16} />}<Txt variant="small" style={{ fontWeight: '700' }}>{title}</Txt></Pressable>;
}

export function ExploreScreen({ onGarage, favoritesOnly = false }: { onGarage: (id: string) => void; favoritesOnly?: boolean }) {
  const { state, dispatch } = useReadyApp();
  const [filters, setFilters] = useState(state.filters);
  const [showFilters, setShowFilters] = useState(false);
  const [manual, setManual] = useState(false);
  const [locating, setLocating] = useState(false);
  const [feedback, setFeedback] = useState('');
  const now = useNow();
  const garages = filterGarages({ ...state, filters }, new Date(now)).filter(garage => !favoritesOnly || state.favorites.includes(garage.id));
  const nearby = [...garages].sort((a, b) => distanceKm(state.preferences.location, a) - distanceKm(state.preferences.location, b)).slice(0, 3);
  const failure = (error: unknown) => setFeedback(error instanceof Error ? error.message : 'Não foi possível salvar. Tente novamente.');
  function updateFilters(next: SearchFilters) { setFilters(next); void dispatch({ type: 'filters', filters: next }).catch(failure); }
  async function locate() {
    setLocating(true); setFeedback('');
    try { const location = await currentLocation(); await dispatch({ type: 'preferences', preferences: { ...state.preferences, location } }); setManual(false); }
    catch (error) { failure(error); setManual(true); }
    finally { setLocating(false); }
  }
  const activeCount = Number(filters.maxPrice !== null) + Number(filters.maxDistanceKm !== null) + Number(filters.covered) + Number(filters.gate) + Number(filters.vehicleType !== 'all') + Number(filters.immediate) + Number(Boolean(filters.today)) + Number(filters.billingMode !== 'all') + Number(filters.minRating > 0);
  const dark = !favoritesOnly;
  const headingColor = dark ? colors.white : colors.ink;
  const secondaryColor = dark ? '#C8D4E5' : colors.muted;
  return <Screen testID="explore-screen" tone={dark ? 'dark' : 'light'}>
    {favoritesOnly ? <Header title="Seus favoritos" subtitle="Bons lugares para voltar." /> : <><Row style={{ justifyContent: 'space-between' }}><BrandLogo light /><View style={styles.cityBadge}><Txt variant="label" color={colors.white}>Recife • PE</Txt></View></Row><View style={{ gap: 6 }}><Txt variant="small" color={secondaryColor}>Olá, {state.profile.name.split(' ')[0]}!</Txt><Txt variant="heading" color={colors.white} style={{ fontSize: 27, lineHeight: 33 }}>Onde você quer estacionar?</Txt><Txt color={secondaryColor}>Encontre e reserve uma vaga antes de chegar.</Txt></View></>}
    <Card style={{ gap: 9, padding: 15 }}><Field label="Para onde você vai?" placeholder="Bairro, região ou ponto de interesse" value={filters.query} onChangeText={query => updateFilters({ ...filters, query })} autoCorrect={false} maxLength={120} returnKeyType="search" style={{ backgroundColor: colors.background }} /><Row><Pressable accessibilityRole="button" accessibilityLabel={manual ? 'Fechar bairros' : 'Escolher bairro'} onPress={() => setManual(value => !value)} style={{ flex: 1, flexDirection: 'row', gap: 7, alignItems: 'center', minHeight: 44 }}><Icon name="map-pin" color={colors.primary} size={16} /><Txt variant="small" style={{ flex: 1 }} color={colors.muted}>{state.preferences.location.label}</Txt><Icon name="chevron-down" size={16} /></Pressable><Pressable accessibilityRole="button" accessibilityLabel="Usar localização atual" accessibilityState={{ busy: locating, disabled: locating }} disabled={locating} onPress={() => { void locate(); }} style={styles.locationButton}>{locating ? <ActivityIndicator color={colors.primary} /> : <Icon name="crosshair" color={colors.primary} />}</Pressable></Row>{locating && <Txt variant="small" color={colors.muted}>Buscando sua localização…</Txt>}</Card>
    {!!feedback && <Notice>{feedback}</Notice>}
    {manual && <Card><Txt variant="label">De onde você quer procurar?</Txt><View style={common.wrap}>{manualLocations.map(location => <Pill key={location.label} title={location.label} selected={state.preferences.location.label === location.label} onPress={() => { void dispatch({ type: 'preferences', preferences: { ...state.preferences, location } }).then(() => { setManual(false); setFeedback(''); }).catch(failure); }} />)}</View><Txt variant="small" color={colors.muted}>A seleção define o ponto de partida das distâncias. Use a busca para limitar os resultados a um destino.</Txt></Card>}
    <View style={common.wrap}><QuickChoice title="Agora" selected={filters.immediate} onPress={() => updateFilters({ ...filters, immediate: !filters.immediate, today: false })} /><QuickChoice title="Hoje" selected={Boolean(filters.today)} onPress={() => updateFilters({ ...filters, today: !filters.today, immediate: false })} /><QuickChoice title={`Filtros${activeCount ? ` (${activeCount})` : ''}`} icon="sliders" selected={showFilters} onPress={() => setShowFilters(value => !value)} /></View>
    {filters.today && <Txt variant="small" color={secondaryColor}>Vagas com entrada possível ainda hoje, no horário de Recife.</Txt>}
    {showFilters && <SearchFiltersPanel filters={filters} onApply={next => { updateFilters(next); setShowFilters(false); }} onClose={() => setShowFilters(false)} />}
    <View style={{ gap: 12 }}><View style={[common.between, { flexWrap: 'wrap', rowGap: 10 }]}><Txt variant="label" color={headingColor}>Explore as vagas</Txt><Row style={{ gap: 6, flexWrap: 'wrap' }}><QuickChoice title="Mapa" icon="map" selected={state.preferences.view === 'map'} onPress={() => { void dispatch({ type: 'preferences', preferences: { ...state.preferences, view: 'map' } }).catch(failure); }} /><QuickChoice title="Lista" icon="list" selected={state.preferences.view === 'list'} onPress={() => { void dispatch({ type: 'preferences', preferences: { ...state.preferences, view: 'list' } }).catch(failure); }} /></Row></View>{state.preferences.view === 'map' && <Card style={{ padding: 7 }}><GarageMap garages={garages} location={state.preferences.location} billingMode={filters.billingMode} onGarage={onGarage} /></Card>}</View>
    <View style={{ gap: 8 }}><Txt variant="heading" color={headingColor}>{favoritesOnly ? 'Salvas por você' : filters.sort === 'rating' ? 'Vagas recomendadas' : filters.sort === 'price' ? 'Vagas pelo menor preço' : 'Vagas mais próximas'}</Txt><Txt variant="small" color={secondaryColor}>{garages.length} {garages.length === 1 ? 'vaga encontrada' : 'vagas encontradas'} · {filters.billingMode === 'day' ? 'valores por diária' : 'valores por hora'}</Txt></View>
    {garages.length === 0 ? <Card><Empty icon={favoritesOnly ? 'heart' : 'search'} title={favoritesOnly && !state.favorites.length ? 'Sua próxima vaga favorita' : 'Nenhuma vaga encontrada'} description={favoritesOnly && !state.favorites.length ? 'Toque no coração de uma vaga para salvá-la aqui.' : 'Experimente outro bairro, aumente a distância ou remova os filtros.'} action={<Button title="Limpar busca e filtros" variant="secondary" onPress={() => updateFilters(defaultFilters())} />} /></Card> : garages.map(garage => <GarageCard key={garage.id} garage={garage} distance={distanceKm(state.preferences.location, garage)} billingMode={filters.billingMode} onPress={() => onGarage(garage.id)} />)}
    {!favoritesOnly && nearby.length > 0 && <View style={{ gap: 10 }}><Txt variant="label" color={headingColor}>Vagas próximas de você</Txt><ScrollView horizontal style={{ flexGrow: 0 }} showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 8, alignItems: 'flex-start' }}>{nearby.map(garage => <Pill key={garage.id} title={`${garage.neighborhood} · ${distanceKm(state.preferences.location, garage).toLocaleString('pt-BR', { maximumFractionDigits: 1 })} km`} icon="map-pin" onPress={() => onGarage(garage.id)} />)}</ScrollView></View>}
    <Txt variant="small" color={secondaryColor}>Catálogo fictício · distâncias aproximadas. Pesquisa, favoritos e reservas funcionam offline e ficam salvos neste aparelho.</Txt>
  </Screen>;
}
const styles = StyleSheet.create({ cityBadge: { paddingHorizontal: 16, paddingVertical: 10, borderRadius: 16, backgroundColor: '#203D60' }, favoriteOverlay: { position: 'absolute', right: 5, top: 5 }, quickChoice: { minHeight: 44, borderRadius: 24, borderWidth: 1, borderColor: colors.line, backgroundColor: colors.white, paddingHorizontal: 13, paddingVertical: 9, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6 }, locationButton: { width: 44, height: 44, borderRadius: 13, backgroundColor: colors.primaryLight, alignItems: 'center', justifyContent: 'center' } });
