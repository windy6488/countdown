import { describe, expect, it } from 'vitest';
import type { EventItem } from '../types';
import { buildBackup, parseBackup } from './backup';

function makeEvent(overrides: Partial<EventItem> = {}): EventItem {
  return {
    id: 'e1',
    name: '生日',
    details: '',
    dueDate: '2026-10-01',
    completed: false,
    completedAt: null,
    createdAt: '2026-01-01T00:00:00.000Z',
    updatedAt: '2026-01-01T00:00:00.000Z',
    ...overrides
  };
}

describe('backup 备份文件', () => {
  it('buildBackup 输出 version 1', () => {
    const backup = buildBackup([makeEvent()]);
    expect(backup.version).toBe(1);
    expect(backup.events).toHaveLength(1);
  });

  it('parseBackup 能解析自己导出的文件', () => {
    const backup = buildBackup([makeEvent(), makeEvent({ id: 'e2', completed: true, completedAt: '2026-08-01T00:00:00.000Z' })]);
    const parsed = parseBackup(JSON.stringify(backup));
    expect(parsed.events).toHaveLength(2);
    expect(parsed.version).toBe(1);
  });

  it('parseBackup 拒绝非 JSON / 错误版本 / 非法事件且不静默丢弃', () => {
    expect(() => parseBackup('not json')).toThrow('不是有效的 JSON');
    expect(() => parseBackup(JSON.stringify({ version: 2, events: [] }))).toThrow('版本不受支持');
    expect(() => parseBackup(JSON.stringify({ version: 1, events: [{ id: 'x' }] }))).toThrow('第 1 条事件数据无效');
  });
});
