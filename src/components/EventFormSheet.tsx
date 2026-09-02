import { useEffect, useState, type MouseEvent } from 'react';
import type { EventItem } from '../types';
import { isValidISODate } from '../lib/date';

export type EventFormState =
  | { kind: 'create'; defaultDueDate?: string }
  | { kind: 'edit'; event: EventItem };

export interface EventFormValue {
  name: string;
  details: string;
  dueDate: string;
  completed: boolean;
}

interface EventFormSheetProps {
  form: EventFormState | null;
  onClose(): void;
  onSubmit(form: EventFormState, value: EventFormValue): void;
  onRequestDelete(event: EventItem): void;
}

export function EventFormSheet({ form, onClose, onSubmit, onRequestDelete }: EventFormSheetProps) {
  const [name, setName] = useState('');
  const [details, setDetails] = useState('');
  const [dueDate, setDueDate] = useState('');
  const [completed, setCompleted] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!form) return;
    if (form.kind === 'edit') {
      setName(form.event.name);
      setDetails(form.event.details);
      setDueDate(form.event.dueDate);
      setCompleted(form.event.completed);
    } else {
      setName('');
      setDetails('');
      setDueDate(form.defaultDueDate ?? '');
      setCompleted(false);
    }
    setError('');
  }, [form]);

  if (!form) return null;

  const stop = (e: MouseEvent) => e.stopPropagation();
  const handleSave = () => {
    const trimmed = name.trim();
    if (!trimmed) {
      setError('请填写事件名称');
      return;
    }
    if (!isValidISODate(dueDate)) {
      setError('请选择有效的截止日期');
      return;
    }
    onSubmit(form, { name: trimmed, details: details.trim(), dueDate, completed });
  };

  return (
    <div className="sheet-overlay" onClick={onClose}>
      <div className="bottom-sheet" onClick={stop}>
        <div className="sheet-head">
          <h2>{form.kind === 'edit' ? '编辑事件' : '新建事件'}</h2>
          <button type="button" className="close-btn" onClick={onClose} aria-label="关闭">
            ×
          </button>
        </div>

        <div className="sheet-body">
          <label className="field">
            <span>名称 *</span>
            <input
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="例如：提交项目报告"
              maxLength={80}
              autoFocus
            />
          </label>
          <label className="field">
            <span>具体内容</span>
            <textarea
              value={details}
              onChange={(e) => setDetails(e.target.value)}
              placeholder="补充说明（可选）"
              maxLength={2000}
              rows={3}
            />
          </label>
          <label className="field">
            <span>截止日期 *</span>
            <input type="date" value={dueDate} onChange={(e) => setDueDate(e.target.value)} />
          </label>
          {form.kind === 'edit' && (
            <label className="checkbox-row">
              <input
                type="checkbox"
                checked={completed}
                onChange={(e) => setCompleted(e.target.checked)}
              />
              <span>标记为已完成</span>
            </label>
          )}
          {error && <p className="field-error">{error}</p>}
        </div>

        <div className="sheet-footer">
          {form.kind === 'edit' && (
            <button
              type="button"
              className="btn btn-danger-outline"
              onClick={() => onRequestDelete(form.event)}
            >
              删除
            </button>
          )}
          <button type="button" className="btn btn-primary" onClick={handleSave}>
            保存
          </button>
        </div>
      </div>
    </div>
  );
}
