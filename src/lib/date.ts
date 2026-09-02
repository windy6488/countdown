export function pad2(n: number): string {
  return n.toString().padStart(2, '0');
}

export function toISODate(d: Date): string {
  return `${d.getFullYear()}-${pad2(d.getMonth() + 1)}-${pad2(d.getDate())}`;
}

export function todayISO(): string {
  return toISODate(new Date());
}

export function parseISODate(iso: string): Date | null {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(iso)) return null;
  const [year, month, day] = iso.split('-').map(Number);
  const d = new Date(year, month - 1, day);
  if (d.getFullYear() !== year || d.getMonth() !== month - 1 || d.getDate() !== day) {
    return null;
  }
  return d;
}

export function isValidISODate(iso: string): boolean {
  return parseISODate(iso) !== null;
}

export function diffInDays(fromISO: string, toISO: string): number {
  const from = parseISODate(fromISO);
  const to = parseISODate(toISO);
  if (!from || !to) {
    throw new Error(`非法日期: ${fromISO} / ${toISO}`);
  }
  const utcDay = (d: Date) => Date.UTC(d.getFullYear(), d.getMonth(), d.getDate());
  return Math.round((utcDay(to) - utcDay(from)) / 86_400_000);
}

export function addDaysISO(iso: string, delta: number): string {
  const d = parseISODate(iso);
  if (!d) throw new Error(`非法日期: ${iso}`);
  d.setDate(d.getDate() + delta);
  return toISODate(d);
}

export function formatISODate(iso: string): string {
  const d = parseISODate(iso);
  if (!d) return iso;
  return `${d.getFullYear()}年${d.getMonth() + 1}月${d.getDate()}日`;
}

export function formatISODateTime(iso: string): string {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return iso;
  return `${d.getFullYear()}年${d.getMonth() + 1}月${d.getDate()}日 ${pad2(d.getHours())}:${pad2(d.getMinutes())}`;
}

export interface CalendarCell {
  iso: string;
  day: number;
  inMonth: boolean;
  isToday: boolean;
}

/** 生成以周一为一周开始的 6 周（42 格）月历格 */
export function monthGrid(year: number, month: number, today: string): CalendarCell[] {
  const first = new Date(year, month, 1);
  const mondayOffset = (first.getDay() + 6) % 7;
  const start = new Date(year, month, 1 - mondayOffset);
  const cells: CalendarCell[] = [];
  for (let i = 0; i < 42; i++) {
    const d = new Date(start.getFullYear(), start.getMonth(), start.getDate() + i);
    const iso = toISODate(d);
    cells.push({ iso, day: d.getDate(), inMonth: d.getMonth() === month, isToday: iso === today });
  }
  return cells;
}

export const WEEKDAY_LABELS = ['一', '二', '三', '四', '五', '六', '日'] as const;
