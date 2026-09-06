import { useEffect, useMemo, useState } from 'react';
import type { Category, EventItem } from '../types';
import { formatISODate, monthGrid, parseISODate, WEEKDAY_LABELS } from '../lib/date';
import { eventsCoveringDay, sortEvents } from '../lib/events';
import { EventRow } from './EventRow';

interface CalendarViewProps {
  events: EventItem[];
  categories: Category[];
  today: string;
  onEdit(event: EventItem): void;
  onToggle(id: string): void;
  onDelete(event: EventItem): void;
  onAddForDate(iso: string): void;
  onSelectedDateChange(iso: string): void;
}

const PALETTE = ['#4c8dff', '#f08a3c', '#16a34a', '#8b5cf6', '#ec4899', '#06b6d4', '#d97706', '#64748b'];
const MAX_RANGE_BARS = 3;

function colorForEvent(event: EventItem, today: string): string {
  if (event.completed) return '#b9c0cf';
  if (event.dueDate < today) return '#e5484d';
  let hash = 0;
  for (let i = 0; i < event.id.length; i++) {
    hash = (hash * 31 + event.id.charCodeAt(i)) >>> 0;
  }
  return PALETTE[hash % PALETTE.length];
}

export function CalendarView({
  events,
  categories,
  today,
  onEdit,
  onToggle,
  onDelete,
  onAddForDate,
  onSelectedDateChange
}: CalendarViewProps) {
  const initial = parseISODate(today) ?? new Date();
  const [view, setView] = useState({ year: initial.getFullYear(), month: initial.getMonth() });
  const [selectedISO, setSelectedISO] = useState(today);

  const cells = useMemo(() => monthGrid(view.year, view.month, today), [view, today]);
  const categoryMap = useMemo(() => new Map(categories.map((c) => [c.id, c.name])), [categories]);
  const singleDayEvents = useMemo(() => events.filter((ev) => !ev.startDate), [events]);
  const byDay = useMemo(() => {
    const map = new Map<string, EventItem[]>();
    for (const ev of singleDayEvents) {
      const list = map.get(ev.dueDate);
      if (list) list.push(ev);
      else map.set(ev.dueDate, [ev]);
    }
    return map;
  }, [singleDayEvents]);
  const dayEvents = useMemo(
    () => sortEvents(eventsCoveringDay(events, selectedISO)),
    [events, selectedISO]
  );

  useEffect(() => {
    onSelectedDateChange(selectedISO);
  }, [selectedISO, onSelectedDateChange]);

  const rangeEventsOn = (iso: string): EventItem[] =>
    events.filter((ev) => ev.startDate !== null && ev.startDate <= iso && iso <= ev.dueDate);

  const goMonth = (delta: number) => {
    setView((v) => {
      const d = new Date(v.year, v.month + delta, 1);
      return { year: d.getFullYear(), month: d.getMonth() };
    });
  };
  const goToday = () => {
    const d = parseISODate(today) ?? new Date();
    setView({ year: d.getFullYear(), month: d.getMonth() });
    setSelectedISO(today);
  };

  return (
    <div className="calendar-view">
      <div className="calendar-card">
        <div className="calendar-header">
          <button type="button" className="nav-btn" onClick={() => goMonth(-1)} aria-label="上个月">
            ‹
          </button>
          <div className="month-label">
            {view.year}年{view.month + 1}月
          </div>
          <button type="button" className="nav-btn" onClick={() => goMonth(1)} aria-label="下个月">
            ›
          </button>
          <button type="button" className="today-link" onClick={goToday}>
            回到今天
          </button>
        </div>

        <div className="weekdays">
          {WEEKDAY_LABELS.map((label, index) => (
            <div key={label} className={index >= 5 ? 'weekend' : ''}>
              周{label}
            </div>
          ))}
        </div>

        <div className="calendar-grid">
          {cells.map((cell) => {
            const dayList = byDay.get(cell.iso) ?? [];
            const rangeList = rangeEventsOn(cell.iso);
            const isSelected = cell.iso === selectedISO;
            const classes = [
              'calendar-cell',
              cell.inMonth ? '' : 'muted',
              cell.isToday ? 'today' : '',
              isSelected ? 'selected' : ''
            ]
              .filter(Boolean)
              .join(' ');
            return (
              <button
                key={cell.iso}
                type="button"
                className={classes}
                onClick={() => setSelectedISO(cell.iso)}
              >
                <span className="cell-day">{cell.day}</span>
                {rangeList.length > 0 && (
                  <span className="range-bars">
                    {rangeList.slice(0, MAX_RANGE_BARS).map((ev) => (
                      <span
                        key={ev.id}
                        className="range-bar"
                        style={{ background: colorForEvent(ev, today) }}
                        aria-hidden="true"
                      />
                    ))}
                    {rangeList.length > MAX_RANGE_BARS && (
                      <span className="range-more">+{rangeList.length - MAX_RANGE_BARS}</span>
                    )}
                  </span>
                )}
                {dayList.length > 0 && (
                  <span className="markers">
                    {dayList.slice(0, 3).map((ev) => (
                      <span
                        key={ev.id}
                        className={`marker ${ev.completed ? 'done' : 'active'}`}
                        aria-hidden="true"
                      />
                    ))}
                    {dayList.length > 3 && <span className="marker-more">+{dayList.length - 3}</span>}
                  </span>
                )}
              </button>
            );
          })}
        </div>
      </div>

      <div className="agenda-section">
        <div className="agenda-title">
          {formatISODate(selectedISO)}
          {selectedISO === today && <span className="agenda-today-tag">今天</span>}
        </div>
        {dayEvents.length === 0 ? (
          <div className="agenda-empty">
            <p>这一天没有事件</p>
            <button type="button" className="add-day-btn" onClick={() => onAddForDate(selectedISO)}>
              ＋ 给这一天添加事件
            </button>
          </div>
        ) : (
          <div className="event-list">
            {dayEvents.map((ev) => (
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
      </div>
    </div>
  );
}