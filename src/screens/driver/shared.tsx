import React, { useEffect, useState } from 'react';
import { Alert, Image, Pressable, ScrollView, StyleSheet, View } from 'react-native';
import type { Amenity, Booking, Garage, PaymentMethod } from '../../domain/types';
import { useReadyApp } from '../../state/AppProvider';
import { GarageArt, Icon, Txt } from '../../ui/components';
import { colors } from '../../ui/theme';

export const amenityIcons: Record<Amenity, React.ComponentProps<typeof Icon>['name']> = {
  covered: 'home', camera: 'video', accessible: 'heart', electric: 'zap', gate: 'lock', lighting: 'sun', attendant: 'user-check',
};
export const paymentLabels: Record<PaymentMethod, string> = { pix: 'Pix simulado', card: 'Cartão simulado', cash: 'Dinheiro simulado' };
export const weekdayNames = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'];
export function dateLabel(value: string) { return new Date(value).toLocaleDateString('pt-BR', { day: '2-digit', month: 'short', year: 'numeric', timeZone: 'America/Recife' }); }
export function timeLabel(value: string) { return new Date(value).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit', timeZone: 'America/Recife' }); }
export function bookingPeriod(booking: Pick<Booking, 'startAt' | 'endAt'>) {
  return `${dateLabel(booking.startAt)} · ${timeLabel(booking.startAt)} – ${timeLabel(booking.endAt)}${dateLabel(booking.startAt) !== dateLabel(booking.endAt) ? ` (${dateLabel(booking.endAt)})` : ''}`;
}
export function durationLabel(hours: number) {
  const minutes = Math.round(hours * 60);
  return `${Math.floor(minutes / 60)}h${minutes % 60 ? ` ${minutes % 60}min` : ''}`;
}
export function useNow() {
  const [now, setNow] = useState(() => Date.now());
  useEffect(() => { const timer = setInterval(() => setNow(Date.now()), 30000); return () => clearInterval(timer); }, []);
  return now;
}
export function Favorite({ garage }: { garage: Garage }) {
  const { state, dispatch } = useReadyApp();
  const selected = state.favorites.includes(garage.id);
  return <Pressable accessibilityRole="button" accessibilityLabel={selected ? `Remover ${garage.name} dos favoritos` : `Favoritar ${garage.name}`} accessibilityState={{ selected }} onPress={() => { void dispatch({ type: 'favorite', garageId: garage.id }).catch((error: unknown) => Alert.alert('Não foi possível salvar', error instanceof Error ? error.message : 'Tente novamente.')); }} style={styles.favorite}><Icon name="heart" color={selected ? colors.danger : colors.ink} /></Pressable>;
}
function LocalPhoto({ uri, garage, large, compact = false }: { uri: string; garage: Garage; large: boolean; compact?: boolean }) {
  const [failed, setFailed] = useState(false);
  if (failed) return <GarageArt theme={garage.theme} large={large} compact={compact} />;
  return <Image accessibilityLabel={`Foto da vaga ${garage.name}`} source={{ uri }} resizeMode="cover" onError={() => setFailed(true)} style={{ width: '100%', height: compact ? 88 : large ? 210 : 142, borderRadius: 16 }} />;
}
export function GarageGallery({ garage, large = false, compact = false }: { garage: Garage; large?: boolean; compact?: boolean }) {
  const [width, setWidth] = useState(300);
  if (!garage.photos.length) return <GarageArt theme={garage.theme} large={large} compact={compact} />;
  if (!large || garage.photos.length === 1) return <LocalPhoto uri={garage.photos[0]!} garage={garage} large={large} compact={compact} />;
  return <View onLayout={event => setWidth(event.nativeEvent.layout.width)} style={{ gap: 7 }}>
    <ScrollView horizontal style={{ flexGrow: 0 }} pagingEnabled showsHorizontalScrollIndicator contentContainerStyle={{ gap: 0 }}>{garage.photos.map((uri, index) => <View key={uri} style={{ width }}><LocalPhoto uri={uri} garage={garage} large /><Txt variant="small" color={colors.muted}>Foto {index + 1} de {garage.photos.length}</Txt></View>)}</ScrollView>
    <Txt variant="small" color={colors.muted}>Deslize para ver todas as fotos.</Txt>
  </View>;
}
const styles = StyleSheet.create({ favorite: { width: 44, height: 44, borderRadius: 22, backgroundColor: colors.white, alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: colors.line } });
