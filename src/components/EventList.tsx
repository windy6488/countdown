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
  onFilterChange(filter: CategoryFilter): void;
  onCompletedModeChange(mode: CompletedMode): void;
  onManageCategories(): void;
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
  onFilterChange,
  onCompletedModeChange,
  onManageCategories,
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

  if (events.length === 0) {
    return (
      <div className="empty-state">
        <p className="empty-title">还没有事件</p>
        <p className="empty-hint">点右下角 ＋ 新建第一个事件吧</p>
      </div>
    );
  }

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
        </div>
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
      </div>

      {visible.length === 0 ? (
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