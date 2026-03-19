import * as THREE from 'three';

// Create a text sprite using canvas rendering
export function createTitleSprite(text: string): THREE.Sprite {
  const canvas = document.createElement('canvas');
  const ctx = canvas.getContext('2d')!;
  canvas.width = 512;
  canvas.height = 128;

  // Background
  ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
  roundRect(ctx, 0, 16, 512, 96, 20);
  ctx.fill();

  // Text
  ctx.fillStyle = '#ffffff';
  ctx.font = 'bold 36px -apple-system, BlinkMacSystemFont, sans-serif';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText(text, 256, 64, 480);

  const texture = new THREE.CanvasTexture(canvas);
  texture.needsUpdate = true;

  const material = new THREE.SpriteMaterial({
    map: texture,
    transparent: true,
    depthTest: false,
  });

  const sprite = new THREE.Sprite(material);
  sprite.scale.set(0.8, 0.2, 1);
  sprite.position.set(0, 0.45, 0.05);

  return sprite;
}

// Create a pulsing ring that appears around the tracked image
export function createPulsingRing(): THREE.Mesh {
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

  return ring;
}

// Create a particle system for sparkle effects
export function createParticleSystem(count: number = 60): THREE.Points {
  const positions = new Float32Array(count * 3);
  const velocities = new Float32Array(count * 3);
  const sizes = new Float32Array(count);

  for (let i = 0; i < count; i++) {
    const i3 = i * 3;
    // Spread around the target area
    positions[i3] = (Math.random() - 0.5) * 0.5;
    positions[i3 + 1] = Math.random() * 0.4;
    positions[i3 + 2] = (Math.random() - 0.5) * 0.1 + 0.05;

    velocities[i3] = (Math.random() - 0.5) * 0.005;
    velocities[i3 + 1] = 0.003 + Math.random() * 0.008;
    velocities[i3 + 2] = (Math.random() - 0.5) * 0.005;

    sizes[i] = 2 + Math.random() * 4;
  }

  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
  geometry.setAttribute('size', new THREE.BufferAttribute(sizes, 1));

  // Store velocities for animation
  (geometry as any)._velocities = velocities;

  // Create a small circle texture for particles
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

  return new THREE.Points(geometry, material);
}

// Create a "Discovered!" badge sprite
export function createDiscoveryBadge(): THREE.Sprite {
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
  ctx.fillText('Discovered! ✓', 128, 32);

  const texture = new THREE.CanvasTexture(canvas);
  const material = new THREE.SpriteMaterial({
    map: texture,
    transparent: true,
    depthTest: false,
  });

  const sprite = new THREE.Sprite(material);
  sprite.scale.set(0.4, 0.1, 1);
  sprite.position.set(0, -0.4, 0.05);

  return sprite;
}

// Compose all content for a mural target
export function createMuralContent(name: string): THREE.Group {
  const group = new THREE.Group();

  group.add(createTitleSprite(name));
  group.add(createPulsingRing());
  group.add(createParticleSystem());
  group.add(createDiscoveryBadge());

  return group;
}

// Helper for rounded rectangles
function roundRect(
  ctx: CanvasRenderingContext2D,
  x: number, y: number,
  w: number, h: number,
  r: number
): void {
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
