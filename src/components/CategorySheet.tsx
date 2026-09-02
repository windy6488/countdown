import { useState, type MouseEvent } from 'react';
import type { Category } from '../types';

interface CategorySheetProps {
  open: boolean;
  categories: Category[];
  onAdd(rawName: string): { ok: boolean; error?: string };
  onDelete(category: Category): void;
  onClose(): void;
}

export function CategorySheet({
  open,
  categories,
  onAdd,
  onDelete,
  onClose
}: CategorySheetProps) {
  const [name, setName] = useState('');
  const [error, setError] = useState('');

  if (!open) return null;

  const stop = (e: MouseEvent) => e.stopPropagation();
  const handleAdd = () => {
    const result = onAdd(name);
    if (!result.ok) {
      setError(result.error ?? '添加失败');
      return;
    }
    setName('');
    setError('');
  };

  return (
    <div className="sheet-overlay" onClick={onClose}>
      <div className="bottom-sheet" onClick={stop}>
        <div className="sheet-head">
          <h2>分类管理</h2>
          <button type="button" className="close-btn" onClick={onClose} aria-label="关闭">
            ×
          </button>
        </div>
        <div className="sheet-body">
          <p className="cat-hint">分类用于给事件分组；删除分类后，该分类下的事件会变为“未分类”。</p>
          {categories.length === 0 ? (
            <p className="cat-empty">还没有分类，先在下面添加一个吧</p>
          ) : (
            <ul className="cat-list">
              {categories.map((cat) => (
                <li key={cat.id} className="cat-row">
                  <span className="cat-name">{cat.name}</span>
                  <button type="button" className="cat-del-btn" onClick={() => onDelete(cat)}>
                    删除
                  </button>
                </li>
              ))}
            </ul>
          )}
          <div className="cat-add">
            <input
              value={name}
              maxLength={12}
              placeholder="新分类名称"
              onChange={(e) => setName(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') handleAdd();
              }}
            />
            <button type="button" className="btn btn-primary cat-add-btn" onClick={handleAdd}>
              添加
            </button>
          </div>
          {error && <p className="field-error">{error}</p>}
        </div>
      </div>
    </div>
  );
}