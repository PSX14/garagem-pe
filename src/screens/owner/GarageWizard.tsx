import React from 'react';
import { Alert, Image, Pressable, StyleSheet, View } from 'react-native';
import { Card, common, Icon, Row, Txt } from '../../ui/components';
import { colors } from '../../ui/theme';
import { GarageDraft } from './garageForm';

export const wizardTitles = ['Sobre a sua vaga', 'Estrutura do espaço', 'Informações da vaga', 'Revise e publique'];

export function WizardProgress({ step }: { step: number }) {
  return <View style={common.section}>
    <Txt variant="heading">{wizardTitles[step]}</Txt><Txt variant="label" color={colors.muted}>Etapa {step + 1} de 4</Txt>
    <View accessibilityRole="progressbar" accessibilityLabel="Progresso do cadastro" accessibilityValue={{ min: 1, max: 4, now: step + 1 }} style={{ flexDirection: 'row', gap: 10 }}>{wizardTitles.map((title, index) => <View key={title} style={{ height: 6, flex: 1, borderRadius: 4, backgroundColor: index <= step ? colors.orange : colors.line }} />)}</View>
  </View>;
}

export function PhotosSection({ photos, busy, error, onAdd, onRemove }: { photos: string[]; busy: boolean; error?: string; onAdd: () => Promise<void>; onRemove: (uri: string) => void }) {
  return <View style={common.section}>
    <Txt variant="label">Fotos da vaga</Txt>
    <Card><Row style={{ alignItems: 'flex-start' }}><View style={styles.photoIcon}><Icon name="camera" size={34} color={colors.primary} /></View><View style={{ flex: 1, gap: 7 }}><Txt variant="label">Adicione até 5 fotos</Txt><Txt variant="small" color={colors.muted}>Mostre a entrada, o espaço e o acesso ao portão.</Txt><Pressable accessibilityRole="button" accessibilityLabel={`Adicionar fotos, ${photos.length} de 5 selecionadas`} accessibilityState={{ disabled: busy || photos.length >= 5, busy }} disabled={busy || photos.length >= 5} onPress={() => { void onAdd(); }} testID="garage-pick-photos" style={styles.add}><Txt variant="small" color={colors.primary}>{busy ? 'Guardando…' : '+ Adicionar fotos'}</Txt></Pressable></View></Row></Card>
    <View style={common.wrap}>{photos.map((uri, index) => <Card key={uri} style={{ width: '47%', padding: 8, gap: 8 }}><Image source={{ uri }} accessibilityLabel={`Foto ${index + 1} da vaga`} style={{ height: 105, width: '100%', borderRadius: 10 }} /><Pressable accessibilityRole="button" accessibilityLabel={`Remover foto ${index + 1}`} accessibilityState={{ disabled: busy }} disabled={busy} style={styles.remove} onPress={() => Alert.alert('Remover foto do anúncio?', 'A foto original continuará na galeria do aparelho.', [{ text: 'Manter', style: 'cancel' }, { text: 'Remover', style: 'destructive', onPress: () => onRemove(uri) }])}><Txt variant="label" color={colors.primary}>Remover</Txt></Pressable></Card>)}</View>
    {error ? <View accessibilityRole="alert" accessibilityLiveRegion="polite"><Txt variant="small" color={colors.danger}>{error}</Txt></View> : null}
    <Txt variant="small" color={colors.muted}>Fotos opcionais e salvas neste aparelho. Sem fotos, usamos uma ilustração.</Txt>
  </View>;
}

export function DetailsSummary({ draft, onStep, disabled = false }: { draft: GarageDraft; onStep: (step: number) => void; disabled?: boolean }) {
  const rows = [
    { label: 'Endereço', value: `${draft.address} · ${draft.neighborhood}`, step: 0 },
    { label: 'Tipo de vaga', value: `${draft.amenities.includes('covered') ? 'Coberta' : 'Descoberta'} · ${draft.amenities.includes('gate') ? 'Portão eletrônico' : 'Sem portão eletrônico'}`, step: 1 },
    { label: 'Veículos aceitos', value: draft.vehicleTypes.map(type => type === 'car' ? 'Carro' : 'Motocicleta').join(' e '), step: 1 },
  ];
  return <View style={common.section}>{rows.map(row => <View key={row.label} style={{ gap: 7 }}><Txt variant="label" color={colors.muted}>{row.label}</Txt><Pressable accessibilityRole="button" accessibilityLabel={`Editar ${row.label.toLowerCase()}: ${row.value}`} accessibilityState={{ disabled }} disabled={disabled} onPress={() => onStep(row.step)} style={styles.summary}><Txt style={{ flex: 1 }}>{row.value}</Txt><Icon name="chevron-down" color={colors.muted} size={18} /></Pressable></View>)}</View>;
}

const styles = StyleSheet.create({
  photoIcon: { width: 68, height: 78, alignItems: 'center', justifyContent: 'center', borderRadius: 16, backgroundColor: colors.blue },
  add: { minHeight: 44, borderRadius: 22, backgroundColor: colors.primaryLight, paddingHorizontal: 9, justifyContent: 'center', alignItems: 'center' },
  remove: { minHeight: 48, borderRadius: 12, backgroundColor: colors.primaryLight, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 4 },
  summary: { minHeight: 52, padding: 14, backgroundColor: colors.white, borderColor: colors.line, borderWidth: 1, borderRadius: 14, flexDirection: 'row', alignItems: 'center', gap: 8 },
});
