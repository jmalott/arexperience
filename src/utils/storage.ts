const STORAGE_KEY = 'mural-discoveries';

export function loadDiscoveries(): string[] {
  try {
    const data = localStorage.getItem(STORAGE_KEY);
    if (!data) return [];
    return JSON.parse(data) as string[];
  } catch {
    return [];
  }
}

export function saveDiscovery(muralId: string): void {
  const discoveries = loadDiscoveries();
  if (!discoveries.includes(muralId)) {
    discoveries.push(muralId);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(discoveries));
  }
}

export function clearDiscoveries(): void {
  localStorage.removeItem(STORAGE_KEY);
}
