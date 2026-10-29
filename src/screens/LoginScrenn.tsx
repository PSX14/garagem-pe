import React, { useState } from 'react';
import { Alert, Keyboard, Pressable, StyleSheet, TextInput, View } from 'react-native';
import { BrandLogo, Button, Field, GarageArt, Icon, Notice, Row, Screen, Txt } from '../ui/components';
import { colors } from '../ui/theme';

//supabase
import { supabase } from '../lib/supabase';

type LoginScreenProps = { onBack: () => void; onLogin: () => void; onCreateAccount: () => void };

export function LoginScreen({ onBack, onLogin, onCreateAccount }: LoginScreenProps) {
	const [email, setEmail] = useState('');
	const [password, setPassword] = useState('');
	const [passwordVisible, setPasswordVisible] = useState(false);
	const [emailError, setEmailError] = useState('');
	const [passwordError, setPasswordError] = useState('');

	const [loading, setLoading] = useState(false);

	async function submit() {
		Keyboard.dimiss();

		const normalizedEmail = email.trim().toLowerCase();
		const validEmail = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(normalizedEmail);

	 	setEmailError(validEmail ? '' : 'Informe um e-mail válido.');
	 	setPasswordError(password.trim() ? '' : 'Informe sua senha.');

		if (!validEmail || !password) return;

		setLoading(true);

		try {
			const {error} = await supabase.auth.singInWithPassword({
				email: normalizedEmail,
				password,
			});

			if (error) {
				Alert.alert (
					'Não foi possível entrar', 
					'Confira seu e-mail e sua senha. Se acabou de criar a conta, confirme seu e-mail antes de entrar.'
				); return;
			}
			onLogin();
		} catch {
			Alert.alert(
				'Erro de conexão',
				'Não foi possível conectar ao serviço. Verifique sua internet e tente novamente.'
			);
		} finally {
			setLoading(false);
		}
	}

	// function submit() {
	// 	Keyboard.dismiss();
	// 	const normalizedEmail = email.trim();
	// 	const validEmail = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(normalizedEmail);
	// 	setEmailError(validEmail ? '' : 'Informe um e-mail válido.');
	// 	setPasswordError(password.trim() ? '' : 'Informe sua senha.');
	// 	if (!validEmail || !password.trim()) return;
	// 	onLogin();
	// }

	function explainUnavailable() {
		Alert.alert('Recuperação indisponível', 'Este protótipo não armazena senhas nem envia e-mails de recuperação.');
	}

	return <Screen testID="login-screen">
		<View style={{ gap: 8, paddingTop: 14 }}><BrandLogo /><Txt variant="small" color={colors.muted}>Seu espaço na cidade.</Txt></View>
		<Pressable accessibilityRole="button" accessibilityLabel="Voltar para início" onPress={onBack} style={styles.back}><Icon name="arrow-left" size={18} /><Txt variant="label" color={colors.primary}>Início</Txt></Pressable>
		<GarageArt theme="blue" compact />
		<View style={{ gap: 7 }}><Txt variant="title" style={{ fontSize: 30, lineHeight: 37 }}>Que bom ter você de volta.</Txt><Txt color={colors.muted}>Entre para continuar sua experiência no Garagem PE.</Txt></View>
		<View style={{ gap: 16 }}>
			<Field label="E-mail" value={email} onChangeText={value => { setEmail(value); setEmailError(''); }} error={emailError} placeholder="voce@exemplo.com" keyboardType="email-address" autoCapitalize="none" autoComplete="email" textContentType="emailAddress" autoCorrect={false} returnKeyType="next" />
			<View style={{ gap: 7 }}>
				<Txt variant="label">Senha</Txt>
				<View style={styles.passwordField}>
					<TextInput accessibilityLabel="Senha" value={password} onChangeText={value => { setPassword(value); setPasswordError(''); }} placeholder="Digite sua senha" placeholderTextColor="#8B948E" secureTextEntry={!passwordVisible} autoCapitalize="none" autoComplete="password" textContentType="password" returnKeyType="go" onSubmitEditing={submit} style={styles.passwordInput} />
					<Pressable accessibilityRole="button" accessibilityLabel={passwordVisible ? 'Ocultar senha' : 'Mostrar senha'} accessibilityState={{ selected: passwordVisible }} onPress={() => setPasswordVisible(value => !value)} hitSlop={8} style={styles.visibilityButton}><Icon name={passwordVisible ? 'eye-off' : 'eye'} size={19} color={colors.muted} /></Pressable>
				</View>
				{!!passwordError && <Txt variant="small" color={colors.danger}>{passwordError}</Txt>}
			</View>
			<Pressable accessibilityRole="button" onPress={explainUnavailable} style={styles.textLink}><Txt variant="label" color={colors.primary}>Esqueci minha senha</Txt></Pressable>
			<Button title="Entrar" icon="log-in" onPress={submit} testID="login-submit" loading={loading} />
		</View>
		<Row style={styles.signup}><Txt color={colors.muted}>Ainda não tem uma conta?</Txt><Pressable accessibilityRole="button" onPress={onCreateAccount}><Txt variant="label" color={colors.primary}>Criar uma conta</Txt></Pressable></Row>
		<Notice>Entre com sua conta do Garagem PE.</Notice>
	</Screen>;
}

const styles = StyleSheet.create({
	back: { alignSelf: 'flex-start', minHeight: 42, flexDirection: 'row', alignItems: 'center', gap: 8 },
	passwordField: { minHeight: 52, flexDirection: 'row', alignItems: 'center', backgroundColor: colors.white, borderWidth: 1, borderColor: colors.line, borderRadius: 14 },
	passwordInput: { flex: 1, minWidth: 0, paddingHorizontal: 15, paddingVertical: 14, fontSize: 16, color: colors.ink },
	visibilityButton: { width: 48, height: 48, alignItems: 'center', justifyContent: 'center' },
	textLink: { alignSelf: 'flex-end', minHeight: 36, justifyContent: 'center' },
	signup: { justifyContent: 'center', flexWrap: 'wrap' },
});
