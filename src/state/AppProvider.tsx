import React, { createContext, useCallback, useContext, useEffect, useRef, useState } from 'react';
import { Action, AppState } from '../domain/types';
import { createInitialState, transition } from '../domain/model';
import { loadState, persistState } from './persistence';

interface AppContextValue {
  state: AppState | null; loading: boolean; error: string | null;
  dispatch: (action: Action) => Promise<void>; reload: () => void; restore: () => Promise<void>;
}
const Context = createContext<AppContextValue | null>(null);
export function AppProvider({ children }: React.PropsWithChildren) {
  const [state, setState] = useState<AppState | null>(null);
  const stateRef = useRef<AppState | null>(null);
  const queue = useRef<Promise<void>>(Promise.resolve());
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [attempt, setAttempt] = useState(0);
  useEffect(() => {
    let alive = true;
    loadState().then(value => {
      if (alive) { stateRef.current = value; setState(value); setError(null); }
    }).catch((reason: unknown) => {
      if (alive) setError(reason instanceof Error ? reason.message : 'Não foi possível ler seus dados.');
    }).finally(() => { if (alive) setLoading(false); });
    return () => { alive = false; };
  }, [attempt]);
  const dispatch = useCallback((action: Action) => {
    const task = queue.current.then(async () => {
      if (!stateRef.current) throw new Error('Seus dados ainda estão carregando.');
      const next = transition(stateRef.current, action);
      await persistState(next);
      stateRef.current = next;
      setState(next);
    });
    queue.current = task.catch(() => undefined);
    return task;
  }, []);
  const restore = useCallback(async () => {
    const task = queue.current.then(async () => {
      const next = createInitialState();
      await persistState(next);
      stateRef.current = next;
      setState(next);
      setError(null);
    });
    queue.current = task.catch(() => undefined);
    return task;
  }, []);
  return <Context.Provider value={{ state, loading, error, dispatch, restore, reload: () => { setLoading(true); setAttempt(n => n + 1); } }}>{children}</Context.Provider>;
}
export function useApp() {
  const context = useContext(Context);
  if (!context) throw new Error('AppProvider ausente.');
  return context;
}
export function useReadyApp() {
  const app = useApp();
  if (!app.state) throw new Error('Estado indisponível.');
  return { ...app, state: app.state };
}
