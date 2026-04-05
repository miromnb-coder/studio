'use client';

import React, { createContext, useContext, useState, useCallback, ReactNode } from 'react';
import { AICoreContextType, AICoreState, AICoreStatus } from './types';

const initialState: AICoreState = {
  status: 'idle',
  steps: [],
};

const AICoreContext = createContext<AICoreContextType | undefined>(undefined);

export function AICoreProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<AICoreState>(initialState);

  const setStatus = useCallback((status: AICoreStatus) => {
    setState(prev => ({ ...prev, status }));
    
    // Auto-reset success/error back to idle after a burst
    if (status === 'success' || status === 'error') {
      setTimeout(() => {
        setState(prev => ({ ...prev, status: 'idle' }));
      }, 3000);
    }
  }, []);

  const updateState = useCallback((updates: Partial<AICoreState>) => {
    setState(prev => ({ ...prev, ...updates }));
  }, []);

  const reset = useCallback(() => {
    setState(initialState);
  }, []);

  return (
    <AICoreContext.Provider value={{ state, setStatus, updateState, reset }}>
      {children}
    </AICoreContext.Provider>
  );
}

export function useAICore() {
  const context = useContext(AICoreContext);
  if (context === undefined) {
    throw new Error('useAICore must be used within an AICoreProvider');
  }
  return context;
}
