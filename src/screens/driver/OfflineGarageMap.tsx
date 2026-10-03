import React, { useState } from 'react';
import { Pressable, StyleSheet, useWindowDimensions, View } from 'react-native';
import type { Garage, SearchFilters } from '../../domain/types';
import { money } from '../../domain/model';
import { Icon, Txt } from '../../ui/components';
import { colors } from '../../ui/theme';

/** A local coordinate overview, explicitly schematic rather than a street map. */
export function OfflineGarageMap({ garages, billingMode, onGarage }: { garages: Garage[]; billingMode: SearchFilters['billingMode']; onGarage: (id: string) => void }) {
  const [width, setWidth] = useState(300);
  const { fontScale } = useWindowDimensions();
  const priceLabel = (garage: Garage) => money(billingMode === 'day' && garage.pricePerDay !== null ? garage.pricePerDay : garage.pricePerHour);
  const longestPrice = Math.max(8, ...garages.map(garage => priceLabel(garage).length));
  const markerWidth = Math.min(width - 16, Math.max(76, Math.ceil(longestPrice * 7 * fontScale) + 16));
  const markerHeight = Math.max(44, Math.ceil(24 * fontScale) + 12);
  const maxLeft = Math.max(8, width - markerWidth - 8);
  const maxTop = Math.max(44, 246 - Math.ceil(30 * fontScale) - markerHeight);
  const longitudes = garages.map(garage => garage.longitude);
  const latitudes = garages.map(garage => garage.latitude);
  const minX = Math.min(...longitudes); const maxX = Math.max(...longitudes);
  const minY = Math.min(...latitudes); const maxY = Math.max(...latitudes);
  const positions: { x: number; y: number }[] = [];
  const markers = garages.map(garage => {
    const x = 8 + (maxX === minX ? 0.5 : (garage.longitude - minX) / (maxX - minX)) * Math.max(0, maxLeft - 8);
    const y = 44 + (maxY === minY ? 0.5 : (maxY - garage.latitude) / (maxY - minY)) * (maxTop - 44);
    const rowStep = markerHeight + 8; const columnStep = markerWidth + 6;
    const options = [0, -rowStep, rowStep, -rowStep * 2, rowStep * 2].flatMap(dy => [0, -columnStep, columnStep].map(dx => ({ x: Math.max(8, Math.min(maxLeft, x + dx)), y: Math.max(44, Math.min(maxTop, y + dy)) })));
    const position = options.find(candidate => !positions.some(previous => Math.abs(previous.x - candidate.x) < markerWidth + 3 && Math.abs(previous.y - candidate.y) < markerHeight + 3)) ?? { x, y };
    positions.push(position);
    return { garage, ...position };
  });
  return <View testID="offline-garage-map" onLayout={event => setWidth(event.nativeEvent.layout.width)} style={styles.map}>
    <View style={styles.water} /><View style={styles.blockOne} /><View style={styles.blockTwo} />
    <View style={styles.heading}><Icon name="map-pin" size={15} /><Txt variant="small" style={{ fontWeight: '700' }}>Visão local de Recife</Txt><Txt variant="small" color={colors.muted}>N ↑</Txt></View>
    {markers.map(({ garage, x, y }, index) => <Pressable key={garage.id} accessibilityRole="button" accessibilityLabel={`Abrir ${garage.name}, ${priceLabel(garage)}`} onPress={() => onGarage(garage.id)} style={[styles.marker, { left: x, top: y, width: markerWidth, minHeight: markerHeight, backgroundColor: index === 0 ? colors.orange : colors.primary }]}><Txt variant="label" color={index === 0 ? colors.primary : colors.white} style={{ fontSize: 12 }}>{priceLabel(garage)}</Txt><View style={[styles.tip, { borderTopColor: index === 0 ? colors.orange : colors.primary }]} /></Pressable>)}
    {!garages.length && <View style={styles.empty}><Icon name="search" color={colors.muted} /><Txt variant="small" color={colors.muted}>Nenhuma vaga nos filtros atuais.</Txt></View>}
    <Txt variant="small" color={colors.muted} style={styles.caption}>Esquema aproximado · não representa ruas ou rotas</Txt>
  </View>;
}
const styles = StyleSheet.create({ map: { height: 270, borderRadius: 18, overflow: 'hidden', backgroundColor: '#E9F0F6', position: 'relative' }, heading: { position: 'absolute', top: 11, left: 13, right: 13, flexDirection: 'row', alignItems: 'center', gap: 7 }, water: { position: 'absolute', top: 0, right: 0, bottom: 0, width: '18%', backgroundColor: '#D3EDF7' }, blockOne: { position: 'absolute', top: 60, left: '13%', width: '35%', height: 60, backgroundColor: '#DFE9F1', borderRadius: 16 }, blockTwo: { position: 'absolute', top: 153, left: '30%', width: '43%', height: 47, backgroundColor: '#DFE9F1', borderRadius: 12 }, marker: { position: 'absolute', width: 76, minHeight: 44, borderRadius: 14, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 4, borderWidth: 2, borderColor: colors.white }, tip: { position: 'absolute', bottom: -7, borderLeftWidth: 5, borderRightWidth: 5, borderTopWidth: 7, borderLeftColor: 'transparent', borderRightColor: 'transparent' }, caption: { position: 'absolute', bottom: 6, left: 8, right: 8, fontSize: 10, textAlign: 'center' }, empty: { position: 'absolute', top: 100, left: 15, right: 15, alignItems: 'center', gap: 10 } });
