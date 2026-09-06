import { describe, expect, it } from 'vitest';
import type { Category, EventItem } from '../types';
import { clearCategoryRefs, createCategoryName, isValidCategory, normalizeCategory } from './categories';

function makeEvent(overrides: Partial<EventItem> = {}): EventItem {
  return {
    id: 'e1',
    name: '测试',
    details: '',
    dueDate: '2026-09-10',
    startDate: null,
    categoryId: 'c1',
    completed: false,
    completedAt: null,
    createdAt: '2026-01-01T00:00:00.000Z',
    updatedAt: '2026-01-01T00:00:00.000Z',
    ...overrides
  };
}

describe('categories 分类纯逻辑', () => {
  it('normalizeCategory 裁剪名称并拒绝非法值', () => {
    expect(normalizeCategory({ id: 'c1', name: '  工作  ' })).toEqual({ id: 'c1', name: '工作' });
    expect(normalizeCategory({ id: '', name: '工作' })).toBeNull();
    expect(normalizeCategory({ id: 'c1', name: '   ' })).toBeNull();
    expect(normalizeCategory(null)).toBeNull();
    expect(isValidCategory({ id: 'c1', name: '生活' })).toBe(true);
  });

  it('createCategoryName 校验空值/超长/重名并去空格', () => {
    const existing: Category[] = [{ id: 'c1', name: '工作' }];
    expect(createCategoryName(existing, '   ').ok).toBe(false);
    expect(createCategoryName(existing, '工作').ok).toBe(false);
    expect(createCategoryName(existing, '一个超级超级超级长的分类名称').ok).toBe(false);
    const ok = createCategoryName(existing, '  生活  ');
    expect(ok.ok).toBe(true);
    expect(ok.category?.name).toBe('生活');
    expect(ok.category?.id.length).toBeGreaterThan(0);
  });

  it('clearCategoryRefs 只清空指定分类的引用', () => {
    const list = [
      makeEvent({ id: 'a' }),
      makeEvent({ id: 'b', categoryId: 'c2' }),
      makeEvent({ id: 'c', categoryId: null })
    ];
    const next = clearCategoryRefs(list, 'c1');
    expect(next.map((e) => e.categoryId)).toEqual([null, 'c2', null]);
    expect(list[0].categoryId).toBe('c1'); // 原数组不被修改
  });
});