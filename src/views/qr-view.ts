import QrScanner from 'qr-scanner';
import { updateState } from '../state.ts';

let scanner: QrScanner | null = null;

export function initQRView(): void {
  const container = document.getElementById('qr-video-container')!;
  const videoEl = document.createElement('video');
  videoEl.setAttribute('playsinline', 'true');
  container.appendChild(videoEl);

  scanner = new QrScanner(
    videoEl,
    (result) => {
      console.log('[QR] Scanned:', result.data);
      destroyQRView();
      updateState({ qrScanned: true, currentView: 'map' });
    },
    {
      preferredCamera: 'environment',
      highlightScanRegion: false,
      highlightCodeOutline: false,
      returnDetailedScanResult: true,
    }
  );

  scanner.start().catch((err) => {
    console.error('[QR] Camera error:', err);
    showCameraError();
  });
}

export function destroyQRView(): void {
  if (scanner) {
    scanner.stop();
    scanner.destroy();
    scanner = null;
  }
  const container = document.getElementById('qr-video-container')!;
  const video = container.querySelector('video');
  if (video) video.remove();
}

// Allow skipping QR in debug mode
export function skipQR(): void {
  destroyQRView();
  updateState({ qrScanned: true, currentView: 'map' });
}

function showCameraError(): void {
  const container = document.getElementById('qr-view')!;
  const overlay = container.querySelector('.pointer-events-none')!;
  overlay.innerHTML = `
    <div class="text-center px-8">
      <svg class="w-16 h-16 mx-auto mb-4 text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728A9 9 0 015.636 5.636m12.728 12.728L5.636 5.636"/>
      </svg>
      <p class="text-white text-lg font-medium mb-2">Camera Access Required</p>
      <p class="text-white/60 text-sm">Please allow camera access in your browser settings to scan QR codes.</p>
    </div>
  `;
}
