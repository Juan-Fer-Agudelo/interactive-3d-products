import { useSyncExternalStore } from 'react';

// A very small store: one object, shallow updates, selector subscriptions.
let state = {
  phase: 'loading', // loading | opening | meadow | flat
  progress: 0,
  phrase: 'preparando el terreno…',
  sound: true,
  quality: 'high',
  view: 'third', // third | first
  rain: false,
  night: false,
  panel: null, // { type, id }
  menu: false,
  help: false,
  credits: false,
  near: null, // interactable currently in reach
  following: null, // place the character is walking to
};
const listeners = new Set();

export const store = {
  get: () => state,
  set(patch) {
    const next = typeof patch === 'function' ? patch(state) : patch;
    let changed = false;
    for (const k in next) if (next[k] !== state[k]) changed = true;
    if (!changed) return;
    state = { ...state, ...next };
    listeners.forEach((l) => l());
  },
  subscribe(l) {
    listeners.add(l);
    return () => listeners.delete(l);
  },
};

export function useStore(selector) {
  return useSyncExternalStore(store.subscribe, () => selector(state));
}

export function defaultQuality() {
  try {
    const saved = localStorage.getItem('pradera-calidad');
    if (saved === 'high' || saved === 'medium' || saved === 'low') return saved;
  } catch { /* private mode: fall through to the guess */ }
  const threads = navigator.hardwareConcurrency ?? 4;
  const coarse = window.matchMedia?.('(pointer: coarse)').matches;
  if (threads <= 4) return 'low';
  return !coarse && threads >= 8 ? 'high' : 'medium';
}
