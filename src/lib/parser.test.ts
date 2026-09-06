import { describe, expect, it } from 'vitest';
import { parseBatchText } from './parser';

describe('parser 批量文字解析', () => {
  it('识别用户示例中的多行事件', () => {
    const text = '动车还有1天\n再看看一系统任务还有1天\n报道还有2天';
    const results = parseBatchText(text, '2026-09-06');
    expect(results).toHaveLength(3);
    expect(results.every((r) => r.ok)).toBe(true);
    expect(results[0]).toMatchObject({ name: '动车', days: 1, dueDate: '2026-09-07' });
    expect(results[1]).toMatchObject({ name: '再看看一系统任务', dueDate: '2026-09-07' });
    expect(results[2]).toMatchObject({ name: '报道', days: 2, dueDate: '2026-09-08' });
  });

  it('支持“还剩”与数字两边空格，并忽略空行', () => {
    const results = parseBatchText('交作业还剩 3 天\n\n  考试还有 5天  \n', '2026-09-06');
    expect(results).toHaveLength(2);
    expect(results[0]).toMatchObject({ name: '交作业', days: 3, dueDate: '2026-09-09' });
    expect(results[1]).toMatchObject({ name: '考试', days: 5, dueDate: '2026-09-11' });
  });

  it('名称里的冒号与结尾标点会被清理', () => {
    const results = parseBatchText('会议：还有2天\n取快递、还有1天', '2026-09-06');
    expect(results[0]).toMatchObject({ name: '会议', days: 2 });
    expect(results[1]).toMatchObject({ name: '取快递', days: 1 });
  });

  it('名称里含“还有”时按最后一个分割', () => {
    const results = parseBatchText('抢购（还有优惠）还有3天', '2026-09-06');
    expect(results[0]).toMatchObject({ name: '抢购（还有优惠）', days: 3 });
  });

  it('识别“已经 N 天”并换算为过去的日期', () => {
    const results = parseBatchText('入职已经3天\n军训已经1天', '2026-09-06');
    expect(results.every((r) => r.ok)).toBe(true);
    expect(results[0]).toMatchObject({ name: '入职', days: -3, dueDate: '2026-09-03' });
    expect(results[1]).toMatchObject({ name: '军训', days: -1, dueDate: '2026-09-05' });
  });

  it('无法识别的行会被标记并给出原因', () => {
    const results = parseBatchText('这是一条没有天数的文字\n还有2天', '2026-09-06');
    expect(results[0].ok).toBe(false);
    expect(results[1].ok).toBe(false);
    expect(results[1].reason).toContain('缺少事件名称');
  });

  it('名称超过 80 字会报错而不是导入', () => {
    const longName = '长'.repeat(81);
    const results = parseBatchText(`${longName}还有1天`, '2026-09-06');
    expect(results[0].ok).toBe(false);
    expect(results[0].reason).toContain('80');
  });
});