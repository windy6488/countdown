import { addDaysISO } from './date';

export interface ParsedImportLine {
  raw: string;
  ok: boolean;
  name?: string;
  days?: number;
  dueDate?: string;
  reason?: string;
}

const NAME_MAX = 80;

function parseLine(raw: string, today: string): ParsedImportLine {
  // 贪婪匹配：名称里即使含有“还有/已经”也尽量归到事件名；允许名称为空以便给出“缺少名称”提示
  const match = raw.match(/^([\s\S]*)(还有|还剩|已经)\s*(\d+)\s*天$/);
  if (!match) {
    return { raw, ok: false, reason: '无法识别（支持：事件名称还有 N 天 / 还剩 N 天 / 已经 N 天）' };
  }
  const phrase = match[2];
  const amount = Number(match[3]);
  // “已经 N 天”表示这件事已经过去 N 天，截止日期按 今天 - N 天 计算
  const days = phrase === '已经' ? -amount : amount;
  const name = match[1]
    .replace(/[\s:：,，。、;；-]+$/u, '')
    .trim();
  if (!name) {
    return { raw, ok: false, reason: '缺少事件名称' };
  }
  if (name.length > NAME_MAX) {
    return { raw, ok: false, reason: `事件名称超过 ${NAME_MAX} 个字` };
  }
  return { raw, ok: true, name, days, dueDate: addDaysISO(today, days) };
}

/** 按行解析批量导入文字；空行会被忽略 */
export function parseBatchText(text: string, today: string): ParsedImportLine[] {
  const results: ParsedImportLine[] = [];
  for (const line of text.split(/\r?\n/)) {
    const raw = line.trim();
    if (!raw) continue;
    results.push(parseLine(raw, today));
  }
  return results;
}