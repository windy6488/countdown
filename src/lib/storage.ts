import type { EventItem } from '../types';
import { isValidEventItem } from './events';

export const EVENTS_STORAGE_KEY = 'countdown-events-v1';

export interface StorageLike {
  getItem(key: string): string | null;
  setItem(key: string, value: string): void;
}

export interface LoadResult {
  events: EventItem[];
  ok: boolean;
}

export function readEvents(storage: StorageLike): LoadResult {
  try {
    const raw = storage.getItem(EVENTS_STORAGE_KEY);
    if (raw === null) return { events: [], ok: true };
    const parsed: unknown = JSON.parse(raw);
    if (!Array.isArray(parsed)) return { events: [], ok: false };
    const valid = parsed.filter(isValidEventItem);
    const events = valid.map((item) => ({ ...(item as EventItem) }));
    return { events, ok: events.length === parsed.length };
  } catch {
    return { events: [], ok: false };
  }
}

export function writeEvents(storage: StorageLike, events: EventItem[]): boolean {
  try {
    storage.setItem(EVENTS_STORAGE_KEY, JSON.stringify(events));
    return true;
  } catch {
    return false;
  }
}
