import type { BackupFile, Category, EventItem } from '../types';
import { parseEvent } from './events';
import { normalizeCategory } from './categories';
import { todayISO } from './date';

export function buildBackup(events: EventItem[], categories: Category[]): BackupFile {
  return {
    version: 2,
    exportedAt: new Date().toISOString(),
    events,
    categories
  };
}

export function parseBackup(text: string): BackupFile {
  let data: unknown;
  try {
    data = JSON.parse(text);
  } catch {
    throw new Error('文件不是有效的 JSON');
  }
  if (typeof data !== 'object' || data === null) {
    throw new Error('备份文件格式不正确');
  }
  const o = data as Record<string, unknown>;
  if (o.version !== 1 && o.version !== 2) {
    throw new Error('备份文件版本不受支持');
  }
  if (!Array.isArray(o.events)) {
    throw new Error('备份文件缺少事件数据');
  }
  const events: EventItem[] = [];
  o.events.forEach((item, index) => {
    const normalized = parseEvent(item);
    if (!normalized) throw new Error(`第 ${index + 1} 条事件数据无效`);
    events.push(normalized);
  });
  let categories: Category[] = [];
  if (o.version === 2) {
    if (!Array.isArray(o.categories)) {
      throw new Error('备份文件缺少分类数据');
    }
    o.categories.forEach((item, index) => {
      const normalized = normalizeCategory(item);
      if (!normalized) throw new Error(`第 ${index + 1} 个分类数据无效`);
      categories.push(normalized);
    });
  }
  return {
    version: o.version,
    exportedAt: typeof o.exportedAt === 'string' ? o.exportedAt : new Date().toISOString(),
    events,
    categories
  };
}

export function backupFileName(): string {
  return `countdown-backup-${todayISO()}.json`;
}

export async function readBackupFile(file: File): Promise<BackupFile> {
  return parseBackup(await file.text());
}

export function downloadBackup(events: EventItem[], categories: Category[]): void {
  const backup = buildBackup(events, categories);
  const blob = new Blob([JSON.stringify(backup, null, 2)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = backupFileName();
  document.body.appendChild(link);
  link.click();
  link.remove();
  window.setTimeout(() => URL.revokeObjectURL(url), 1000);
}