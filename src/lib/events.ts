import type { EventItem } from '../types';
import { isValidISODate } from './date';

/** 解析并归一化事件；旧版本缺少的新字段按默认值处理 */
export function parseEvent(value: unknown): EventItem | null {
  if (typeof value !== 'object' || value === null) return null;
  const o = value as Record<string, unknown>;
  if (
    typeof o.id !== 'string' ||
    o.id.length === 0 ||
    typeof o.name !== 'string' ||
    o.name.trim().length === 0 ||
    typeof o.details !== 'string' ||
    typeof o.dueDate !== 'string' ||
    !isValidISODate(o.dueDate) ||
    typeof o.completed !== 'boolean' ||
    (o.completedAt !== null && typeof o.completedAt !== 'string') ||
    typeof o.createdAt !== 'string' ||
    typeof o.updatedAt !== 'string'
  ) {
    return null;
  }
  let startDate: string | null = null;
  if (o.startDate !== undefined && o.startDate !== null) {
    if (typeof o.startDate !== 'string' || !isValidISODate(o.startDate)) return null;
    startDate = o.startDate;
  }
  let categoryId: string | null = null;
  if (o.categoryId !== undefined && o.categoryId !== null) {
    if (typeof o.categoryId !== 'string') return null;
    categoryId = o.categoryId;
  }
  let important = false;
  if (o.important !== undefined) {
    if (typeof o.important !== 'boolean') return null;
    important = o.important;
  }
  return {
    id: o.id,
    name: o.name.trim(),
    details: o.details,
    dueDate: o.dueDate,
    startDate,
    categoryId,
    important,
    completed: o.completed,
    completedAt: o.completedAt,
    createdAt: o.createdAt,
    updatedAt: o.updatedAt
  };
}

export function isValidEventItem(value: unknown): value is EventItem {
  return parseEvent(value) !== null;
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
  startDate?: string | null;
  categoryId?: string | null;
  important?: boolean;
}

export function createEvent(input: EventInput): EventItem {
  const now = nowISO();
  return {
    id: makeId(),
    name: input.name.trim(),
    details: input.details.trim(),
    dueDate: input.dueDate,
    startDate: input.startDate ?? null,
    categoryId: input.categoryId ?? null,
    important: input.important ?? false,
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
  startDate?: string | null;
  categoryId?: string | null;
  important?: boolean;
  completed?: boolean;
}

export function applyPatch(events: EventItem[], id: string, patch: EventPatch, now = nowISO()): EventItem[] {
  return events.map((ev) => {
    if (ev.id !== id) return ev;
    const name = patch.name === undefined ? ev.name : patch.name.trim();
    const details = patch.details === undefined ? ev.details : patch.details.trim();
    const dueDate = patch.dueDate === undefined ? ev.dueDate : patch.dueDate;
    const startDate = patch.startDate === undefined ? ev.startDate : patch.startDate;
    const categoryId = patch.categoryId === undefined ? ev.categoryId : patch.categoryId;
    const important = patch.important === undefined ? ev.important : patch.important;
    const completed = patch.completed === undefined ? ev.completed : patch.completed;
    let completedAt = ev.completedAt;
    if (patch.completed === true && !ev.completed) completedAt = now;
    if (patch.completed === false) completedAt = null;
    return {
      ...ev,
      name,
      details,
      dueDate,
      startDate,
      categoryId,
      important,
      completed,
      completedAt,
      updatedAt: now
    };
  });
}

export function removeEvent(events: EventItem[], id: string): EventItem[] {
  return events.filter((ev) => ev.id !== id);
}

/** 未完成按截止日升序排前，已完成按完成时间倒序排在末尾 */
export function sortEvents(events: EventItem[]): EventItem[] {
  // 多日事件按开始日期排，单日事件按截止日期排（开始日期即当天）
  const startKey = (ev: EventItem) => ev.startDate ?? ev.dueDate;
  const byStartDate = (a: EventItem, b: EventItem) =>
    startKey(a).localeCompare(startKey(b)) || a.createdAt.localeCompare(b.createdAt);
  const active = events.filter((ev) => !ev.completed).sort(byStartDate);
  const done = events
    .filter((ev) => ev.completed)
    .sort((a, b) => (b.completedAt ?? '').localeCompare(a.completedAt ?? ''));
  return [...active, ...done];
}

export function eventsOnDay(events: EventItem[], iso: string): EventItem[] {
  return events.filter((ev) => ev.dueDate === iso);
}

/** 某天在事件期间内（含首尾），单日事件只覆盖截止日 */
export function eventsCoveringDay(events: EventItem[], iso: string): EventItem[] {
  return events.filter((ev) => {
    if (!ev.startDate) return ev.dueDate === iso;
    return ev.startDate <= iso && iso <= ev.dueDate;
  });
}