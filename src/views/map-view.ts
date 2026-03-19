import L from 'leaflet';
import { getState, subscribe } from '../state.ts';
import { calculateDistance, formatDistance } from '../utils/geolocation.ts';
import { DEFAULT_CENTER, DEFAULT_ZOOM } from '../data/murals.ts';
import type { MuralPOI } from '../types.ts';

let map: L.Map | null = null;
let userMarker: L.CircleMarker | null = null;
let accuracyCircle: L.Circle | null = null;
let muralMarkers: Map<string, L.Marker> = new Map();
let unsubscribe: (() => void) | null = null;

// SVG icon factory for mural markers
function createMuralIcon(discovered: boolean): L.DivIcon {
  const color = discovered ? '#10b981' : '#8b5cf6';
  const glow = discovered ? 'rgba(16,185,129,0.3)' : 'rgba(139,92,246,0.3)';
  return L.divIcon({
    className: 'mural-marker',
    html: `
      <div style="position:relative;width:36px;height:36px;">
        <div style="position:absolute;inset:-4px;border-radius:50%;background:${glow};animation:pulse-ring 2s infinite;"></div>
        <div style="width:36px;height:36px;border-radius:50%;background:${color};border:3px solid white;box-shadow:0 2px 8px rgba(0,0,0,0.3);display:flex;align-items:center;justify-content:center;">
          <span style="font-size:16px;">${discovered ? '✓' : '🎨'}</span>
        </div>
      </div>
    `,
    iconSize: [36, 36],
    iconAnchor: [18, 18],
    popupAnchor: [0, -22],
  });
}

export function initMapView(): void {
  const container = document.getElementById('map-container')!;

  map = L.map(container, {
    zoomControl: false,
    attributionControl: false,
  });

  // Dark-ish map tiles
  L.tileLayer('https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png', {
    maxZoom: 19,
  }).addTo(map);

  // Center on user position or default
  const state = getState();
  const center = state.userPosition
    ? [state.userPosition.lat, state.userPosition.lng] as [number, number]
    : [DEFAULT_CENTER.lat, DEFAULT_CENTER.lng] as [number, number];
  map.setView(center, DEFAULT_ZOOM);

  // Add mural markers
  addMuralMarkers();

  // Add user position marker
  if (state.userPosition) {
    updateUserMarker();
  }

  // Subscribe to state changes
  unsubscribe = subscribe((newState) => {
    if (newState.userPosition) {
      updateUserMarker();
    }
    updateMuralMarkers();
    updateProgressBar();
    updateProximityToast();
  });

  updateProgressBar();

  // Force a resize after a tick (Leaflet needs this when container was hidden)
  setTimeout(() => map?.invalidateSize(), 100);
}

function addMuralMarkers(): void {
  if (!map) return;
  const state = getState();

  for (const mural of state.murals) {
    const marker = L.marker([mural.lat, mural.lng], {
      icon: createMuralIcon(mural.discovered),
    });

    marker.bindPopup(() => createPopupContent(mural));
    marker.addTo(map);
    muralMarkers.set(mural.id, marker);
  }
}

function createPopupContent(mural: MuralPOI): string {
  const state = getState();
  let distance = '—';
  if (state.userPosition) {
    const dist = calculateDistance(
      state.userPosition.lat, state.userPosition.lng,
      mural.lat, mural.lng
    );
    distance = formatDistance(dist);
  }

  return `
    <div style="min-width:180px;padding:4px;">
      <h3 style="font-size:14px;font-weight:700;margin:0 0 4px;">${mural.name}</h3>
      <p style="font-size:12px;opacity:0.7;margin:0 0 4px;">by ${mural.artist}</p>
      <p style="font-size:12px;opacity:0.8;margin:0 0 8px;">${mural.description}</p>
      <div style="display:flex;justify-content:space-between;align-items:center;">
        <span style="font-size:12px;opacity:0.6;">${distance} away</span>
        <span style="font-size:11px;padding:2px 8px;border-radius:999px;background:${mural.discovered ? '#10b981' : '#8b5cf6'};color:white;">
          ${mural.discovered ? 'Discovered!' : 'Not found'}
        </span>
      </div>
    </div>
  `;
}

function updateUserMarker(): void {
  if (!map) return;
  const state = getState();
  if (!state.userPosition) return;

  const latlng: [number, number] = [state.userPosition.lat, state.userPosition.lng];

  if (!userMarker) {
    userMarker = L.circleMarker(latlng, {
      radius: 8,
      fillColor: '#3b82f6',
      fillOpacity: 1,
      color: 'white',
      weight: 3,
    }).addTo(map);

    accuracyCircle = L.circle(latlng, {
      radius: state.userPosition.accuracy,
      fillColor: '#3b82f6',
      fillOpacity: 0.1,
      color: '#3b82f6',
      weight: 1,
      opacity: 0.3,
    }).addTo(map);

    // Pan to user on first fix
    map.setView(latlng, DEFAULT_ZOOM);
  } else {
    userMarker.setLatLng(latlng);
    accuracyCircle?.setLatLng(latlng);
    accuracyCircle?.setRadius(state.userPosition.accuracy);
  }
}

function updateMuralMarkers(): void {
  const state = getState();
  for (const mural of state.murals) {
    const marker = muralMarkers.get(mural.id);
    if (marker) {
      marker.setIcon(createMuralIcon(mural.discovered));
    }
  }
}

function updateProgressBar(): void {
  const state = getState();
  const total = state.murals.length;
  const discovered = state.murals.filter(m => m.discovered).length;
  const pct = total > 0 ? (discovered / total) * 100 : 0;

  const text = document.getElementById('progress-text');
  const fill = document.getElementById('progress-fill');
  if (text) text.textContent = `${discovered}/${total} Discovered`;
  if (fill) fill.style.width = `${pct}%`;
}

function updateProximityToast(): void {
  const state = getState();
  const toast = document.getElementById('proximity-toast');
  const nameEl = document.getElementById('proximity-mural-name');

  if (!toast || !nameEl) return;

  if (state.nearbyMural && !state.nearbyMural.discovered) {
    nameEl.textContent = state.nearbyMural.name;
    toast.classList.remove('hidden');
  } else {
    toast.classList.add('hidden');
  }
}

export function destroyMapView(): void {
  if (unsubscribe) {
    unsubscribe();
    unsubscribe = null;
  }
  if (map) {
    map.remove();
    map = null;
  }
  userMarker = null;
  accuracyCircle = null;
  muralMarkers.clear();
}

export function centerOnUser(): void {
  const state = getState();
  if (map && state.userPosition) {
    map.setView([state.userPosition.lat, state.userPosition.lng], DEFAULT_ZOOM);
  }
}
