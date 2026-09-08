import { useMemo } from 'react';
import type { Category, CategoryFilter, CompletedMode, EventItem } from '../types';
import { sortEvents } from '../lib/events';
import { EventRow } from './EventRow';

interface EventListProps {
  events: EventItem[];
  categories: Category[];
  today: string;
  filter: CategoryFilter;
  completedMode: CompletedMode;
  selectMode: boolean;
  selectedIds: Set<string>;
  onFilterChange(filter: CategoryFilter): void;
  onCompletedModeChange(mode: CompletedMode): void;
  onManageCategories(): void;
  onBatchImport(): void;
  onEnterSelectMode(): void;
  onExitSelectMode(): void;
  onToggleSelect(id: string): void;
  onSetSelected(ids: string[]): void;
  onRequestDeleteSelected(ids: string[]): void;
  onEdit(event: EventItem): void;
  onToggle(id: string): void;
  onDelete(event: EventItem): void;
}

export function EventList({
  events,
  categories,
  today,
  filter,
  completedMode,
  selectMode,
  selectedIds,
  onFilterChange,
  onCompletedModeChange,
  onManageCategories,
  onBatchImport,
  onEnterSelectMode,
  onExitSelectMode,
  onToggleSelect,
  onSetSelected,
  onRequestDeleteSelected,
  onEdit,
  onToggle,
  onDelete
}: EventListProps) {
  const categoryMap = useMemo(() => new Map(categories.map((c) => [c.id, c.name])), [categories]);
  const visible = useMemo(() => {
    let list = events;
    if (completedMode === 'hidden') list = list.filter((ev) => !ev.completed);
    list = list.filter((ev) => {
      if (filter.kind === 'all') return true;
      if (filter.kind === 'none') return ev.categoryId === null;
      return ev.categoryId === filter.id;
    });
    return sortEvents(list);
  }, [events, completedMode, filter]);
  const hasUncategorized = useMemo(() => events.some((ev) => ev.categoryId === null), [events]);

  const handleSelectAll = () => {
    const visibleIds = visible.map((ev) => ev.id);
    if (visibleIds.length > 0 && visibleIds.every((id) => selectedIds.has(id))) {
      onSetSelected(visibleIds.filter((id) => !selectedIds.has(id)));
    } else {
      onSetSelected([...new Set([...selectedIds, ...visibleIds])]);
    }
  };

  return (
    <>
      <div className="list-controls">
        <div className="filter-scroll">
          <button
            type="button"
            className={`chip-btn${filter.kind === 'all' ? ' active' : ''}`}
            onClick={() => onFilterChange({ kind: 'all' })}
          >
            全部
          </button>
          {hasUncategorized && (
            <button
              type="button"
              className={`chip-btn${filter.kind === 'none' ? ' active' : ''}`}
              onClick={() => onFilterChange({ kind: 'none' })}
            >
              未分类
            </button>
          )}
          {categories.map((cat) => (
            <button
              key={cat.id}
              type="button"
              className={`chip-btn${filter.kind === 'category' && filter.id === cat.id ? ' active' : ''}`}
              onClick={() => onFilterChange({ kind: 'category', id: cat.id })}
            >
              {cat.name}
            </button>
          ))}
          <button type="button" className="chip-btn chip-manage" onClick={onManageCategories}>
            ＋ 分类
          </button>
          <button type="button" className="chip-btn chip-manage" onClick={onBatchImport}>
            批量导入
          </button>
          {!selectMode && (
            <button type="button" className="chip-btn chip-manage chip-danger" onClick={onEnterSelectMode}>
              批量删除
            </button>
          )}
        </div>
        {!selectMode ? (
          <div className="view-options">
            <span className="view-label">已完成事件</span>
            <div className="segmented">
              <button
                type="button"
                className={completedMode === 'collapse' ? 'active' : ''}
                onClick={() => onCompletedModeChange('collapse')}
              >
                折叠
              </button>
              <button
                type="button"
                className={completedMode === 'hidden' ? 'active' : ''}
                onClick={() => onCompletedModeChange('hidden')}
              >
                不显示
              </button>
            </div>
          </div>
        ) : (
          <div className="selection-bar">
            <span className="selection-count">
              已选 {selectedIds.size} / {visible.length}
            </span>
            <div className="selection-actions">
              <button type="button" className="sel-btn" onClick={handleSelectAll}>
                {visible.length > 0 && visible.every((ev) => selectedIds.has(ev.id))
                  ? '取消全选'
                  : '全选'}
              </button>
              <button
                type="button"
                className="sel-btn sel-danger"
                disabled={selectedIds.size === 0}
                onClick={() => onRequestDeleteSelected([...selectedIds])}
              >
                删除
              </button>
              <button type="button" className="sel-btn" onClick={onExitSelectMode}>
                退出
              </button>
            </div>
          </div>
        )}
      </div>

      {events.length === 0 ? (
        <div className="empty-state">
          <p className="empty-title">还没有事件</p>
          <p className="empty-hint">点右下角 ＋ 新建，或点上方“批量导入”粘贴多行文字</p>
        </div>
      ) : visible.length === 0 ? (
        <div className="empty-state">
          <p className="empty-title">没有符合条件的事件</p>
          <p className="empty-hint">试试切换分类筛选或已完成事件设置</p>
        </div>
      ) : (
        <div className="event-list">
          {visible.map((ev) => (
            <EventRow
              key={ev.id}
              event={ev}
              today={today}
              categoryName={ev.categoryId ? categoryMap.get(ev.categoryId) : undefined}
              selectMode={selectMode}
              selected={selectedIds.has(ev.id)}
              onToggleSelect={onToggleSelect}
              onToggle={onToggle}
              onEdit={onEdit}
              onDelete={onDelete}
            />
          ))}
        </div>
      )}
    </>
  );
}