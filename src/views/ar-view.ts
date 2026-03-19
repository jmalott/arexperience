import { getState, markMuralDiscovered } from '../state.ts';
import { saveDiscovery } from '../utils/storage.ts';

// Use globals from CDN script tags (Three.js + MindAR)
declare const THREE: any;
declare const MINDAR: any;

const DEMO_TARGET = 'https://cdn.jsdelivr.net/gh/hiukim/mind-ar-js@1.2.5/examples/image-tracking/assets/card-example/card.mind';

let mindarThree: any = null;
let clock: any = null;
let contentGroups: Map<string, any> = new Map();
let isRunning = false;

// Wait for CDN libs to be ready
function waitForLibs(): Promise<void> {
  return new Promise((resolve) => {
    if ((window as any).MINDAR?.IMAGE?.MindARThree && (window as any).THREE) {
      resolve();
      return;
    }
    window.addEventListener('ar-libs-ready', () => resolve(), { once: true });
    // Timeout fallback
    setTimeout(() => resolve(), 8000);
  });
}

export async function initARView(): Promise<void> {
  const container = document.getElementById('ar-container')!;
  const statusText = document.getElementById('ar-status-text')!;
  const state = getState();

  statusText.textContent = 'Loading AR libraries...';

  try {
    await waitForLibs();

    if (typeof THREE === 'undefined') {
      throw new Error('Three.js failed to load');
    }
    if (typeof MINDAR === 'undefined' || !MINDAR?.IMAGE?.MindARThree) {
      throw new Error('MindAR failed to load');
    }

    const MindARThree = MINDAR.IMAGE.MindARThree;

    mindarThree = new MindARThree({
      container,
      imageTargetSrc: DEMO_TARGET,
      uiLoading: 'no',
      uiScanning: 'no',
      uiError: 'no',
    });

    const { renderer, scene, camera } = mindarThree;

    // Lighting
    scene.add(new THREE.AmbientLight(0xffffff, 0.8));
    const dirLight = new THREE.DirectionalLight(0xffffff, 0.6);
    dirLight.position.set(0.5, 1, 0.5);
    scene.add(dirLight);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));

    clock = new THREE.Clock();

    if (state.debugMode) {
      // Debug: track demo card as single target
      const anchor = mindarThree.addAnchor(0);
      const demoMural = state.murals[0];
      if (demoMural) {
        const content = createMuralContent(demoMural.name);
        anchor.group.add(content);
        contentGroups.set(demoMural.id, content);

        anchor.onTargetFound = () => {
          statusText.textContent = `Found: ${demoMural.name}!`;
          markMuralDiscovered(demoMural.id);
          saveDiscovery(demoMural.id);
          flashDiscovery();
        };
        anchor.onTargetLost = () => {
          statusText.textContent = 'Looking for mural...';
        };
      }
    } else {
      for (const mural of state.murals) {
        const anchor = mindarThree.addAnchor(mural.targetIndex);
        const content = createMuralContent(mural.name);
        anchor.group.add(content);
        contentGroups.set(mural.id, content);

        anchor.onTargetFound = () => {
          statusText.textContent = `Found: ${mural.name}!`;
          if (!mural.discovered) {
            markMuralDiscovered(mural.id);
            saveDiscovery(mural.id);
            flashDiscovery();
          }
        };
        anchor.onTargetLost = () => {
          statusText.textContent = 'Looking for mural...';
        };
      }
    }

    statusText.textContent = 'Starting camera...';
    await mindarThree.start();
    isRunning = true;
    statusText.textContent = 'Point camera at a mural';

    // Animation loop
    renderer.setAnimationLoop(() => {
      if (!clock || !isRunning) return;
      const delta = clock.getDelta();
      const elapsed = clock.getElapsedTime();

      for (const group of contentGroups.values()) {
        animateGroup(group, elapsed, delta);
      }
      renderer.render(scene, camera);
    });

  } catch (err: any) {
    console.error('[AR] Init error:', err);
    statusText.textContent = `AR failed: ${err.message || err}`;
  }
}

export function destroyARView(): void {
  isRunning = false;

  if (mindarThree) {
    try {
      mindarThree.renderer.setAnimationLoop(null);
      mindarThree.stop();
    } catch (e) {
      console.warn('[AR] Stop error:', e);
    }
    contentGroups.clear();
    mindarThree = null;
  }
  clock = null;

  const container = document.getElementById('ar-container')!;
  container.innerHTML = '';
}

// --- Three.js content creation using global THREE ---

function createMuralContent(name: string): any {
  const group = new THREE.Group();
  group.add(createTitleSprite(name));
  group.add(createPulsingRing());
  group.add(createParticleSystem());
  group.add(createDiscoveryBadge());
  return group;
}

function createTitleSprite(text: string): any {
  const canvas = document.createElement('canvas');
  const ctx = canvas.getContext('2d')!;
  canvas.width = 512;
  canvas.height = 128;

  ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
  roundRect(ctx, 0, 16, 512, 96, 20);
  ctx.fill();

  ctx.fillStyle = '#ffffff';
  ctx.font = 'bold 36px -apple-system, BlinkMacSystemFont, sans-serif';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText(text, 256, 64, 480);

  const texture = new THREE.CanvasTexture(canvas);
  const material = new THREE.SpriteMaterial({ map: texture, transparent: true, depthTest: false });
  const sprite = new THREE.Sprite(material);
  sprite.scale.set(0.8, 0.2, 1);
  sprite.position.set(0, 0.45, 0.05);
  sprite.userData.type = 'title';
  return sprite;
}

function createPulsingRing(): any {
  const geometry = new THREE.TorusGeometry(0.35, 0.015, 16, 64);
  const material = new THREE.MeshStandardMaterial({
    color: 0x8b5cf6,
    emissive: 0x8b5cf6,
    emissiveIntensity: 0.5,
    transparent: true,
    opacity: 0.8,
  });
  const ring = new THREE.Mesh(geometry, material);
  ring.position.set(0, 0, 0.05);
  ring.userData.type = 'ring';
  return ring;
}

function createParticleSystem(count: number = 40): any {
  const positions = new Float32Array(count * 3);
  const velocities = new Float32Array(count * 3);

  for (let i = 0; i < count; i++) {
    const i3 = i * 3;
    positions[i3] = (Math.random() - 0.5) * 0.5;
    positions[i3 + 1] = Math.random() * 0.4;
    positions[i3 + 2] = (Math.random() - 0.5) * 0.1 + 0.05;
    velocities[i3] = (Math.random() - 0.5) * 0.005;
    velocities[i3 + 1] = 0.003 + Math.random() * 0.008;
    velocities[i3 + 2] = (Math.random() - 0.5) * 0.005;
  }

  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
  geometry.userData = { velocities };

  const canvas = document.createElement('canvas');
  canvas.width = 32;
  canvas.height = 32;
  const ctx = canvas.getContext('2d')!;
  const gradient = ctx.createRadialGradient(16, 16, 0, 16, 16, 16);
  gradient.addColorStop(0, 'rgba(139, 92, 246, 1)');
  gradient.addColorStop(0.3, 'rgba(139, 92, 246, 0.8)');
  gradient.addColorStop(1, 'rgba(139, 92, 246, 0)');
  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, 32, 32);

  const texture = new THREE.CanvasTexture(canvas);
  const material = new THREE.PointsMaterial({
    size: 0.03,
    map: texture,
    transparent: true,
    blending: THREE.AdditiveBlending,
    depthWrite: false,
    sizeAttenuation: true,
  });

  const points = new THREE.Points(geometry, material);
  points.userData.type = 'particles';
  return points;
}

function createDiscoveryBadge(): any {
  const canvas = document.createElement('canvas');
  const ctx = canvas.getContext('2d')!;
  canvas.width = 256;
  canvas.height = 64;

  ctx.fillStyle = '#10b981';
  roundRect(ctx, 0, 0, 256, 64, 32);
  ctx.fill();

  ctx.fillStyle = '#ffffff';
  ctx.font = 'bold 28px -apple-system, BlinkMacSystemFont, sans-serif';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText('Discovered!', 128, 32);

  const texture = new THREE.CanvasTexture(canvas);
  const material = new THREE.SpriteMaterial({ map: texture, transparent: true, depthTest: false });
  const sprite = new THREE.Sprite(material);
  sprite.scale.set(0.4, 0.1, 1);
  sprite.position.set(0, -0.4, 0.05);
  return sprite;
}

// --- Animations ---

function animateGroup(group: any, time: number, delta: number): void {
  for (const child of group.children) {
    const type = child.userData?.type;
    if (type === 'particles') {
      const positions = child.geometry.getAttribute('position');
      const velocities = child.geometry.userData?.velocities;
      if (!positions || !velocities) continue;
      const arr = positions.array;
      for (let i = 0; i < positions.count; i++) {
        const i3 = i * 3;
        arr[i3] += velocities[i3] * delta * 60;
        arr[i3 + 1] += velocities[i3 + 1] * delta * 60;
        arr[i3 + 2] += velocities[i3 + 2] * delta * 60;
        if (arr[i3 + 1] > 0.5) {
          arr[i3] = (Math.random() - 0.5) * 0.5;
          arr[i3 + 1] = 0;
          arr[i3 + 2] = (Math.random() - 0.5) * 0.1 + 0.05;
        }
      }
      positions.needsUpdate = true;
    } else if (type === 'ring') {
      const scale = 1 + Math.sin(time * 2) * 0.1;
      child.scale.set(scale, scale, 1);
      child.material.emissiveIntensity = 0.3 + Math.sin(time * 3) * 0.3;
      child.material.opacity = 0.6 + Math.sin(time * 2) * 0.2;
    } else if (type === 'title') {
      child.position.y = 0.45 + Math.sin(time * 1.5) * 0.02;
    }
  }
}

function flashDiscovery(): void {
  const flash = document.createElement('div');
  flash.className = 'fixed inset-0 z-50 pointer-events-none discovery-flash';
  document.body.appendChild(flash);
  setTimeout(() => flash.remove(), 700);
}

function roundRect(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, r: number): void {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.lineTo(x + w - r, y);
  ctx.quadraticCurveTo(x + w, y, x + w, y + r);
  ctx.lineTo(x + w, y + h - r);
  ctx.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
  ctx.lineTo(x + r, y + h);
  ctx.quadraticCurveTo(x, y + h, x, y + h - r);
  ctx.lineTo(x, y + r);
  ctx.quadraticCurveTo(x, y, x + r, y);
  ctx.closePath();
}
