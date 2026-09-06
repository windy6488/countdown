import { describe, expect, it } from 'vitest';
import type { Category, EventItem } from '../types';
import { buildBackup, parseBackup } from './backup';

function makeEvent(overrides: Partial<EventItem> = {}): EventItem {
  return {
    id: 'e1',
    name: '生日',
    details: '',
    dueDate: '2026-10-01',
    startDate: null,
    important: false,
    categoryId: null,
    completed: false,
    completedAt: null,
    createdAt: '2026-01-01T00:00:00.000Z',
    updatedAt: '2026-01-01T00:00:00.000Z',
    ...overrides
  };
}

const cat: Category = { id: 'c1', name: '工作' };

describe('backup 备份文件', () => {
  it('buildBackup 输出 version 2 并携带分类', () => {
    const backup = buildBackup([makeEvent()], [cat]);
    expect(backup.version).toBe(2);
    expect(backup.events).toHaveLength(1);
    expect(backup.categories).toEqual([cat]);
  });

  it('parseBackup 能解析 version 2 文件', () => {
    const backup = buildBackup(
      [makeEvent({ categoryId: 'c1' }), makeEvent({ id: 'e2', completed: true, completedAt: '2026-08-01T00:00:00.000Z' })],
      [cat]
    );
    const parsed = parseBackup(JSON.stringify(backup));
    expect(parsed.version).toBe(2);
    expect(parsed.events).toHaveLength(2);
    expect(parsed.categories).toEqual([cat]);
  });

  it('parseBackup 兼容旧 version 1 文件（无分类字段）', () => {
    const legacyEvent = makeEvent() as unknown as Record<string, unknown>;
    delete legacyEvent.categoryId;
    delete legacyEvent.startDate;
    delete legacyEvent.important;
    const text = JSON.stringify({ version: 1, exportedAt: '2026-01-01T00:00:00.000Z', events: [legacyEvent] });
    const parsed = parseBackup(text);
    expect(parsed.version).toBe(1);
    expect(parsed.categories).toEqual([]);
    expect(parsed.events[0].categoryId).toBeNull();
    expect(parsed.events[0].startDate).toBeNull();
    expect(parsed.events[0].important).toBe(false);
  });

  it('parseBackup 拒绝非 JSON / 错误版本 / 非法数据', () => {
    expect(() => parseBackup('not json')).toThrow('不是有效的 JSON');
    expect(() => parseBackup(JSON.stringify({ version: 3, events: [] }))).toThrow('版本不受支持');
    expect(() => parseBackup(JSON.stringify({ version: 1, events: [{ id: 'x' }] }))).toThrow('第 1 条事件数据无效');
    expect(() =>
      parseBackup(JSON.stringify({ version: 2, events: [], categories: [{ id: 'x' }] }))
    ).toThrow('第 1 个分类数据无效');
    expect(() => parseBackup(JSON.stringify({ version: 2, events: [] }))).toThrow('缺少分类数据');
  });
});