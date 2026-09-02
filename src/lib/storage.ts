import type { Category, EventItem } from '../types';
import { parseEvent } from './events';
import { normalizeCategory } from './categories';

export const EVENTS_STORAGE_KEY = 'countdown-events-v1';
export const CATEGORIES_STORAGE_KEY = 'countdown-categories-v1';

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
    const valid: EventItem[] = [];
    for (const item of parsed) {
      const normalized = parseEvent(item);
      if (normalized) valid.push(normalized);
    }
    return { events: valid, ok: valid.length === parsed.length };
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

export function readCategories(storage: StorageLike): { categories: Category[]; ok: boolean } {
  try {
    const raw = storage.getItem(CATEGORIES_STORAGE_KEY);
    if (raw === null) return { categories: [], ok: true };
    const parsed: unknown = JSON.parse(raw);
    if (!Array.isArray(parsed)) return { categories: [], ok: false };
    const valid: Category[] = [];
    for (const item of parsed) {
      const normalized = normalizeCategory(item);
      if (normalized) valid.push(normalized);
    }
    return { categories: valid, ok: valid.length === parsed.length };
  } catch {
    return { categories: [], ok: false };
  }
}

export function writeCategories(storage: StorageLike, categories: Category[]): boolean {
  try {
    storage.setItem(CATEGORIES_STORAGE_KEY, JSON.stringify(categories));
    return true;
  } catch {
    return false;
  }
}