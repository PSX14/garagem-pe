import React, { Component, useEffect, useState } from 'react';
import { ActivityIndicator, StyleSheet, View } from 'react-native';
import MapView, { Marker } from 'react-native-maps';
import type { Garage, Preferences, SearchFilters } from '../../domain/types';
import { money } from '../../domain/model';
import { Button, Notice, Txt } from '../../ui/components';
import { colors } from '../../ui/theme';
import { OfflineGarageMap } from './OfflineGarageMap';

class MapBoundary extends Component<React.PropsWithChildren<{ fallback: React.ReactNode }>, { failed: boolean }> {
  state = { failed: false };
  static getDerivedStateFromError() { return { failed: true }; }
  render() { return this.state.failed ? this.props.fallback : this.props.children; }
}
interface MapProps { garages: Garage[]; location: Preferences['location']; billingMode: SearchFilters['billingMode']; onGarage: (id: string) => void }
export function GarageMap(props: MapProps) {
  if (process.env.EXPO_PUBLIC_MAP_MODE === 'local') return <View style={{ gap: 10 }}><OfflineGarageMap garages={props.garages} billingMode={props.billingMode} onGarage={props.onGarage} /><Notice>Mapa aproximado de demonstração. Toque em um preço para abrir a vaga.</Notice></View>;
  return <GarageMapContent key={`${props.location.latitude}:${props.location.longitude}`} {...props} />;
}
function GarageMapContent({ garages, location, billingMode, onGarage }: MapProps) {
  const [loaded, setLoaded] = useState(false);
  const [fallback, setFallback] = useState(false);
  const [attempt, setAttempt] = useState(0);
  useEffect(() => { if (loaded || fallback) return; const timer = setTimeout(() => setFallback(true), 12000); return () => clearTimeout(timer); }, [attempt, loaded, fallback]);
  const localView = <View style={{ gap: 10 }}><OfflineGarageMap garages={garages} billingMode={billingMode} onGarage={onGarage} /><Notice>O mapa online não carregou. Os preços acima abrem as mesmas vagas da lista, usando os dados locais.</Notice><Button title="Tentar mapa online" variant="secondary" onPress={() => { setLoaded(false); setFallback(false); setAttempt(value => value + 1); }} /></View>;
  return <View style={{ gap: 10 }}><MapBoundary key={attempt} fallback={localView}>{fallback ? localView : <View style={styles.container}>
    <MapView key={`${location.latitude}:${location.longitude}:${attempt}`} testID="native-garage-map" accessibilityLabel="Mapa de vagas com preços e localizações aproximadas" style={StyleSheet.absoluteFill} initialRegion={{ latitude: location.latitude, longitude: location.longitude, latitudeDelta: 0.13, longitudeDelta: 0.13 }} onMapLoaded={() => setLoaded(true)} toolbarEnabled={false} showsUserLocation={false} loadingEnabled>
      <Marker coordinate={location} title={location.label} pinColor={colors.primary} />
      {garages.map(garage => <Marker key={`${garage.id}:${billingMode}`} coordinate={{ latitude: garage.latitude, longitude: garage.longitude }} title={garage.name} description={garage.approximateAddress} onPress={() => onGarage(garage.id)} accessibilityLabel={`${garage.name}, ${money(billingMode === 'day' && garage.pricePerDay !== null ? garage.pricePerDay : garage.pricePerHour)}`}><View style={styles.marker}><Txt variant="label" color={colors.ink}>{money(billingMode === 'day' && garage.pricePerDay !== null ? garage.pricePerDay : garage.pricePerHour)}</Txt></View></Marker>)}
    </MapView>
    {!loaded && <View pointerEvents="none" style={styles.loading}><ActivityIndicator color={colors.primary} /><Txt variant="small">Carregando mapa…</Txt></View>}
  </View>}</MapBoundary>
    {!fallback && <Txt variant="small" color={colors.muted}>Toque em um preço para abrir a vaga. Pontos aproximados; o mapa base pode precisar de internet.</Txt>}
  </View>;
}
const styles = StyleSheet.create({ container: { height: 240, borderRadius: 18, overflow: 'hidden', backgroundColor: colors.blue }, marker: { backgroundColor: colors.orange, paddingHorizontal: 10, paddingVertical: 7, borderRadius: 15, borderWidth: 2, borderColor: colors.white }, loading: { position: 'absolute', top: 14, alignSelf: 'center', padding: 10, borderRadius: 12, backgroundColor: colors.white, flexDirection: 'row', alignItems: 'center', gap: 8 } });
