import type { EventItem } from '../types';
import { isValidISODate } from './date';

export function isValidEventItem(value: unknown): value is EventItem {
  if (typeof value !== 'object' || value === null) return false;
  const o = value as Record<string, unknown>;
  return (
    typeof o.id === 'string' &&
    o.id.length > 0 &&
    typeof o.name === 'string' &&
    o.name.trim().length > 0 &&
    typeof o.details === 'string' &&
    typeof o.dueDate === 'string' &&
    isValidISODate(o.dueDate) &&
    typeof o.completed === 'boolean' &&
    (o.completedAt === null || typeof o.completedAt === 'string') &&
    typeof o.createdAt === 'string' &&
    typeof o.updatedAt === 'string'
  );
}

export function makeId(): string {
  const c = globalThis.crypto;
  if (c && typeof c.randomUUID === 'function') {
    return c.randomUUID();
  }
  return `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 10)}`;
}

export function nowISO(): string {
  return new Date().toISOString();
}

export interface EventInput {
  name: string;
  details: string;
  dueDate: string;
}

export function createEvent(input: EventInput): EventItem {
  const now = nowISO();
  return {
    id: makeId(),
    name: input.name.trim(),
    details: input.details.trim(),
    dueDate: input.dueDate,
    completed: false,
    completedAt: null,
    createdAt: now,
    updatedAt: now
  };
}

export interface EventPatch {
  name?: string;
  details?: string;
  dueDate?: string;
  completed?: boolean;
}

export function applyPatch(events: EventItem[], id: string, patch: EventPatch, now = nowISO()): EventItem[] {
  return events.map((ev) => {
    if (ev.id !== id) return ev;
    const name = patch.name === undefined ? ev.name : patch.name.trim();
    const details = patch.details === undefined ? ev.details : patch.details.trim();
    const dueDate = patch.dueDate === undefined ? ev.dueDate : patch.dueDate;
    const completed = patch.completed === undefined ? ev.completed : patch.completed;
    let completedAt = ev.completedAt;
    if (patch.completed === true && !ev.completed) completedAt = now;
    if (patch.completed === false) completedAt = null;
    return { ...ev, name, details, dueDate, completed, completedAt, updatedAt: now };
  });
}

export function removeEvent(events: EventItem[], id: string): EventItem[] {
  return events.filter((ev) => ev.id !== id);
}

/** 未完成按截止日升序排前，已完成按完成时间倒序排在末尾 */
export function sortEvents(events: EventItem[]): EventItem[] {
  const byDueDate = (a: EventItem, b: EventItem) =>
    a.dueDate.localeCompare(b.dueDate) || a.createdAt.localeCompare(b.createdAt);
  const active = events.filter((ev) => !ev.completed).sort(byDueDate);
  const done = events
    .filter((ev) => ev.completed)
    .sort((a, b) => (b.completedAt ?? '').localeCompare(a.completedAt ?? ''));
  return [...active, ...done];
}

export function eventsOnDay(events: EventItem[], iso: string): EventItem[] {
  return events.filter((ev) => ev.dueDate === iso);
}
