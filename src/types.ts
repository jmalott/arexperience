export interface MuralPOI {
  id: string;
  name: string;
  artist: string;
  description: string;
  lat: number;
  lng: number;
  targetIndex: number;
  discovered: boolean;
}

export interface UserPosition {
  lat: number;
  lng: number;
  accuracy: number;
  heading: number | null;
}

export type ViewName = 'qr' | 'map' | 'ar';

export interface AppState {
  currentView: ViewName;
  userPosition: UserPosition | null;
  murals: MuralPOI[];
  nearbyMural: MuralPOI | null;
  arActive: boolean;
  qrScanned: boolean;
  debugMode: boolean;
}
