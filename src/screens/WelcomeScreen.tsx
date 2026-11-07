import React, { useState } from 'react';
import { View } from 'react-native';
import { Role } from '../domain/types';
import { useReadyApp } from '../state/AppProvider';
import { CadastroScreen } from './CadastroScreen';
import { LoginScreen } from './LoginScrenn';
import { BrandLogo, Button, GarageArt, Icon, Row, Screen, Txt } from '../ui/components';
import { colors } from '../ui/theme';

export function WelcomeScreen() {
  const { state, dispatch } = useReadyApp();
  const [entryScreen, setEntryScreen] = useState<'welcome' | 'login' | 'signup'>('welcome');
  const begin = (role: Role) => dispatch({ type: 'onboard', name: (role === 'driver' ? state.profile.name : state.ownerProfile.name) || 'Alex Demo', role });
  if (entryScreen === 'login') return <LoginScreen onBack={() => setEntryScreen('welcome')} onLogin={() => begin('driver')} onCreateAccount={() => setEntryScreen('signup')} />;
  if (entryScreen === 'signup') return <CadastroScreen onBack={() => setEntryScreen('login')} />;
  return <Screen testID="welcome-screen"><View style={{ paddingTop: 14, gap: 8 }}><BrandLogo /><Txt variant="small" color={colors.muted}>Seu espaço na cidade.</Txt></View><View style={{ flex: 1, justifyContent: 'center', gap: 27, paddingVertical: 15 }}><GarageArt theme="blue" large /><View style={{ gap: 13 }}><Txt variant="title">Estacione fácil.{"\n"}Ganhe com seu espaço.</Txt><Txt color={colors.muted}>Conectamos quem procura uma vaga a quem tem um espaço privado disponível, em Recife e região.</Txt></View><Row style={{ gap: 20 }}><Row style={{ gap: 5 }}><Icon name="map-pin" size={16} /><Txt variant="small">Perto de você</Txt></Row><Row style={{ gap: 5 }}><Icon name="shield" size={16} /><Txt variant="small">Simples de reservar</Txt></Row></Row></View><View style={{ gap: 10 }}><Button title="Encontrar uma vaga" icon="search" onPress={() => begin('driver')} /><Button title="Disponibilizar uma vaga" icon="home" variant="secondary" onPress={() => begin('owner')} /><Button title="Entrar no modo demonstração" variant="secondary" icon="play-circle" onPress={() => begin('driver')} /><Button title="Já tenho uma conta · Entrar" variant="secondary" icon="log-in" onPress={() => setEntryScreen('login')} /></View><Txt variant="small" color={colors.muted} style={{ textAlign: 'center' }}>Protótipo acadêmico · dados fictícios · sem pagamentos reais</Txt></Screen>;
}
