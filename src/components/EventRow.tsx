import { useEffect, useState, type ChangeEvent, type MouseEvent } from 'react';
import type { EventItem } from '../types';
import { countdownFor } from '../lib/countdown';
import { formatISODate, formatISODateTime } from '../lib/date';

interface EventRowProps {
  event: EventItem;
  today: string;
  onToggle(id: string): void;
  onEdit(event: EventItem): void;
  onDelete(event: EventItem): void;
}

export function EventRow({ event, today, onToggle, onEdit, onDelete }: EventRowProps) {
  const [expanded, setExpanded] = useState(false);
  useEffect(() => {
    setExpanded(false);
  }, [event.id]);

  const info = countdownFor(today, event.dueDate);
  const stateClass = event.completed ? 'done' : info.state;

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

  return (
    <div className={`event-card state-${stateClass}${event.completed ? ' is-completed' : ''}`}>
      <div className="event-card-main" onClick={handleCardClick}>
        <label className="check" onClick={stop}>
          <input type="checkbox" checked={event.completed} onChange={handleToggle} />
          <span className="checkmark" aria-hidden="true" />
        </label>
        <div className="event-text">
          <div className="event-name">{event.name}</div>
          <div className="event-meta">{formatISODate(event.dueDate)}</div>
        </div>
        <span className={`badge badge-${stateClass}`}>{event.completed ? '已完成' : info.label}</span>
        {event.completed && <span className={`chevron${expanded ? ' open' : ''}`} aria-hidden="true" />}
      </div>

      {event.completed && expanded && (
        <div className="event-detail" onClick={stop}>
          <p className="event-details">{event.details ? event.details : '（无内容）'}</p>
          <div className="detail-meta">
            <span>截止 {formatISODate(event.dueDate)}</span>
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
