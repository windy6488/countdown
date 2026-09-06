import { describe, expect, it } from 'vitest';
import type { Category, EventItem } from '../types';
import {
  CATEGORIES_STORAGE_KEY,
  EVENTS_STORAGE_KEY,
  readCategories,
  readEvents,
  writeCategories,
  writeEvents,
  type StorageLike
} from './storage';

function memoryStorage(initial: Record<string, string> = {}): StorageLike {
  const map = new Map(Object.entries(initial));
  return {
    getItem: (key) => map.get(key) ?? null,
    setItem: (key, value) => {
      map.set(key, value);
    }
  };
}

const ev: EventItem = {
  id: 'e1',
  name: '测试',
  details: '',
  dueDate: '2026-09-09',
  startDate: null,
  categoryId: null,
  completed: false,
  completedAt: null,
  createdAt: '2026-01-01T00:00:00.000Z',
  updatedAt: '2026-01-01T00:00:00.000Z'
};

const cat: Category = { id: 'c1', name: '工作' };

describe('storage 事件读写与损坏回退', () => {
  it('空存储返回空列表且 ok', () => {
    const res = readEvents(memoryStorage());
    expect(res).toEqual({ events: [], ok: true });
  });

  it('写入后可原样读回', () => {
    const storage = memoryStorage();
    expect(writeEvents(storage, [ev])).toBe(true);
    expect(readEvents(storage)).toEqual({ events: [ev], ok: true });
  });

  it('JSON 损坏时回退为空并标记 ok=false', () => {
    const storage = memoryStorage({ [EVENTS_STORAGE_KEY]: '{broken' });
    const res = readEvents(storage);
    expect(res.events).toEqual([]);
    expect(res.ok).toBe(false);
  });

  it('含非法条目时只保留合法条目并标记 ok=false', () => {
    const legacy = { ...ev };
    delete (legacy as Partial<EventItem>).categoryId;
    delete (legacy as Partial<EventItem>).startDate;
    const storage = memoryStorage({
      [EVENTS_STORAGE_KEY]: JSON.stringify([legacy, { id: 'bad', name: '' }])
    });
    const res = readEvents(storage);
    expect(res.events).toHaveLength(1);
    expect(res.events[0].categoryId).toBeNull();
    expect(res.events[0].startDate).toBeNull();
    expect(res.ok).toBe(false);
  });

  it('setItem 抛错时 writeEvents 返回 false', () => {
    const broken: StorageLike = {
      getItem: () => null,
      setItem: () => {
        throw new Error('quota');
      }
    };
    expect(writeEvents(broken, [ev])).toBe(false);
  });
});

describe('storage 分类读写', () => {
  it('空存储返回空分类且 ok', () => {
    expect(readCategories(memoryStorage())).toEqual({ categories: [], ok: true });
  });

  it('分类可写入并读回，名称会被裁剪', () => {
    const storage = memoryStorage();
    expect(writeCategories(storage, [cat])).toBe(true);
    expect(readCategories(storage)).toEqual({ categories: [cat], ok: true });
    const padded: Category = { id: 'c2', name: '  生活  ' };
    writeCategories(storage, [padded]);
    expect(readCategories(storage).categories[0].name).toBe('生活');
  });

  it('分类数据损坏时回退为空并标记 ok=false', () => {
    const storage = memoryStorage({ [CATEGORIES_STORAGE_KEY]: '[]' });
    const res = readCategories(storage);
    expect(res.categories).toEqual([]);
    expect(res.ok).toBe(true);
    const broken = memoryStorage({ [CATEGORIES_STORAGE_KEY]: '{bad' });
    expect(broken && readCategories(broken).ok).toBe(false);
  });
});