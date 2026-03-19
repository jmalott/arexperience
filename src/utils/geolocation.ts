import { setUserPosition } from '../state.ts';
import type { UserPosition } from '../types.ts';

let watchId: number | null = null;

export function startWatching(): void {
  if (watchId !== null) return;
  if (!navigator.geolocation) {
    showGPSError('Geolocation is not supported by your browser.');
    return;
  }

  watchId = navigator.geolocation.watchPosition(
    (position) => {
      const pos: UserPosition = {
        lat: position.coords.latitude,
        lng: position.coords.longitude,
        accuracy: position.coords.accuracy,
        heading: position.coords.heading,
      };
      setUserPosition(pos);
    },
    (error) => {
      switch (error.code) {
        case error.PERMISSION_DENIED:
          showGPSError('Location access denied. Please enable GPS in your browser settings.');
          break;
        case error.POSITION_UNAVAILABLE:
          showGPSError('Location unavailable. Please try again outdoors.');
          break;
        case error.TIMEOUT:
          showGPSError('Location request timed out. Retrying...');
          break;
      }
    },
    {
      enableHighAccuracy: true,
      maximumAge: 5000,
      timeout: 15000,
    }
  );
}

export function stopWatching(): void {
  if (watchId !== null) {
    navigator.geolocation.clearWatch(watchId);
    watchId = null;
  }
}

function showGPSError(message: string): void {
  console.warn('[GPS]', message);
  // Show a non-blocking toast
  const existing = document.getElementById('gps-error');
  if (existing) existing.remove();

  const toast = document.createElement('div');
  toast.id = 'gps-error';
  toast.className = 'fixed top-4 inset-x-4 z-50 bg-red-600/90 backdrop-blur-sm text-white text-sm px-4 py-3 rounded-xl text-center';
  toast.textContent = message;
  document.body.appendChild(toast);
  setTimeout(() => toast.remove(), 5000);
}

// Haversine distance in meters between two GPS coordinates
export function calculateDistance(
  lat1: number, lng1: number,
  lat2: number, lng2: number
): number {
  const R = 6371000; // Earth radius in meters
  const dLat = toRad(lat2 - lat1);
  const dLng = toRad(lng2 - lng1);
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) *
    Math.sin(dLng / 2) * Math.sin(dLng / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

function toRad(deg: number): number {
  return deg * (Math.PI / 180);
}

export function formatDistance(meters: number): string {
  if (meters < 1000) {
    return `${Math.round(meters)}m`;
  }
  return `${(meters / 1000).toFixed(1)}km`;
}
