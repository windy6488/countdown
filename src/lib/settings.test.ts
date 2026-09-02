import { describe, expect, it } from 'vitest';
import {
  DEFAULT_SETTINGS,
  readSettings,
  SETTINGS_STORAGE_KEY,
  writeSettings
} from './settings';
import type { StorageLike } from './storage';

function memoryStorage(initial: Record<string, string> = {}): StorageLike {
  const map = new Map(Object.entries(initial));
  return {
    getItem: (key) => map.get(key) ?? null,
    setItem: (key, value) => {
      map.set(key, value);
    }
  };
}

describe('settings 显示设置', () => {
  it('默认折叠已完成事件', () => {
    expect(DEFAULT_SETTINGS.completedMode).toBe('collapse');
    expect(readSettings(memoryStorage()).settings.completedMode).toBe('collapse');
  });

  it('可写入并读回 hidden', () => {
    const storage = memoryStorage();
    expect(writeSettings(storage, { completedMode: 'hidden' })).toBe(true);
    expect(readSettings(storage).settings.completedMode).toBe('hidden');
  });

  it('损坏数据回退默认并标记 ok=false，未知值归为 collapse', () => {
    const broken = memoryStorage({ [SETTINGS_STORAGE_KEY]: '{bad' });
    const res = readSettings(broken);
    expect(res.settings.completedMode).toBe('collapse');
    expect(res.ok).toBe(false);
    const unknown = memoryStorage({ [SETTINGS_STORAGE_KEY]: JSON.stringify({ completedMode: 'x' }) });
    expect(readSettings(unknown).settings.completedMode).toBe('collapse');
  });
});