import { describe, expect, it } from 'vitest';
import {
  addDaysISO,
  diffInDays,
  formatISODate,
  isValidISODate,
  monthGrid,
  parseISODate,
  toISODate
} from './date';
import { countdownFor } from './countdown';

describe('date 工具', () => {
  it('toISODate 输出本地 YYYY-MM-DD', () => {
    expect(toISODate(new Date(2026, 0, 5))).toBe('2026-01-05');
    expect(toISODate(new Date(2026, 11, 31))).toBe('2026-12-31');
  });

  it('isValidISODate 拒绝非法日期', () => {
    expect(isValidISODate('2026-02-28')).toBe(true);
    expect(isValidISODate('2026-02-29')).toBe(false); // 非闰年
    expect(isValidISODate('2024-02-29')).toBe(true); // 闰年
    expect(isValidISODate('2026-13-01')).toBe(false);
    expect(isValidISODate('2026-1-1')).toBe(false);
    expect(isValidISODate('abc')).toBe(false);
  });

  it('parseISODate 只接受真实存在的日期', () => {
    const d = parseISODate('2026-09-02');
    expect(d).not.toBeNull();
    expect(toISODate(d!)).toBe('2026-09-02');
    expect(parseISODate('2026-04-31')).toBeNull();
  });

  it('diffInDays 正确处理同天/相邻/跨年/跨闰年', () => {
    expect(diffInDays('2026-09-02', '2026-09-02')).toBe(0);
    expect(diffInDays('2026-09-02', '2026-09-03')).toBe(1);
    expect(diffInDays('2026-09-02', '2026-09-01')).toBe(-1);
    expect(diffInDays('2026-12-31', '2027-01-01')).toBe(1);
    expect(diffInDays('2024-02-28', '2024-03-01')).toBe(2);
    expect(diffInDays('2026-01-01', '2027-01-01')).toBe(365);
  });

  it('addDaysISO 跨越月份与年份', () => {
    expect(addDaysISO('2026-09-30', 2)).toBe('2026-10-02');
    expect(addDaysISO('2026-12-31', 1)).toBe('2027-01-01');
    expect(addDaysISO('2026-09-02', -3)).toBe('2026-08-30');
  });

  it('monthGrid 以周一开头共 42 格并标记今天', () => {
    const cells = monthGrid(2026, 8, '2026-09-02');
    expect(cells).toHaveLength(42);
    expect(cells[0].iso).toBe('2026-08-31'); // 2026-09-01 是周二
    expect(cells.find((c) => c.isToday)?.iso).toBe('2026-09-02');
    expect(cells.filter((c) => c.inMonth).length).toBe(30);
  });

  it('formatISODate 输出中文日期', () => {
    expect(formatISODate('2026-09-02')).toBe('2026年9月2日');
  });
});

describe('countdown 文案', () => {
  it('区分过期/今天/未来', () => {
    expect(countdownFor('2026-09-02', '2026-08-31')).toEqual({
      days: -2,
      state: 'overdue',
      label: '已过期 2 天'
    });
    expect(countdownFor('2026-09-02', '2026-09-02')).toEqual({
      days: 0,
      state: 'dueToday',
      label: '今天到期'
    });
    expect(countdownFor('2026-09-02', '2026-09-05')).toEqual({
      days: 3,
      state: 'upcoming',
      label: '还剩 3 天'
    });
  });
});
