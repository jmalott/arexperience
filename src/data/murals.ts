import type { MuralPOI } from '../types.ts';

// Sample downtown mural locations (Austin, TX area as example)
// Replace coordinates with actual mural locations for deployment
export const MURALS: MuralPOI[] = [
  {
    id: 'mural-1',
    name: 'Greetings from Austin',
    artist: 'Todd Sanders',
    description: 'The iconic "Greetings from Austin" postcard mural on South 1st Street.',
    lat: 30.2530,
    lng: -97.7530,
    targetIndex: 0,
    discovered: false,
  },
  {
    id: 'mural-2',
    name: 'You\'re My Butter Half',
    artist: 'John Rockwell',
    description: 'A beloved mural featuring a smiling piece of toast and butter pat.',
    lat: 30.2590,
    lng: -97.7380,
    targetIndex: 1,
    discovered: false,
  },
  {
    id: 'mural-3',
    name: 'I Love You So Much',
    artist: 'Amy Cook',
    description: 'The famous "I love you so much" spray-painted on Jo\'s Coffee wall.',
    lat: 30.2495,
    lng: -97.7530,
    targetIndex: 2,
    discovered: false,
  },
  {
    id: 'mural-4',
    name: 'Hi, How Are You',
    artist: 'Daniel Johnston',
    description: 'The Jeremiah the Innocent frog mural, a beloved Austin landmark.',
    lat: 30.2685,
    lng: -97.7420,
    targetIndex: 3,
    discovered: false,
  },
  {
    id: 'mural-5',
    name: 'Willie Nelson',
    artist: 'Federico Archuleta',
    description: 'A large portrait of Willie Nelson on the side of a downtown building.',
    lat: 30.2670,
    lng: -97.7385,
    targetIndex: 4,
    discovered: false,
  },
  {
    id: 'mural-6',
    name: 'Cosmic Bloom',
    artist: 'Zuzu Perkal',
    description: 'A vibrant floral explosion mural spanning an entire building facade.',
    lat: 30.2615,
    lng: -97.7455,
    targetIndex: 5,
    discovered: false,
  },
];

// Center point for default map view (downtown Austin)
export const DEFAULT_CENTER = { lat: 30.2600, lng: -97.7440 };
export const DEFAULT_ZOOM = 15;
export const PROXIMITY_THRESHOLD_METERS = 50;
