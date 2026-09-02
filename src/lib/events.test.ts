import { describe, expect, it } from 'vitest';
import type { EventItem } from '../types';
import {
  applyPatch,
  createEvent,
  eventsOnDay,
  isValidEventItem,
  parseEvent,
  removeEvent,
  sortEvents
} from './events';

function makeEvent(overrides: Partial<EventItem> = {}): EventItem {
  return {
    id: 'e1',
    name: '测试事件',
    details: '详情',
    dueDate: '2026-09-10',
    categoryId: null,
    completed: false,
    completedAt: null,
    createdAt: '2026-01-01T00:00:00.000Z',
    updatedAt: '2026-01-01T00:00:00.000Z',
    ...overrides
  };
}

describe('events 纯函数', () => {
  it('isValidEventItem 校验字段，兼容缺少 categoryId 的旧数据', () => {
    expect(isValidEventItem(makeEvent())).toBe(true);
    const legacy = makeEvent();
    delete (legacy as Partial<EventItem>).categoryId;
    expect(isValidEventItem(legacy)).toBe(true);
    const parsed = parseEvent(legacy);
    expect(parsed?.categoryId).toBeNull();
    expect(isValidEventItem({ ...makeEvent(), categoryId: 123 })).toBe(false);
    expect(isValidEventItem(makeEvent({ dueDate: '2026-02-29' }))).toBe(false);
    expect(isValidEventItem(null)).toBe(false);
  });

  it('createEvent 生成未完成事件，默认未分类并支持指定分类', () => {
    const ev = createEvent({ name: ' 发布会 ', details: '  带电脑  ', dueDate: '2026-10-01' });
    expect(ev.name).toBe('发布会');
    expect(ev.details).toBe('带电脑');
    expect(ev.completed).toBe(false);
    expect(ev.completedAt).toBeNull();
    expect(ev.categoryId).toBeNull();
    expect(ev.id.length).toBeGreaterThan(0);
    const categorized = createEvent({
      name: '报告',
      details: '',
      dueDate: '2026-10-02',
      categoryId: 'cat-1'
    });
    expect(categorized.categoryId).toBe('cat-1');
  });

  it('applyPatch 完成/取消完成时正确迁移 completedAt', () => {
    const base = makeEvent();
    const completed = applyPatch([base], 'e1', { completed: true }, '2026-09-02T08:00:00.000Z');
    expect(completed[0].completed).toBe(true);
    expect(completed[0].completedAt).toBe('2026-09-02T08:00:00.000Z');
    const uncompleted = applyPatch(completed, 'e1', { completed: false }, '2026-09-03T08:00:00.000Z');
    expect(uncompleted[0].completed).toBe(false);
    expect(uncompleted[0].completedAt).toBeNull();
  });

  it('applyPatch 可修改与清空分类', () => {
    const base = makeEvent();
    const assigned = applyPatch([base], 'e1', { categoryId: 'work' });
    expect(assigned[0].categoryId).toBe('work');
    const cleared = applyPatch(assigned, 'e1', { categoryId: null });
    expect(cleared[0].categoryId).toBeNull();
  });

  it('applyPatch 保留已完成事件原有的完成时间', () => {
    const base = makeEvent({ completed: true, completedAt: '2026-08-01T00:00:00.000Z' });
    const next = applyPatch([base], 'e1', { completed: true, name: '改名' }, '2026-09-02T00:00:00.000Z');
    expect(next[0].completedAt).toBe('2026-08-01T00:00:00.000Z');
    expect(next[0].name).toBe('改名');
  });

  it('removeEvent 删除指定 id', () => {
    const list = [makeEvent({ id: 'a' }), makeEvent({ id: 'b' })];
    expect(removeEvent(list, 'a').map((e) => e.id)).toEqual(['b']);
  });

  it('sortEvents 未完成按截止日升序且排在已完成之前', () => {
    const list = [
      makeEvent({ id: 'done2', completed: true, completedAt: '2026-08-02T00:00:00.000Z', dueDate: '2026-01-01' }),
      makeEvent({ id: 'later', dueDate: '2026-12-01' }),
      makeEvent({ id: 'done1', completed: true, completedAt: '2026-09-01T00:00:00.000Z', dueDate: '2026-01-01' }),
      makeEvent({ id: 'sooner', dueDate: '2026-09-01' }),
      makeEvent({ id: 'overdue', dueDate: '2026-08-01' })
    ];
    expect(sortEvents(list).map((e) => e.id)).toEqual(['overdue', 'sooner', 'later', 'done1', 'done2']);
  });

  it('eventsOnDay 只返回当天事件', () => {
    const list = [makeEvent({ id: 'a', dueDate: '2026-09-02' }), makeEvent({ id: 'b', dueDate: '2026-09-03' })];
    expect(eventsOnDay(list, '2026-09-02').map((e) => e.id)).toEqual(['a']);
  });
});