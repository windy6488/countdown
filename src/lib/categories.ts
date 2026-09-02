import type { Category, EventItem } from '../types';
import { makeId } from './events';

export function normalizeCategory(value: unknown): Category | null {
  if (typeof value !== 'object' || value === null) return null;
  const o = value as Record<string, unknown>;
  if (typeof o.id !== 'string' || o.id.length === 0) return null;
  if (typeof o.name !== 'string' || o.name.trim().length === 0) return null;
  return { id: o.id, name: o.name.trim() };
}

export function isValidCategory(value: unknown): value is Category {
  return normalizeCategory(value) !== null;
}

export interface CreateCategoryResult {
  ok: boolean;
  error?: string;
  category?: Category;
}

export function createCategoryName(categories: Category[], rawName: string): CreateCategoryResult {
  const name = rawName.trim();
  if (!name) return { ok: false, error: '请输入分类名称' };
  if (name.length > 12) return { ok: false, error: '分类名称不能超过 12 个字' };
  if (categories.some((c) => c.name === name)) {
    return { ok: false, error: '该分类已存在' };
  }
  return { ok: true, category: { id: makeId(), name } };
}

/** 删除分类后，把引用它的所有事件置为未分类 */
export function clearCategoryRefs(events: EventItem[], categoryId: string): EventItem[] {
  return events.map((ev) =>
    ev.categoryId === categoryId ? { ...ev, categoryId: null } : ev
  );
}