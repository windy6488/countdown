import { useMemo } from 'react';
import type { EventItem } from '../types';
import { sortEvents } from '../lib/events';
import { EventRow } from './EventRow';

interface EventListProps {
  events: EventItem[];
  today: string;
  onEdit(event: EventItem): void;
  onToggle(id: string): void;
  onDelete(event: EventItem): void;
}

export function EventList({ events, today, onEdit, onToggle, onDelete }: EventListProps) {
  const sorted = useMemo(() => sortEvents(events), [events]);

  if (events.length === 0) {
    return (
      <div className="empty-state">
        <p className="empty-title">还没有事件</p>
        <p className="empty-hint">点右下角 ＋ 新建第一个事件吧</p>
      </div>
    );
  }

  return (
    <div className="event-list">
      {sorted.map((ev) => (
        <EventRow
          key={ev.id}
          event={ev}
          today={today}
          onToggle={onToggle}
          onEdit={onEdit}
          onDelete={onDelete}
        />
      ))}
    </div>
  );
}
