import React, { useEffect, useState } from 'react';
import { ActivityIndicator, Alert, BackHandler, Pressable, StyleSheet, View } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider, SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { Role } from './src/domain/types';
import { AppProvider, useApp, useReadyApp } from './src/state/AppProvider';
import { BookingDetail, BookingForm, BookingsScreen, ExploreScreen, GarageDetail } from './src/screens/DriverScreens';
import { EarningsScreen, GarageEditor, OwnerBookings, OwnerDashboard, OwnerGarages } from './src/screens/OwnerScreens';
import { ProfileScreen } from './src/screens/ProfileScreen';
import { WelcomeScreen } from './src/screens/WelcomeScreen';
import { Button, Empty, Icon, Screen, Txt } from './src/ui/components';
import { colors } from './src/ui/theme';

type Tab = 'home' | 'bookings' | 'favorites' | 'profile' | 'garages' | 'earnings';
type Route = { name: 'garage'; id: string } | { name: 'reserve'; id: string } | { name: 'booking'; id: string; justBooked?: boolean } | { name: 'edit'; id?: string };
const driverTabs: { id: Tab; title: string; icon: React.ComponentProps<typeof Icon>['name'] }[] = [{ id: 'home', title: 'Explorar', icon: 'search' }, { id: 'bookings', title: 'Reservas', icon: 'calendar' }, { id: 'favorites', title: 'Favoritos', icon: 'heart' }, { id: 'profile', title: 'Perfil', icon: 'user' }];
const ownerTabs: typeof driverTabs = [{ id: 'home', title: 'Painel', icon: 'grid' }, { id: 'garages', title: 'Vagas', icon: 'home' }, { id: 'bookings', title: 'Reservas', icon: 'calendar' }, { id: 'earnings', title: 'Ganhos', icon: 'bar-chart-2' }, { id: 'profile', title: 'Perfil', icon: 'user' }];

function Navigation() {
  const { state, dispatch } = useReadyApp();
  const insets = useSafeAreaInsets();
  const [tab, setTab] = useState<Tab>('home');
  const [stack, setStack] = useState<Route[]>([]);
  const route = stack[stack.length - 1];
  const dark = !route && tab === 'home';
  const goBack = () => setStack(previous => previous.slice(0, -1));
  const goHome = () => { setStack([]); setTab('home'); };
  const openBooking = (id: string) => setStack(previous => [...previous, { name: 'booking', id }]);
  const openGarage = (id: string) => setStack(previous => [...previous, { name: 'garage', id }]);
  const editGarage = (id?: string) => setStack(previous => [...previous, { name: 'edit', id }]);
  const changeRole = async (role: Role) => { await dispatch({ type: 'role', role }); setStack([]); setTab('home'); };
  useEffect(() => {
    const back = BackHandler.addEventListener('hardwareBackPress', () => {
      if (stack.length) { setStack(previous => previous.slice(0, -1)); return true; }
      if (tab !== 'home') { setTab('home'); return true; }
      return false;
    });
    return () => back.remove();
  }, [stack.length, tab]);
  let content: React.ReactNode;
  if (route?.name === 'garage') content = <GarageDetail garageId={route.id} onBack={goBack} onReserve={() => setStack(previous => [...previous, { name: 'reserve', id: route.id }])} />;
  else if (route?.name === 'reserve') content = <BookingForm garageId={route.id} onBack={goBack} onBooked={id => { setTab('bookings'); setStack([{ name: 'booking', id, justBooked: true }]); }} />;
  else if (route?.name === 'booking') content = <BookingDetail bookingId={route.id} justBooked={route.justBooked} onBack={() => { setStack([]); setTab('bookings'); }} onHome={goHome} />;
  else if (route?.name === 'edit') content = <GarageEditor garageId={route.id} onBack={() => { setStack([]); setTab('garages'); }} />;
  else if (tab === 'profile') content = <ProfileScreen key={state.role} onRole={changeRole} />;
  else if (state.role === 'owner') {
    if (tab === 'bookings') content = <OwnerBookings onBooking={openBooking} />;
    else if (tab === 'earnings') content = <EarningsScreen onBooking={openBooking} />;
    else if (tab === 'garages') content = <OwnerGarages onEdit={editGarage} onGarage={openGarage} onBooking={openBooking} />;
    else content = <OwnerDashboard onEdit={editGarage} onBooking={openBooking} onGarage={openGarage} onGarages={() => setTab('garages')} onEarnings={() => setTab('earnings')} onBookings={() => setTab('bookings')} />;
  } else if (tab === 'bookings') content = <BookingsScreen onBooking={openBooking} onExplore={goHome} />;
  else content = <ExploreScreen key={tab} favoritesOnly={tab === 'favorites'} onGarage={openGarage} />;
  return <SafeAreaView edges={route ? ['top', 'bottom', 'left', 'right'] : ['top', 'left', 'right']} style={[styles.root, { backgroundColor: dark ? colors.primary : colors.background }]}><StatusBar style={dark ? 'light' : 'dark'} /><View style={styles.flex} key={route ? `${route.name}-${route.id ?? 'new'}` : `${state.role}-${tab}`}>{content}</View>{!route && <View style={[styles.tabs, { paddingBottom: Math.max(7, insets.bottom) }]} accessibilityRole="tablist">{(state.role === 'owner' ? ownerTabs : driverTabs).map(item => <Pressable key={item.id} accessibilityRole="tab" accessibilityLabel={item.title} accessibilityState={{ selected: tab === item.id }} onPress={() => setTab(item.id)} style={styles.tab}><View style={[styles.tabIcon, tab === item.id && { backgroundColor: colors.orangeLight }]}><Icon name={item.icon} size={20} color={tab === item.id ? colors.primary : colors.muted} /></View><Txt variant="small" color={tab === item.id ? colors.primary : colors.muted} style={{ fontWeight: tab === item.id ? '700' : '500', fontSize: 11 }}>{item.title}</Txt></Pressable>)}</View>}</SafeAreaView>;
}
function Root() {
  const { state, loading, error, reload, restore } = useApp();
  if (loading) return <View style={styles.loading}><ActivityIndicator size="large" color={colors.primary} /><Txt variant="label">Preparando sua próxima parada…</Txt></View>;
  if (error || !state) return <SafeAreaView style={styles.root}><Screen><Empty icon="alert-circle" title="Seus dados precisam de atenção" description={error ?? 'Não foi possível carregar a demonstração.'} /><Button title="Tentar novamente" onPress={reload} /><Button title="Restaurar demonstração" variant="danger" onPress={() => Alert.alert('Restaurar seus dados?', 'Os dados atuais serão substituídos pelos dados de demonstração. Uma cópia de dados corrompidos, quando encontrada, é preservada pelo serviço local.', [{ text: 'Manter', style: 'cancel' }, { text: 'Restaurar', style: 'destructive', onPress: () => { void restore().catch(reason => Alert.alert('Erro ao restaurar', reason.message)); } }])} /></Screen></SafeAreaView>;
  return state.onboarded ? <Navigation /> : <SafeAreaView style={styles.root}><WelcomeScreen /></SafeAreaView>;
}
export default function App() { return <SafeAreaProvider><StatusBar style="dark" /><AppProvider><Root /></AppProvider></SafeAreaProvider>; }
const styles = StyleSheet.create({ root: { flex: 1, backgroundColor: colors.background }, flex: { flex: 1 }, loading: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 15 }, tabs: { flexDirection: 'row', backgroundColor: colors.white, borderTopWidth: 1, borderColor: colors.line, paddingHorizontal: 6, paddingTop: 8, paddingBottom: 7 }, tab: { flex: 1, alignItems: 'center', justifyContent: 'center', minHeight: 54, gap: 3 }, tabIcon: { minWidth: 46, height: 30, borderRadius: 12, alignItems: 'center', justifyContent: 'center' } });

