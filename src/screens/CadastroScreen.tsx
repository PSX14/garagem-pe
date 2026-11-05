import React, { useRef, useState } from 'react';
import { Alert, Keyboard, Pressable, StyleSheet, TextInput, View } from 'react-native';
import { BrandLogo, Button, Field, GarageArt, Icon, Notice, Screen, Txt } from '../ui/components';
import { requireSupabase } from '../lib/supabase';
import { colors } from '../ui/theme';

type CadastroScreenProps = { onBack: () => void; onRegistered?: () => void | Promise<void> };
type FormField = 'name' | 'email' | 'phone' | 'password' | 'confirmation';
type FormErrors = Partial<Record<FormField, string>>;

type PasswordFieldProps = {
	label: string;
	value: string;
	visible: boolean;
	error?: string;
	onChangeText: (value: string) => void;
	onToggleVisibility: () => void;
	onSubmitEditing?: () => void;
};

function PasswordField({ label, value, visible, error, onChangeText, onToggleVisibility, onSubmitEditing }: PasswordFieldProps) {
	return <View style={{ gap: 7 }}>
		<Txt variant="label">{label}</Txt>
		<View style={styles.passwordField}>
			<TextInput accessibilityLabel={label} value={value} onChangeText={onChangeText} placeholder="Mínimo de 8 caracteres" placeholderTextColor="#8B948E" secureTextEntry={!visible} autoCapitalize="none" autoComplete="new-password" textContentType="newPassword" returnKeyType={onSubmitEditing ? 'done' : 'next'} onSubmitEditing={onSubmitEditing} style={styles.passwordInput} />
			<Pressable accessibilityRole="button" accessibilityLabel={visible ? `Ocultar ${label.toLowerCase()}` : `Mostrar ${label.toLowerCase()}`} accessibilityState={{ selected: visible }} onPress={onToggleVisibility} hitSlop={8} style={styles.visibilityButton}><Icon name={visible ? 'eye-off' : 'eye'} size={19} color={colors.muted} /></Pressable>
		</View>
		{!!error && <Txt variant="small" color={colors.danger}>{error}</Txt>}
	</View>;
}

export function CadastroScreen({ onBack, onRegistered }: CadastroScreenProps) {
	const pending = useRef(false);
	const [loading, setLoading] = useState(false);
	const [name, setName] = useState('');
	const [email, setEmail] = useState('');
	const [phone, setPhone] = useState('');
	const [password, setPassword] = useState('');
	const [confirmation, setConfirmation] = useState('');
	const [passwordVisible, setPasswordVisible] = useState(false);
	const [confirmationVisible, setConfirmationVisible] = useState(false);
	const [errors, setErrors] = useState<FormErrors>({});

	async function submit() {
		if (pending.current) return;
		Keyboard.dismiss();
		const nextErrors: FormErrors = {};
		if (!name.trim()) nextErrors.name = 'Informe seu nome.';
		if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) nextErrors.email = 'Informe um e-mail válido.';
		if (!/^\d{10,11}$/.test(phone.replace(/\D/g, ''))) nextErrors.phone = 'Informe um telefone com DDD.';
		if (password.length < 8 || !password.trim()) nextErrors.password = 'A senha deve ter pelo menos 8 caracteres.';
		if (!confirmation) nextErrors.confirmation = 'Confirme sua senha.';
		else if (password !== confirmation) nextErrors.confirmation = 'As senhas não coincidem.';
		setErrors(nextErrors);
		if (Object.keys(nextErrors).length > 0) return;

		pending.current = true;
    setLoading(true);
    try {
      const { data, error } = await requireSupabase().auth.signUp({
        email: email.trim().toLowerCase(), password,
        options: { data: { full_name: name.trim(), phone: phone.replace(/\D/g, '') } },
      });
      if (error) { Alert.alert('Não foi possível cadastrar', 'Confira os dados e tente novamente. O serviço pode limitar novas tentativas por alguns instantes.'); return; }
      setPassword(''); setConfirmation('');
      if (data.session && onRegistered) await onRegistered();
      else Alert.alert('Confira seu e-mail', 'Se o cadastro foi aceito, você receberá as instruções de confirmação. Depois de confirmar, volte para entrar com sua senha.', [{ text: 'Voltar para login', onPress: onBack }]);
    } catch (reason) {
      Alert.alert('Não foi possível cadastrar', reason instanceof Error && reason.message.startsWith('O acesso à conta') ? reason.message : 'Verifique sua conexão e tente novamente.');
    } finally { pending.current = false; setLoading(false); }
	}

	return <Screen testID="cadastro-screen">
		<View style={{ gap: 8, paddingTop: 14 }}><BrandLogo /><Txt variant="small" color={colors.muted}>Seu espaço na cidade.</Txt></View>
		<Pressable accessibilityRole="button" accessibilityLabel="Voltar para login" onPress={onBack} style={styles.back}><Icon name="arrow-left" size={18} /><Txt variant="label" color={colors.primary}>Voltar para login</Txt></Pressable>
		<GarageArt theme="blue" compact />
		<View style={{ gap: 7 }}><Txt variant="title" style={{ fontSize: 30, lineHeight: 37 }}>Crie sua conta.</Txt><Txt color={colors.muted}>Preencha seus dados para começar.</Txt></View>
		<View style={{ gap: 16 }}>
			<Field label="Nome" value={name} onChangeText={value => { setName(value); setErrors(current => ({ ...current, name: undefined })); }} error={errors.name} placeholder="Seu nome completo" autoCapitalize="words" autoComplete="name" textContentType="name" returnKeyType="next" />
			<Field label="E-mail" value={email} onChangeText={value => { setEmail(value); setErrors(current => ({ ...current, email: undefined })); }} error={errors.email} placeholder="voce@exemplo.com" keyboardType="email-address" autoCapitalize="none" autoComplete="email" textContentType="emailAddress" autoCorrect={false} returnKeyType="next" />
			<Field label="Telefone" value={phone} onChangeText={value => { setPhone(value); setErrors(current => ({ ...current, phone: undefined })); }} error={errors.phone} placeholder="(81) 99999-9999" keyboardType="phone-pad" autoComplete="tel" textContentType="telephoneNumber" maxLength={16} returnKeyType="next" />
			<PasswordField label="Senha" value={password} visible={passwordVisible} error={errors.password} onChangeText={value => { setPassword(value); setErrors(current => ({ ...current, password: undefined })); }} onToggleVisibility={() => setPasswordVisible(value => !value)} />
			<PasswordField label="Confirmar senha" value={confirmation} visible={confirmationVisible} error={errors.confirmation} onChangeText={value => { setConfirmation(value); setErrors(current => ({ ...current, confirmation: undefined })); }} onToggleVisibility={() => setConfirmationVisible(value => !value)} onSubmitEditing={() => { void submit(); }} />
			<Button title={loading ? 'Criando uma conta' : 'Criar conta'} icon="user-plus" onPress={submit} testID="create-account-submit" disabled={loading} />
		</View>
		<Notice>Ao criar a conta, seu nome, e-mail, telefone e senha serão enviados ao serviço de autenticação. As vagas e reservas continuam demonstrativas neste aparelho.</Notice>
	</Screen>;
}

const styles = StyleSheet.create({
	back: { alignSelf: 'flex-start', minHeight: 42, flexDirection: 'row', alignItems: 'center', gap: 8 },
	passwordField: { minHeight: 52, flexDirection: 'row', alignItems: 'center', backgroundColor: colors.white, borderWidth: 1, borderColor: colors.line, borderRadius: 14 },
	passwordInput: { flex: 1, minWidth: 0, paddingHorizontal: 15, paddingVertical: 14, fontSize: 16, color: colors.ink },
	visibilityButton: { width: 48, height: 48, alignItems: 'center', justifyContent: 'center' },
});
