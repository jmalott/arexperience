import * as THREE from 'three';

export function animateParticles(points: THREE.Points, delta: number): void {
  const positions = points.geometry.getAttribute('position') as THREE.BufferAttribute;
  const velocities = (points.geometry as any)._velocities as Float32Array;

  if (!positions || !velocities) return;

  const arr = positions.array as Float32Array;
  const count = positions.count;

  for (let i = 0; i < count; i++) {
    const i3 = i * 3;
    const vx = velocities[i3] ?? 0;
    const vy = velocities[i3 + 1] ?? 0;
    const vz = velocities[i3 + 2] ?? 0;
    arr[i3] = (arr[i3] ?? 0) + vx * delta * 60;
    arr[i3 + 1] = (arr[i3 + 1] ?? 0) + vy * delta * 60;
    arr[i3 + 2] = (arr[i3 + 2] ?? 0) + vz * delta * 60;

    // Reset particles that go too high
    if ((arr[i3 + 1] ?? 0) > 0.5) {
      arr[i3] = (Math.random() - 0.5) * 0.5;
      arr[i3 + 1] = 0;
      arr[i3 + 2] = (Math.random() - 0.5) * 0.1 + 0.05;
    }
  }

  positions.needsUpdate = true;
}

export function animateRing(ring: THREE.Mesh, time: number): void {
  const scale = 1 + Math.sin(time * 2) * 0.1;
  ring.scale.set(scale, scale, 1);

  const material = ring.material as THREE.MeshStandardMaterial;
  material.emissiveIntensity = 0.3 + Math.sin(time * 3) * 0.3;
  material.opacity = 0.6 + Math.sin(time * 2) * 0.2;
}

export function animateTitle(sprite: THREE.Sprite, time: number): void {
  sprite.position.y = 0.45 + Math.sin(time * 1.5) * 0.02;
}

// Run all animations for a mural content group
export function animateGroup(group: THREE.Group, time: number, delta: number): void {
  for (const child of group.children) {
    if (child instanceof THREE.Points) {
      animateParticles(child, delta);
    } else if (child instanceof THREE.Mesh && child.geometry instanceof THREE.TorusGeometry) {
      animateRing(child, time);
    } else if (child instanceof THREE.Sprite && child.position.y > 0.5) {
      animateTitle(child, time);
    }
  }
}
