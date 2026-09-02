export interface EventItem {
  id: string;
  name: string;
  details: string;
  dueDate: string; // YYYY-MM-DD（本地日期）
  categoryId: string | null; // null 表示未分类
  completed: boolean;
  completedAt: string | null; // ISO 字符串
  createdAt: string; // ISO 字符串
  updatedAt: string; // ISO 字符串
}

export interface Category {
  id: string;
  name: string;
}

export interface BackupFile {
  version: 1 | 2;
  exportedAt: string;
  events: EventItem[];
  categories: Category[];
}

export type TabKey = 'list' | 'calendar';

export type CompletedMode = 'collapse' | 'hidden';

export interface AppSettings {
  completedMode: CompletedMode;
}

export type CategoryFilter =
  | { kind: 'all' }
  | { kind: 'none' }
  | { kind: 'category'; id: string };

export interface ToastInfo {
  kind: 'success' | 'error';
  text: string;
}