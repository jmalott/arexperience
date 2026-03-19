import * as THREE from 'three';

// MindAR is loaded via CDN (see ar-view.ts), so we define the type here
export interface MindARThreeInstance {
  renderer: THREE.WebGLRenderer;
  scene: THREE.Scene;
  camera: THREE.PerspectiveCamera;
  addAnchor(targetIndex: number): {
    group: THREE.Group;
    onTargetFound: (() => void) | null;
    onTargetLost: (() => void) | null;
  };
  start(): Promise<void>;
  stop(): void;
}

export function setupScene(mindarThree: MindARThreeInstance): void {
  const { scene, renderer } = mindarThree;

  // Ambient light for even illumination
  scene.add(new THREE.AmbientLight(0xffffff, 0.8));

  // Directional light for depth
  const dirLight = new THREE.DirectionalLight(0xffffff, 0.6);
  dirLight.position.set(0.5, 1, 0.5);
  scene.add(dirLight);

  // Optimize for mobile
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
}
