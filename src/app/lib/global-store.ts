'use client';

import { useSyncExternalStore } from 'react';

export type AuthUser = {
  name: string;
  email: string;
};

type GlobalState = {
  auth: {
    currentUser: AuthUser | null;
    users: AuthUser[];
  };
};

type AuthSlice = {
  currentUser: AuthUser | null;
  signup: (name: string, email: string) => void;
  login: (email: string) => void;
  logout: () => void;
  updateProfileName: (name: string) => void;
};

const AUTH_STORAGE_KEY = 'miro_auth_state_v1';

let state: GlobalState = {
  auth: {
    currentUser: null,
    users: [],
  },
};

const listeners = new Set<() => void>();
let hydrated = false;

function emitChange() {
  listeners.forEach((listener) => listener());
}

function subscribe(listener: () => void) {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

function persistAuth() {
  if (typeof window === 'undefined') return;
  window.localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(state.auth));
}

function hydrateAuth() {
  if (hydrated || typeof window === 'undefined') return;
  hydrated = true;

  const raw = window.localStorage.getItem(AUTH_STORAGE_KEY);
  if (!raw) return;

  try {
    const parsed = JSON.parse(raw) as Partial<GlobalState['auth']>;
    const users = Array.isArray(parsed.users) ? parsed.users : [];
    const currentUser =
      parsed.currentUser && parsed.currentUser.email
        ? {
            name: parsed.currentUser.name || parsed.currentUser.email.split('@')[0] || 'User',
            email: parsed.currentUser.email,
          }
        : null;

    state = {
      ...state,
      auth: {
        users,
        currentUser,
      },
    };
  } catch {
    // no-op: malformed local storage should not break the app
  }
}

function normalizeEmail(email: string) {
  return email.trim().toLowerCase();
}

function deriveNameFromEmail(email: string) {
  return email.split('@')[0] || 'User';
}

function setState(updater: (prev: GlobalState) => GlobalState) {
  state = updater(state);
  persistAuth();
  emitChange();
}

export function useGlobalStore<T>(selector: (state: GlobalState) => T): T {
  hydrateAuth();

  return useSyncExternalStore(
    subscribe,
    () => selector(state),
    () => selector(state),
  );
}

export function useAuthSlice(): AuthSlice {
  const currentUser = useGlobalStore((snapshot) => snapshot.auth.currentUser);

  return {
    currentUser,
    signup: (name, email) => {
      const normalizedEmail = normalizeEmail(email);
      const normalizedName = name.trim() || deriveNameFromEmail(normalizedEmail);
      if (!normalizedEmail) return;

      setState((prev) => {
        const dedupedUsers = prev.auth.users.filter(
          (user) => normalizeEmail(user.email) !== normalizedEmail,
        );
        const nextUser = { name: normalizedName, email: normalizedEmail };

        return {
          ...prev,
          auth: {
            users: [...dedupedUsers, nextUser],
            currentUser: nextUser,
          },
        };
      });
    },
    login: (email) => {
      const normalizedEmail = normalizeEmail(email);
      if (!normalizedEmail) return;

      setState((prev) => {
        const existing = prev.auth.users.find(
          (user) => normalizeEmail(user.email) === normalizedEmail,
        );
        const nextUser = existing || {
          name: deriveNameFromEmail(normalizedEmail),
          email: normalizedEmail,
        };

        const hasUser = prev.auth.users.some(
          (user) => normalizeEmail(user.email) === normalizedEmail,
        );

        return {
          ...prev,
          auth: {
            users: hasUser ? prev.auth.users : [...prev.auth.users, nextUser],
            currentUser: nextUser,
          },
        };
      });
    },
    logout: () => {
      setState((prev) => ({
        ...prev,
        auth: {
          ...prev.auth,
          currentUser: null,
        },
      }));
    },
    updateProfileName: (name) => {
      const nextName = name.trim();
      if (!nextName) return;

      setState((prev) => {
        if (!prev.auth.currentUser) return prev;

        const nextUser = {
          ...prev.auth.currentUser,
          name: nextName,
        };

        return {
          ...prev,
          auth: {
            users: prev.auth.users.map((user) =>
              normalizeEmail(user.email) === normalizeEmail(nextUser.email)
                ? nextUser
                : user,
            ),
            currentUser: nextUser,
          },
        };
      });
    },
  };
}
