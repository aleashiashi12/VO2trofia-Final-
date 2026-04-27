import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';

export interface ProgressLog {
  id: string;
  date: string;
  exerciseId: string;
  exerciseName: string;
  weight: number;
  reps: number;
  isWarmup?: boolean;
}

export interface Settings {
  theme: 'oled' | 'light';
  defaultRestHeavy: number;
  defaultRestMetabolic: number;
  soundEnabled: boolean;
  vibrationEnabled: boolean;
}

interface AppState {
  logs: ProgressLog[];
  settings: Settings;
  extraSetsCompleted: number;
}

interface StoreContextType {
  state: AppState;
  addLog: (log: Omit<ProgressLog, 'id'>) => void;
  updateLog: (id: string, updatedLog: Partial<ProgressLog>) => void;
  deleteLog: (id: string) => void;
  updateSettings: (settings: Partial<Settings>) => void;
  incrementExtraSets: () => void;
  resetData: () => void;
}

const defaultSettings: Settings = {
  theme: 'oled',
  defaultRestHeavy: 180,
  defaultRestMetabolic: 90,
  soundEnabled: true,
  vibrationEnabled: true,
};

const initialState: AppState = {
  logs: [],
  settings: defaultSettings,
  extraSetsCompleted: 0,
};

const StoreContext = createContext<StoreContextType | undefined>(undefined);

export const StoreProvider = ({ children }: { children: ReactNode }) => {
  const [state, setState] = useState<AppState>(() => {
    const saved = localStorage.getItem('vo2trofia_state');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        return {
          ...initialState,
          ...parsed,
          settings: { ...initialState.settings, ...(parsed.settings || {}) }
        };
      } catch (e) {
        console.error('Failed to parse state from local storage', e);
      }
    }
    return initialState;
  });

  useEffect(() => {
    localStorage.setItem('vo2trofia_state', JSON.stringify(state));
    if (state.settings.theme === 'light') {
      document.body.classList.add('light-mode');
    } else {
      document.body.classList.remove('light-mode');
    }
  }, [state]);

  const addLog = (log: Omit<ProgressLog, 'id'>) => {
    setState(prev => ({
      ...prev,
      logs: [
        ...prev.logs,
        { ...log, id: Date.now().toString() }
      ]
    }));
  };

  const updateLog = (id: string, updatedLog: Partial<ProgressLog>) => {
    setState(prev => ({
      ...prev,
      logs: prev.logs.map(log => log.id === id ? { ...log, ...updatedLog } : log)
    }));
  };

  const deleteLog = (id: string) => {
    setState(prev => ({
      ...prev,
      logs: prev.logs.filter(log => log.id !== id)
    }));
  };

  const updateSettings = (newSettings: Partial<Settings>) => {
    setState(prev => ({
      ...prev,
      settings: { ...prev.settings, ...newSettings }
    }));
  };

  const incrementExtraSets = () => {
    setState(prev => ({
      ...prev,
      extraSetsCompleted: prev.extraSetsCompleted + 1
    }));
  };

  const resetData = () => {
    if (window.confirm('¿Estás seguro de que quieres borrar todo tu progreso? Esta acción no se puede deshacer.')) {
      setState(initialState);
      localStorage.removeItem('vo2trofia_state');
    }
  };

  return (
    <StoreContext.Provider value={{ state, addLog, updateLog, deleteLog, updateSettings, incrementExtraSets, resetData }}>
      {children}
    </StoreContext.Provider>
  );
};

export const useStore = () => {
  const context = useContext(StoreContext);
  if (context === undefined) {
    throw new Error('useStore must be used within a StoreProvider');
  }
  return context;
};
