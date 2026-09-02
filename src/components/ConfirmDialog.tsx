import { type MouseEvent } from 'react';

export interface ConfirmState {
  title: string;
  message: string;
  confirmText?: string;
}

interface ConfirmDialogProps {
  state: ConfirmState | null;
  onCancel(): void;
  onConfirm(): void;
}

export function ConfirmDialog({ state, onCancel, onConfirm }: ConfirmDialogProps) {
  if (!state) return null;
  const stop = (e: MouseEvent) => e.stopPropagation();
  return (
    <div className="dialog-overlay" onClick={onCancel}>
      <div className="dialog-card" role="alertdialog" aria-modal="true" onClick={stop}>
        <h3>{state.title}</h3>
        <p>{state.message}</p>
        <div className="dialog-actions">
          <button type="button" className="btn btn-cancel" onClick={onCancel}>
            取消
          </button>
          <button type="button" className="btn btn-confirm" onClick={onConfirm}>
            {state.confirmText ?? '删除'}
          </button>
        </div>
      </div>
    </div>
  );
}
