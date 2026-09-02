export interface EventItem {
  id: string;
  name: string;
  details: string;
  dueDate: string; // YYYY-MM-DD（本地日期）
  completed: boolean;
  completedAt: string | null; // ISO 字符串
  createdAt: string; // ISO 字符串
  updatedAt: string; // ISO 字符串
}

export interface BackupFile {
  version: 1;
  exportedAt: string;
  events: EventItem[];
}

export type TabKey = 'list' | 'calendar';

export interface ToastInfo {
  kind: 'success' | 'error';
  text: string;
}
