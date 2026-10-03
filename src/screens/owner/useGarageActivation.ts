import { useRef, useState } from 'react';
import { Alert } from 'react-native';
import type { Garage } from '../../domain/types';
import { useReadyApp } from '../../state/AppProvider';

export function useGarageActivation() {
  const { dispatch } = useReadyApp();
  const [feedback, setFeedback] = useState('');
  const [pending, setPending] = useState<string | null>(null);
  const locked = useRef(false);
  const committing = useRef(false);
  const toggle = (garage: Garage) => {
    if (locked.current) return;
    locked.current = true; setPending(garage.id);
    const release = () => { locked.current = false; setPending(null); };
    const save = async () => {
      committing.current = true;
      try { await dispatch({ type: 'toggleGarage', id: garage.id }); setFeedback(`${garage.name}: ${garage.active ? 'anúncio pausado. As reservas existentes estão mantidas.' : 'anúncio ativado para novas reservas.'}`); }
      catch (error) { Alert.alert('Não foi possível alterar o anúncio', error instanceof Error ? error.message : 'Tente novamente.'); }
      finally { committing.current = false; release(); }
    };
    if (garage.active) Alert.alert('Pausar anúncio?', 'A vaga deixará de aparecer nas buscas. As reservas já confirmadas continuam válidas.', [{ text: 'Manter ativa', style: 'cancel', onPress: release }, { text: 'Pausar anúncio', style: 'destructive', onPress: () => { void save(); } }], { cancelable: true, onDismiss: () => { if (!committing.current) release(); } });
    else void save();
  };
  return { toggle, feedback, pending };
}
