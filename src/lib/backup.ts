import type { BackupFile, EventItem } from '../types';
import { isValidEventItem } from './events';
import { todayISO } from './date';

export function buildBackup(events: EventItem[]): BackupFile {
  return {
    version: 1,
    exportedAt: new Date().toISOString(),
    events
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
  if (o.version !== 1) {
    throw new Error('备份文件版本不受支持');
  }
  if (!Array.isArray(o.events)) {
    throw new Error('备份文件缺少事件数据');
  }
  o.events.forEach((item, index) => {
    if (!isValidEventItem(item)) {
      throw new Error(`第 ${index + 1} 条事件数据无效`);
    }
  });
  return {
    version: 1,
    exportedAt: typeof o.exportedAt === 'string' ? o.exportedAt : new Date().toISOString(),
    events: o.events as EventItem[]
  };
}

export function backupFileName(): string {
  return `countdown-backup-${todayISO()}.json`;
}

export async function readBackupFile(file: File): Promise<BackupFile> {
  return parseBackup(await file.text());
}

export function downloadBackup(events: EventItem[]): void {
  const backup = buildBackup(events);
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
