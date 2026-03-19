import type { AppState, ViewName, UserPosition, MuralPOI } from './types.ts';

type Listener = (state: AppState) => void;

const listeners: Listener[] = [];

const state: AppState = {
  currentView: 'qr',
  userPosition: null,
  murals: [],
  nearbyMural: null,
  arActive: false,
  qrScanned: false,
  debugMode: new URLSearchParams(window.location.search).has('debug'),
};

export function getState(): Readonly<AppState> {
  return state;
}

export function updateState(partial: Partial<AppState>): void {
  Object.assign(state, partial);
  for (const listener of listeners) {
    listener(state);
  }
}

export function subscribe(listener: Listener): () => void {
  listeners.push(listener);
  return () => {
    const idx = listeners.indexOf(listener);
    if (idx >= 0) listeners.splice(idx, 1);
  };
}

export function setView(view: ViewName): void {
  updateState({ currentView: view });
}

export function setUserPosition(pos: UserPosition): void {
  updateState({ userPosition: pos });
}

export function setNearbyMural(mural: MuralPOI | null): void {
  updateState({ nearbyMural: mural });
}

export function markMuralDiscovered(muralId: string): void {
  const mural = state.murals.find(m => m.id === muralId);
  if (mural && !mural.discovered) {
    mural.discovered = true;
    updateState({ murals: [...state.murals] });
  }
}
