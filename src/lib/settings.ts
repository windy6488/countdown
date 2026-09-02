import type { AppSettings, CompletedMode } from '../types';

export const SETTINGS_STORAGE_KEY = 'countdown-settings-v1';

export const DEFAULT_SETTINGS: AppSettings = {
  completedMode: 'collapse'
};

export function normalizeCompletedMode(value: unknown): CompletedMode {
  return value === 'hidden' ? 'hidden' : 'collapse';
}

export function normalizeSettings(value: unknown): AppSettings {
  if (typeof value !== 'object' || value === null) return { ...DEFAULT_SETTINGS };
  const o = value as Record<string, unknown>;
  return { completedMode: normalizeCompletedMode(o.completedMode) };
}

export function readSettings(storage: {
  getItem(key: string): string | null;
}): { settings: AppSettings; ok: boolean } {
  try {
    const raw = storage.getItem(SETTINGS_STORAGE_KEY);
    if (raw === null) return { settings: { ...DEFAULT_SETTINGS }, ok: true };
    return { settings: normalizeSettings(JSON.parse(raw)), ok: true };
  } catch {
    return { settings: { ...DEFAULT_SETTINGS }, ok: false };
  }
}

export function writeSettings(
  storage: { setItem(key: string, value: string): void },
  settings: AppSettings
): boolean {
  try {
    storage.setItem(SETTINGS_STORAGE_KEY, JSON.stringify(settings));
    return true;
  } catch {
    return false;
  }
}