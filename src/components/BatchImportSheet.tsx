import { useMemo, useState, type MouseEvent } from 'react';
import type { EventInput } from '../lib/events';
import { parseBatchText } from '../lib/parser';
import { formatISODate } from '../lib/date';

interface BatchImportSheetProps {
  open: boolean;
  today: string;
  onClose(): void;
  onImport(inputs: EventInput[]): void;
}

export function BatchImportSheet({ open, today, onClose, onImport }: BatchImportSheetProps) {
  const [text, setText] = useState('');
  const results = useMemo(() => parseBatchText(text, today), [text, today]);

  if (!open) return null;

  const okItems = results.filter((r) => r.ok);
  const failItems = results.filter((r) => !r.ok);
  const stop = (e: MouseEvent) => e.stopPropagation();
  const handleImport = () => {
    const inputs: EventInput[] = okItems.map((item) => ({
      name: item.name as string,
      details: '',
      dueDate: item.dueDate as string,
      categoryId: null
    }));
    onImport(inputs);
    setText('');
    onClose();
  };

  return (
    <div className="sheet-overlay" onClick={onClose}>
      <div className="bottom-sheet" onClick={stop}>
        <div className="sheet-head">
          <h2>批量导入事件</h2>
          <button type="button" className="close-btn" onClick={onClose} aria-label="关闭">
            ×
          </button>
        </div>
        <div className="sheet-body">
          <p className="cat-hint">
            每行一个事件，支持格式：<b>事件名称还有 N 天</b>（也支持“还剩 N 天”）。例如：
          </p>
          <p className="batch-example">动车还有1天<br />报道还有2天</p>
          <textarea
            className="batch-textarea"
            value={text}
            onChange={(e) => setText(e.target.value)}
            placeholder={'动车还有1天\n再看看一系统任务还有1天\n报道还有2天'}
            rows={6}
          />
          {results.length > 0 && (
            <div className="batch-preview">
              {results.map((item, index) => (
                <div key={index} className={`batch-line ${item.ok ? 'ok' : 'fail'}`}>
                  {item.ok ? (
                    <span>
                      <span className="batch-name">{item.name}</span>
                      <span className="batch-detail">
                        还有 {item.days} 天 → {formatISODate(item.dueDate as string)}
                      </span>
                    </span>
                  ) : (
                    <span>
                      <span className="batch-raw">{item.raw}</span>
                      <span className="batch-detail">{item.reason}</span>
                    </span>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
        <div className="sheet-footer batch-footer">
          <p className="batch-count">
            识别成功 {okItems.length} 条{failItems.length > 0 ? `，无法识别 ${failItems.length} 条` : ''}
          </p>
          <button
            type="button"
            className="btn btn-primary"
            disabled={okItems.length === 0}
            onClick={handleImport}
          >
            导入 {okItems.length} 个事件
          </button>
        </div>
      </div>
    </div>
  );
}