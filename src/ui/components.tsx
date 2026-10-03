import React, { useRef, useState } from 'react';
import { ActivityIndicator, Alert, KeyboardAvoidingView, Platform, Pressable, ScrollView, StyleSheet, Text, TextInput, TextInputProps, View } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { colors } from './theme';
import { Garage } from '../domain/types';

type IconName = React.ComponentProps<typeof Feather>['name'];
export function Icon({ name, size = 20, color = colors.ink }: { name: IconName; size?: number; color?: string }) {
  return <Feather name={name} size={size} color={color} />;
}
export function Txt({ children, variant = 'body', color, style }: React.PropsWithChildren<{ variant?: 'body' | 'title' | 'heading' | 'label' | 'small'; color?: string; style?: React.ComponentProps<typeof Text>['style'] }>) {
  return <Text style={[s.text, s[variant], color ? { color } : undefined, style]}>{children}</Text>;
}
export function Screen({ children, testID, tone = 'light' }: React.PropsWithChildren<{ testID?: string; tone?: 'light' | 'dark' }>) {
  return <KeyboardAvoidingView style={{ flex: 1, backgroundColor: tone === 'dark' ? colors.primary : colors.background }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}><ScrollView testID={testID} keyboardShouldPersistTaps="handled" contentContainerStyle={s.screen} showsVerticalScrollIndicator={false}>{children}</ScrollView></KeyboardAvoidingView>;
}
export function BrandLogo({ light = false }: { light?: boolean }) {
  return <Row accessibilityLabel="Garagem PE"><View style={{ width: 38, height: 48, alignItems: 'center' }}><View style={{ width: 36, height: 36, borderRadius: 18, backgroundColor: colors.orange, alignItems: 'center', justifyContent: 'center' }}><Txt variant="heading" color={colors.primary}>P</Txt></View><View style={{ marginTop: -2, borderLeftWidth: 7, borderRightWidth: 7, borderTopWidth: 13, borderLeftColor: 'transparent', borderRightColor: 'transparent', borderTopColor: colors.orange }} /></View><View><Txt variant="label" color={light ? colors.white : colors.primary} style={{ fontSize: 20, lineHeight: 25 }}>Garagem</Txt><Txt variant="label" color={light ? colors.orange : '#9C4D00'}>PE</Txt></View></Row>;
}
export function Header({ title, subtitle, back, right }: { title: string; subtitle?: string; back?: () => void; right?: React.ReactNode }) {
  return <View style={s.header}>{back && <Pressable accessibilityRole="button" accessibilityLabel="Voltar" onPress={back} style={s.iconButton}><Icon name="arrow-left" /></Pressable>}<View style={{ flex: 1 }}><Txt variant="heading">{title}</Txt>{subtitle && <Txt variant="small" color={colors.muted}>{subtitle}</Txt>}</View>{right}</View>;
}
export function Button({ title, onPress, variant = 'primary', icon, disabled = false, testID }: { title: string; onPress: () => void | Promise<void>; variant?: 'primary' | 'secondary' | 'danger'; icon?: IconName; disabled?: boolean; testID?: string }) {
  const [busy, setBusy] = useState(false);
  const pending = useRef(false);
  const handle = async () => {
    if (pending.current || disabled) return;
    pending.current = true;
    setBusy(true);
    try { await onPress(); } catch (error) { Alert.alert('Não foi possível continuar', error instanceof Error ? error.message : 'Tente novamente.'); }
    finally { pending.current = false; setBusy(false); }
  };
  const color = variant === 'danger' ? colors.danger : colors.primary;
  return <Pressable testID={testID} accessibilityRole="button" accessibilityLabel={title} accessibilityState={{ disabled: disabled || busy, busy }} disabled={disabled || busy} onPress={handle} style={({ pressed }) => [s.button, variant === 'primary' ? { backgroundColor: colors.orange } : variant === 'danger' ? { backgroundColor: colors.dangerLight } : { backgroundColor: colors.primaryLight }, (disabled || busy) && { opacity: 0.5 }, pressed && { opacity: 0.8 }]}>{busy ? <ActivityIndicator color={color} /> : <>{icon && <Icon name={icon} color={color} />}<Txt variant="label" color={color} style={{ flexShrink: 1, textAlign: 'center' }}>{title}</Txt></>}</Pressable>;
}
export function Field({ label, error, ...props }: TextInputProps & { label: string; error?: string }) {
  return <View style={{ gap: 7 }}><Txt variant="label">{label}</Txt><TextInput accessibilityLabel={label} placeholderTextColor="#8B948E" {...props} style={[s.input, props.multiline && { minHeight: 100, textAlignVertical: 'top' }, props.style]} />{error && <Txt variant="small" color={colors.danger}>{error}</Txt>}</View>;
}
export function Card({ children, style }: React.PropsWithChildren<{ style?: React.ComponentProps<typeof View>['style'] }>) {
  return <View style={[s.card, style]}>{children}</View>;
}
export function Row({ children, style, ...props }: React.ComponentProps<typeof View>) {
  return <View {...props} style={[s.row, style]}>{children}</View>;
}
export function Pill({ title, selected = false, onPress, icon }: { title: string; selected?: boolean; onPress?: () => void; icon?: IconName }) {
  return <Pressable accessibilityRole={onPress ? 'button' : 'text'} accessibilityState={onPress ? { selected } : undefined} onPress={onPress} disabled={!onPress} style={[s.pill, selected && { backgroundColor: colors.orange, borderColor: colors.orange }]}>{icon && <Icon name={icon} size={15} color={colors.primary} />}<Txt variant="small" color={colors.ink}>{title}</Txt></Pressable>;
}
export function Empty({ title, description, icon = 'inbox', action }: { title: string; description: string; icon?: IconName; action?: React.ReactNode }) {
  return <View style={s.empty}><View style={s.emptyIcon}><Icon name={icon} size={32} color={colors.primary} /></View><Txt variant="heading" style={{ textAlign: 'center' }}>{title}</Txt><Txt color={colors.muted} style={{ textAlign: 'center' }}>{description}</Txt>{action}</View>;
}
export function Notice({ children }: React.PropsWithChildren) {
  return <View style={s.notice}><Icon name="info" size={17} color={colors.primary} /><Txt variant="small" color={colors.primary} style={{ flex: 1 }}>{children}</Txt></View>;
}
export function GarageArt({ theme = 'mint', large = false, compact = false }: { theme?: Garage['theme']; large?: boolean; compact?: boolean }) {
  const [width, setWidth] = useState(300);
  const height = compact ? 88 : large ? 230 : 145;
  const scale = Math.min(width / 270, height / 180);
  return <View accessible={false} onLayout={event => setWidth(event.nativeEvent.layout.width)} style={{ backgroundColor: theme === 'sand' ? '#FFF0D9' : '#DFEAF4', height, borderRadius: compact ? 13 : 20, overflow: 'hidden', alignItems: 'center', justifyContent: 'center' }}>
    <View style={{ position: 'absolute', bottom: 0, height: '30%', width: '100%', backgroundColor: '#E9EEF5' }} />
    <View style={{ width: 270, height: 180, transform: [{ scale }] }}>
      <View style={{ position: 'absolute', left: 45, top: 49, width: 180, height: 115, backgroundColor: '#203A5C' }} />
      <View style={{ position: 'absolute', left: 23, top: 0, width: 0, height: 0, borderLeftWidth: 112, borderRightWidth: 112, borderBottomWidth: 61, borderLeftColor: 'transparent', borderRightColor: 'transparent', borderBottomColor: colors.primary }} />
      <View style={{ position: 'absolute', left: 78, top: 85, width: 114, height: 80, backgroundColor: '#F5F7FA', paddingHorizontal: 9, paddingTop: 8 }}><View style={{ flex: 1, backgroundColor: '#C5D0DF', flexDirection: 'row', justifyContent: 'space-evenly' }}>{Array.from({ length: 5 }, (_, index) => <View key={index} style={{ width: 1, backgroundColor: '#A9B9CC', height: '100%' }} />)}</View></View>
      <View style={{ position: 'absolute', left: 96, bottom: 17, width: 79, height: 29, borderWidth: 2, borderColor: colors.primary, backgroundColor: theme === 'mint' ? colors.success : colors.orange, borderRadius: 12 }}><View style={{ position: 'absolute', top: -17, left: 16, width: 43, height: 17, borderTopLeftRadius: 12, borderTopRightRadius: 10, borderWidth: 2, borderBottomWidth: 0, borderColor: colors.primary, backgroundColor: theme === 'mint' ? '#95D4B6' : '#FFE0A4' }} />{[9, 53].map(left => <View key={left} style={{ position: 'absolute', bottom: -6, left, width: 14, height: 14, borderRadius: 7, backgroundColor: '#EEF3F9', borderWidth: 3, borderColor: colors.primary }} />)}</View>
    </View>
  </View>;
}
export const common = StyleSheet.create({ gap: { gap: 16 }, section: { gap: 12 }, divider: { height: 1, backgroundColor: colors.line }, wrap: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 }, between: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 8 } });
const s = StyleSheet.create({
  text: { color: colors.ink }, body: { fontSize: 15, lineHeight: 23 }, title: { fontSize: 34, lineHeight: 40, fontWeight: '800', letterSpacing: -1.2 }, heading: { fontSize: 23, lineHeight: 29, fontWeight: '700', letterSpacing: -0.6 }, label: { fontSize: 14, lineHeight: 20, fontWeight: '700' }, small: { fontSize: 12, lineHeight: 18 },
  screen: { padding: 22, paddingBottom: 32, gap: 22, flexGrow: 1, width: '100%', maxWidth: 660, alignSelf: 'center' }, header: { flexDirection: 'row', alignItems: 'center', gap: 10 }, iconButton: { width: 44, height: 44, borderRadius: 16, backgroundColor: colors.white, alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: colors.line },
  button: { minHeight: 52, paddingVertical: 14, paddingHorizontal: 20, borderRadius: 16, flexDirection: 'row', justifyContent: 'center', alignItems: 'center', gap: 9 },
  input: { backgroundColor: colors.white, borderWidth: 1, borderColor: colors.line, borderRadius: 14, padding: 15, minHeight: 52, fontSize: 16, color: colors.ink }, card: { shadowColor: colors.primary, shadowOffset: { width: 0, height: 3 }, shadowOpacity: 0.06, shadowRadius: 10, elevation: 2, backgroundColor: colors.white, borderWidth: 1, borderColor: colors.line, borderRadius: 22, padding: 18, gap: 14 }, row: { flexDirection: 'row', alignItems: 'center', gap: 10 }, pill: { borderRadius: 24, borderWidth: 1, borderColor: colors.line, backgroundColor: colors.white, paddingHorizontal: 14, paddingVertical: 10, flexDirection: 'row', alignItems: 'center', gap: 6 }, empty: { paddingVertical: 35, alignItems: 'center', gap: 14 }, emptyIcon: { width: 70, height: 70, backgroundColor: colors.primaryLight, borderRadius: 25, alignItems: 'center', justifyContent: 'center' }, notice: { padding: 14, borderRadius: 14, backgroundColor: colors.primaryLight, flexDirection: 'row', alignItems: 'flex-start', gap: 9 },
});

