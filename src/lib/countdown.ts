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
