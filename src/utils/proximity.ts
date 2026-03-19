import type { MuralPOI, UserPosition } from '../types.ts';
import { calculateDistance } from './geolocation.ts';
import { PROXIMITY_THRESHOLD_METERS } from '../data/murals.ts';
import { getState, setNearbyMural } from '../state.ts';

export function checkProximity(): void {
  const state = getState();

  // Debug mode: always show first undiscovered mural as nearby
  if (state.debugMode) {
    const firstUndiscovered = state.murals.find(m => !m.discovered) ?? state.murals[0] ?? null;
    if (state.nearbyMural?.id !== firstUndiscovered?.id) {
      setNearbyMural(firstUndiscovered);
    }
    return;
  }

  if (!state.userPosition) {
    setNearbyMural(null);
    return;
  }

  let closestMural: MuralPOI | null = null;
  let closestDistance = Infinity;

  for (const mural of state.murals) {
    const dist = calculateDistance(
      state.userPosition.lat, state.userPosition.lng,
      mural.lat, mural.lng
    );
    if (dist < PROXIMITY_THRESHOLD_METERS && dist < closestDistance) {
      closestMural = mural;
      closestDistance = dist;
    }
  }

  if (state.nearbyMural?.id !== closestMural?.id) {
    setNearbyMural(closestMural);
  }
}
