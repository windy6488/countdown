import { describe, expect, it } from 'vitest';
import { countdownFor, rangeInfoFor } from './countdown';

describe('countdownFor 单日倒数', () => {
  it('区分过期/今天/未来', () => {
    expect(countdownFor('2026-09-02', '2026-08-31')).toEqual({ days: -2, state: 'overdue', label: '已过期 2 天' });
    expect(countdownFor('2026-09-02', '2026-09-02')).toEqual({ days: 0, state: 'dueToday', label: '今天到期' });
    expect(countdownFor('2026-09-02', '2026-09-05')).toEqual({ days: 3, state: 'upcoming', label: '还剩 3 天' });
  });
});

describe('rangeInfoFor 多日事件', () => {
  const today = '2026-09-06';
  it('无开始日期时沿用单日逻辑', () => {
    const info = rangeInfoFor(today, null, '2026-09-10');
    expect(info.kind).toBe('single');
    expect(info.days).toBe(4);
    expect(info.label).toBe('还剩 4 天');
  });

  it('未开始时数到开始日', () => {
    const info = rangeInfoFor(today, '2026-09-10', '2026-09-15');
    expect(info).toMatchObject({ kind: 'beforeStart', days: 4, state: 'upcoming', label: '还剩 4 天开始' });
  });

  it('进行中数到结束日', () => {
    const info = rangeInfoFor(today, '2026-09-04', '2026-09-09');
    expect(info).toMatchObject({ kind: 'active', days: 3, state: 'active', label: '还剩 3 天结束' });
  });

  it('进行中且今天结束', () => {
    const info = rangeInfoFor(today, '2026-09-02', '2026-09-06');
    expect(info).toMatchObject({ kind: 'active', days: 0, label: '进行中 · 今天结束' });
  });

  it('已结束未完成', () => {
    const info = rangeInfoFor(today, '2026-09-01', '2026-09-03');
    expect(info).toMatchObject({ kind: 'ended', days: 3, state: 'overdue', label: '已结束 3 天' });
  });

  it('跨月范围正确', () => {
    const info = rangeInfoFor(today, '2026-08-30', '2026-09-09');
    expect(info).toMatchObject({ kind: 'active', days: 3 });
  });
});