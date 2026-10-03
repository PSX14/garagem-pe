import React, { useEffect, useRef, useState } from 'react';
import { Alert, BackHandler, Image, View } from 'react-native';
import { money } from '../../domain/model';
import { pickGaragePhotos, removeGaragePhotos } from '../../services/photos';
import { useReadyApp } from '../../state/AppProvider';
import { Button, Card, common, Empty, Field, GarageArt, Header, Icon, Notice, Screen, Txt } from '../../ui/components';
import { colors } from '../../ui/theme';
import { CheckRow, LocationFields, PricingFields, StructureFields } from './GarageFormSections';
import { DraftErrors, draftErrors, draftInput, GarageDraft, initialDraft, stepFields, UpdateDraft } from './garageForm';
import { DetailsSummary, PhotosSection, WizardProgress } from './GarageWizard';

const DECLARATION = 'Declaro que sou responsável pela vaga e possuo autorização para disponibilizá-la.';

export function GarageEditor({ garageId, onBack }: { garageId?: string; onBack: () => void }) {
  const { state, dispatch } = useReadyApp();
  const garage = state.garages.find(item => item.id === garageId && item.ownerId === 'local');
  const [initial] = useState(() => initialDraft(garage));
  const [draft, setDraft] = useState<GarageDraft>(initial);
  const [errors, setErrors] = useState<DraftErrors>({});
  const [saving, setSaving] = useState(false);
  const [picking, setPicking] = useState(false);
  const [saved, setSaved] = useState(false);
  const [step, setStep] = useState(0);
  const [photoError, setPhotoError] = useState('');
  const [newId] = useState(() => `garage-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`);
  const newPhotos = useRef<string[]>([]);
  const committedPhotos = useRef<string[]>(garage?.photos ?? []);
  const pendingSave = useRef<Promise<void> | null>(null);
  const operation = useRef<'photos' | 'save' | null>(null);
  const mounted = useRef(true);
  const busy = saving || picking;
  const dirty = JSON.stringify(initial) !== JSON.stringify(draft);
  const update: UpdateDraft = (key, value) => { setDraft(previous => ({ ...previous, [key]: value })); setErrors(previous => ({ ...previous, [key]: undefined, form: undefined })); };

  const goBack = () => {
    if (operation.current) return;
    if (step > 0 && !saved) { setErrors({}); setStep(step - 1); return; }
    if (dirty && !saved) Alert.alert('Descartar alterações?', 'As alterações deste formulário ainda não foram salvas.', [{ text: 'Continuar editando', style: 'cancel' }, { text: 'Descartar', style: 'destructive', onPress: onBack }]);
    else onBack();
  };

  const nextStep = () => {
    if (operation.current) return;
    const allErrors = draftErrors(draft);
    const currentFields = stepFields[step] ?? [];
    const nextErrors: DraftErrors = {};
    for (const field of currentFields) if (allErrors[field]) nextErrors[field] = allErrors[field];
    if (Object.keys(nextErrors).length) { setErrors({ ...nextErrors, form: 'Revise os campos destacados para continuar.' }); return; }
    setErrors({}); setStep(step + 1);
  };

  useEffect(() => {
    mounted.current = true;
    return () => {
      mounted.current = false;
      const cleanup = () => removeGaragePhotos(newPhotos.current.filter(uri => !committedPhotos.current.includes(uri)));
      // Navigation/unmount must not delete a photo while its state commit is pending.
      const pending = pendingSave.current;
      void (pending ? pending.then(cleanup, cleanup) : cleanup()).catch(() => undefined);
    };
  }, []);
  useEffect(() => {
    const subscription = BackHandler.addEventListener('hardwareBackPress', () => { goBack(); return true; });
    return () => subscription.remove();
  });

  const addPhotos = async () => {
    if (operation.current) return;
    operation.current = 'photos';
    setPicking(true); setPhotoError('');
    try {
      const picked = await pickGaragePhotos(draft.photos.length);
      if (!mounted.current) { await removeGaragePhotos(picked); return; }
      newPhotos.current.push(...picked);
      update('photos', [...draft.photos, ...picked]);
    } catch (error) { if (mounted.current) setPhotoError(error instanceof Error ? error.message : 'Não foi possível selecionar as fotos.'); }
    finally { operation.current = null; if (mounted.current) setPicking(false); }
  };

  const save = async () => {
    if (operation.current) return;
    const nextErrors = draftErrors(draft);
    if (Object.keys(nextErrors).length) { setErrors({ ...nextErrors, form: 'Revise os campos destacados antes de publicar.' }); const invalidStep = stepFields.findIndex(fields => fields.some(field => nextErrors[field])); if (invalidStep >= 0) setStep(invalidStep); return; }
    operation.current = 'save'; setSaving(true); setErrors({});
    try {
      const input = draftInput(draft);
      pendingSave.current = dispatch({ type: 'saveGarage', id: garageId ?? newId, input });
      await pendingSave.current;
      committedPhotos.current = input.photos;
      const retired = [...(garage?.photos ?? []), ...newPhotos.current].filter(uri => !input.photos.includes(uri));
      newPhotos.current = [];
      if (mounted.current) setSaved(true);
      // Commit first: a failed save must never delete the existing photos.
      await removeGaragePhotos(retired).catch(() => undefined);
    } catch (error) { if (mounted.current) setErrors({ form: error instanceof Error ? error.message : 'Não foi possível salvar a vaga. Tente novamente.' }); }
    finally { pendingSave.current = null; operation.current = null; if (mounted.current) setSaving(false); }
  };

  if (garageId && !garage) return <Screen><Header title="Minha vaga" back={onBack} /><Empty icon="home" title="Vaga não encontrada" description="Este espaço não está disponível para edição no seu perfil." action={<Button title="Voltar" onPress={onBack} />} /></Screen>;
  if (saved) return <Screen testID="garage-saved">
    <Header title={garageId ? 'Alterações salvas' : 'Vaga publicada'} />
    <View style={{ alignItems: 'center', paddingVertical: 24, gap: 16 }}><View style={{ width: 88, height: 88, borderRadius: 32, backgroundColor: '#E8F6EF', alignItems: 'center', justifyContent: 'center' }}><Icon name="check" size={40} color="#22A06B" /></View><Txt variant="title" style={{ textAlign: 'center' }}>Seu espaço está pronto.</Txt><Txt color={colors.muted} style={{ textAlign: 'center' }}>{draft.name.trim()} foi {garageId ? 'atualizada' : 'publicada'} e salva neste aparelho.</Txt></View>
    <Card>{draft.photos[0] ? <Image source={{ uri: draft.photos[0] }} accessibilityLabel="Foto da vaga salva" style={{ height: 170, borderRadius: 16 }} /> : <GarageArt theme={garage?.theme ?? 'blue'} />}<Txt variant="heading">{draft.name.trim()}</Txt><Txt variant="label" color={colors.primary}>{money(Math.round(Number(draft.pricePerHour.replace(',', '.')) * 100))}/h</Txt><Txt color={colors.muted}>{draft.neighborhood.trim()} · {draft.capacity} {Number(draft.capacity) === 1 ? 'vaga' : 'vagas'}</Txt>{garage && !garage.active && <Notice>Seu anúncio continua pausado. Você pode ativá-lo em Minhas vagas.</Notice>}</Card>
    <Button title="Ver minhas vagas" icon="home" onPress={onBack} testID="garage-saved-back" />
  </Screen>;

  const sectionProps = { draft, update, errors, disabled: busy };
  return <Screen key={`step-${step}`} testID="garage-editor">
    <Header title={garage ? 'Editar uma vaga' : 'Cadastrar uma vaga'} back={busy ? undefined : goBack} />
    <WizardProgress step={step} />
    {step === 0 && <>
    <Notice>{garage ? 'Reservas existentes preservam o preço, endereço e instruções já confirmados.' : 'Cadastre um espaço privado de demonstração. Seus dados ficam neste aparelho.'}</Notice>
    <View style={common.section}>
      <Field label="Título do anúncio" placeholder="Ex.: Garagem Jardim de Casa Forte" value={draft.name} onChangeText={value => update('name', value)} maxLength={80} error={errors.name} editable={!busy} testID="garage-name" />
      <Field label="Descrição pública" placeholder="Conte o que torna sua vaga uma boa opção." value={draft.description} onChangeText={value => update('description', value)} maxLength={600} multiline error={errors.description} editable={!busy} testID="garage-description" />
    </View>
    <LocationFields {...sectionProps} />
    </>}
    {step === 1 && <StructureFields {...sectionProps} />}
    {step === 2 && <>
    <PhotosSection photos={draft.photos} busy={busy} error={photoError || errors.photos} onAdd={addPhotos} onRemove={uri => update('photos', draft.photos.filter(item => item !== uri))} />
    <DetailsSummary draft={draft} onStep={setStep} disabled={busy} />
    <PricingFields {...sectionProps} />
    <Field label="Regras principais" placeholder="Ex.: Respeite o horário e mantenha a passagem livre." value={draft.rules} onChangeText={value => update('rules', value)} maxLength={600} multiline error={errors.rules} editable={!busy} testID="garage-rules" />
    </>}
    {step === 3 && <>
    <Card><Txt variant="heading">{draft.name}</Txt><Txt color={colors.muted}>{draft.approximateAddress}</Txt><Txt variant="label">R$ {draft.pricePerHour} / hora{draft.pricePerDay ? ` · R$ ${draft.pricePerDay} / diária` : ''}</Txt><Txt variant="small">{draft.capacity} {Number(draft.capacity) === 1 ? 'vaga' : 'vagas'} · {draft.width} m × {draft.length} m · {draft.photos.length} {draft.photos.length === 1 ? 'foto' : 'fotos'}</Txt><Txt variant="small" color={colors.muted}>{draft.rules}</Txt><Button title="Revisar informações" variant="secondary" onPress={() => setStep(2)} disabled={busy} /></Card>
    <View style={common.section}>
      <Txt variant="heading">Acesso e responsabilidade</Txt>
      <Field label="Instruções de acesso · privadas" placeholder="Ex.: Use a entrada lateral fictícia e procure a vaga sinalizada." value={draft.accessInstructions} onChangeText={value => update('accessInstructions', value)} maxLength={600} multiline error={errors.accessInstructions} editable={!busy} testID="garage-access" />
      <Card><CheckRow title={DECLARATION} checked={draft.authorized} disabled={busy} onPress={() => update('authorized', !draft.authorized)} />{errors.authorized && <Txt variant="small" color={colors.danger}>{errors.authorized}</Txt>}<Txt variant="small" color={colors.muted}>Somente espaços privados autorizados podem ser publicados.</Txt></Card>
    </View>
    <Notice>Comissão da plataforma: 15%. Seu repasse líquido: 85%. Nenhum pagamento ou transferência real.</Notice>
    </>}
    {errors.form ? <View accessibilityRole="alert" accessibilityLiveRegion="polite"><Card style={{ borderColor: colors.danger }}><Txt color={colors.danger}>{errors.form}</Txt></Card></View> : null}
    {step < 3 ? <Button title="Continuar" onPress={nextStep} disabled={busy} testID="garage-next-step" /> : <Button title={saving ? 'Salvando…' : garage ? 'Salvar alterações' : 'Publicar vaga'} icon="check" onPress={save} disabled={busy} testID="save-garage" />}
    <Txt variant="small" color={colors.muted} style={{ textAlign: 'center' }}>Protótipo acadêmico · dados fictícios</Txt>
  </Screen>;
}
