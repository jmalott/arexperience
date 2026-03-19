import './styles.css';
import { getState, subscribe, updateState } from './state.ts';
import { MURALS } from './data/murals.ts';
import { loadDiscoveries } from './utils/storage.ts';
import { startWatching } from './utils/geolocation.ts';
import { checkProximity } from './utils/proximity.ts';
import { initQRView, destroyQRView, skipQR } from './views/qr-view.ts';
import { initMapView, destroyMapView } from './views/map-view.ts';
import { initARView, destroyARView } from './views/ar-view.ts';
import type { ViewName } from './types.ts';

// Initialize app
function init(): void {
  // Load murals and saved discoveries
  const savedDiscoveries = loadDiscoveries();
  const murals = MURALS.map(m => ({
    ...m,
    discovered: savedDiscoveries.includes(m.id),
  }));
  updateState({ murals });

  const state = getState();

  // Debug mode: skip QR, go straight to map
  if (state.debugMode) {
    console.log('[App] Debug mode enabled - skipping QR, proximity override active');
    onQRScanned();
    return;
  }

  // Start with QR view
  initQRView();

  // Subscribe to state changes for view management
  let qrHandled = false;
  subscribe((newState) => {
    if (!qrHandled && newState.qrScanned && newState.currentView === 'map') {
      qrHandled = true;
      onQRScanned();
    }
  });
}

let currentView: ViewName | null = null;

function onQRScanned(): void {
  // Start GPS
  startWatching();

  // Subscribe to position changes for proximity checks
  subscribe(() => checkProximity());

  // Show nav bar
  document.getElementById('nav-bar')!.classList.remove('hidden');

  // Switch to map
  switchView('map');

  // Wire nav buttons
  document.getElementById('btn-map')!.addEventListener('click', () => switchView('map'));
  document.getElementById('btn-ar')!.addEventListener('click', () => switchView('ar'));

  // Wire proximity toast click
  document.getElementById('proximity-toast-inner')!.addEventListener('click', () => switchView('ar'));
}

async function switchView(view: ViewName): Promise<void> {
  if (view === currentView) return;

  // Destroy current view
  if (currentView === 'qr') destroyQRView();
  if (currentView === 'map') destroyMapView();
  if (currentView === 'ar') destroyARView();

  // Hide all views
  document.getElementById('qr-view')!.classList.add('hidden');
  document.getElementById('map-view')!.classList.add('hidden');
  document.getElementById('ar-view')!.classList.add('hidden');

  // Show and init target view
  currentView = view;

  if (view === 'map') {
    document.getElementById('map-view')!.classList.remove('hidden');
    initMapView();
  } else if (view === 'ar') {
    document.getElementById('ar-view')!.classList.remove('hidden');
    await initARView();
  }

  // Update nav button states
  document.querySelectorAll('.nav-btn').forEach(btn => btn.classList.remove('active'));
  if (view === 'map') {
    document.getElementById('btn-map')!.classList.add('active');
  } else if (view === 'ar') {
    document.getElementById('btn-ar')!.classList.add('active');
  }
}

// Boot
document.addEventListener('DOMContentLoaded', init);
