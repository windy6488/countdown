import { useEffect, useState, type ChangeEvent, type MouseEvent } from 'react';
import type { EventItem } from '../types';
import { rangeInfoFor } from '../lib/countdown';
import { formatISODate, formatISODateTime } from '../lib/date';

interface EventRowProps {
  event: EventItem;
  today: string;
  categoryName?: string;
  onToggle(id: string): void;
  onEdit(event: EventItem): void;
  onDelete(event: EventItem): void;
}

export function EventRow({
  event,
  today,
  categoryName,
  onToggle,
  onEdit,
  onDelete
}: EventRowProps) {
  const [expanded, setExpanded] = useState(false);
  useEffect(() => {
    setExpanded(false);
  }, [event.id]);

  const info = rangeInfoFor(today, event.startDate, event.dueDate);
  const countClass = event.completed
    ? 'done'
    : info.kind === 'active'
      ? 'active'
      : info.state === 'dueToday'
        ? 'dueToday'
        : info.state === 'overdue'
          ? 'overdue'
          : 'upcoming';
  const stateClass = event.completed ? 'done' : countClass;
  const periodText = event.startDate
    ? `${formatISODate(event.startDate)} – ${formatISODate(event.dueDate)}`
    : formatISODate(event.dueDate);

  const stop = (e: MouseEvent) => e.stopPropagation();
  const handleToggle = (e: ChangeEvent<HTMLInputElement>) => {
    e.stopPropagation();
    onToggle(event.id);
  };
  const handleCardClick = () => {
    if (event.completed) {
      setExpanded((v) => !v);
    } else {
      onEdit(event);
    }
  };

  const renderCountdown = () => {
    if (info.kind === 'single') {
      if (info.state === 'dueToday') return '今天到期';
      if (info.state === 'overdue') return <>已过期 <b>{-info.days}</b> 天</>;
      return <>还剩 <b>{info.days}</b> 天</>;
    }
    if (info.kind === 'beforeStart') return <>还剩 <b>{info.days}</b> 天开始</>;
    if (info.kind === 'active') {
      if (info.days === 0) return '进行中 · 今天结束';
      return <>还剩 <b>{info.days}</b> 天结束</>;
    }
    return <>已结束 <b>{info.days}</b> 天</>;
  };

  const cardClass = [
    'event-card',
    `state-${stateClass}`,
    event.completed ? 'is-completed' : '',
    !event.completed && event.important ? 'is-important' : ''
  ]
    .filter(Boolean)
    .join(' ');

  return (
    <div className={cardClass}>
      <div className="event-card-main" onClick={handleCardClick}>
        <label className="check" onClick={stop}>
          <input type="checkbox" checked={event.completed} onChange={handleToggle} />
          <span className="checkmark" aria-hidden="true" />
        </label>
        <div className="event-text">
          <div className="event-name">{event.name}</div>
          <div className="event-meta">
            {periodText}
            {categoryName ? ` · ${categoryName}` : ''}
          </div>
        </div>
        {event.completed ? (
          <span className="badge badge-done">已完成</span>
        ) : (
          <span className={`countdown-text c-${countClass}`}>{renderCountdown()}</span>
        )}
        {event.completed && <span className={`chevron${expanded ? ' open' : ''}`} aria-hidden="true" />}
      </div>

      {event.completed && expanded && (
        <div className="event-detail" onClick={stop}>
          <p className="event-details">{event.details ? event.details : '（无内容）'}</p>
          <div className="detail-meta">
            <span>时间 {periodText}</span>
            {categoryName && <span>分类 {categoryName}</span>}
            {event.completedAt && <span>完成于 {formatISODateTime(event.completedAt)}</span>}
          </div>
          <div className="detail-actions">
            <button type="button" onClick={() => onEdit(event)}>
              编辑
            </button>
            <button type="button" className="danger" onClick={() => onDelete(event)}>
              删除
            </button>
          </div>
        </div>
      )}
    </div>
  );
}