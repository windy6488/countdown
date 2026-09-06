import { diffInDays } from './date';

export type DueState = 'overdue' | 'dueToday' | 'upcoming';

export interface CountdownInfo {
  days: number;
  state: DueState;
  label: string;
}

export function countdownFor(todayISO: string, dueDate: string): CountdownInfo {
  const days = diffInDays(todayISO, dueDate);
  if (days < 0) {
    return { days, state: 'overdue', label: `已过期 ${-days} 天` };
  }
  if (days === 0) {
    return { days, state: 'dueToday', label: '今天到期' };
  }
  return { days, state: 'upcoming', label: `还剩 ${days} 天` };
}

export type RangeKind = 'single' | 'beforeStart' | 'active' | 'ended';

export interface RangeInfo {
  kind: RangeKind;
  days: number;
  state: DueState | 'active';
  label: string;
}

/**
 * 多日事件的状态：未开始数到开始日，进行中数到结束日，结束后按已结束计。
 * 单日事件（无开始日期）沿用原有语义。
 */
export function rangeInfoFor(todayISO: string, startDate: string | null, dueDate: string): RangeInfo {
  if (!startDate) {
    const info = countdownFor(todayISO, dueDate);
    return { kind: 'single', days: info.days, state: info.state, label: info.label };
  }
  const daysToStart = diffInDays(todayISO, startDate);
  const daysToEnd = diffInDays(todayISO, dueDate);
  if (daysToStart > 0) {
    return { kind: 'beforeStart', days: daysToStart, state: 'upcoming', label: `还剩 ${daysToStart} 天开始` };
  }
  if (daysToEnd > 0) {
    return { kind: 'active', days: daysToEnd, state: 'active', label: `还剩 ${daysToEnd} 天结束` };
  }
  if (daysToEnd === 0) {
    return { kind: 'active', days: 0, state: 'active', label: '进行中 · 今天结束' };
  }
  const passed = -daysToEnd;
  return { kind: 'ended', days: passed, state: 'overdue', label: `已结束 ${passed} 天` };
}