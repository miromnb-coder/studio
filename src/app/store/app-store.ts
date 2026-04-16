'use client';

import { useSyncExternalStore } from 'react';
import type { AppActions, AppState } from './app-store-types';
import { initialState, ensureConversationInState, syncActiveConversationView } from './app-store-state';
// import hydrate/persist helpers
// import chat actions
// import alert actions
// import user actions
// import conversation actions

let state: AppState = initialState;
const listeners = new Set<() => void>();

const subscribe = (listener: () => void) => {
  listeners.add(listener);
  return () => listeners.delete(listener);
};

const emit = () => listeners.forEach((listener) => listener());

export const setState = (updater: (prev: AppState) => AppState) => {
  const next = ensureConversationInState(updater(state));
  state = syncActiveConversationView(next);
  // persist()
  emit();
};

export const getState = () => state;

const actions: AppActions = {
  // hydrate: ...
  // sendMessage: ...
  // retryLastPrompt: ...
  // addAlert: ...
  // createConversation: ...
};

export const useAppStore = <T,>(
  selector: (state: AppState & AppActions) => T,
): T =>
  useSyncExternalStore(
    subscribe,
    () => selector({ ...state, ...actions }),
    () => selector({ ...state, ...actions }),
  );
