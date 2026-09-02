import { useEffect, useRef, useState } from 'react';
import type { EventItem, TabKey } from './types';
import { useEvents } from './hooks/useEvents';
import { downloadBackup, readBackupFile } from './lib/backup';
import { todayISO } from './lib/date';
import { CalendarView } from './components/CalendarView';
import { ConfirmDialog, type ConfirmState } from './components/ConfirmDialog';
import {
  EventFormSheet,
  type EventFormState,
  type EventFormValue
} from './components/EventFormSheet';
import { EventList } from './components/EventList';

type ConfirmWithAction = ConfirmState & { onConfirm(): void };

function ListIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      width="22"
      height="22"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d="M9 6h11M9 12h11M9 18h11" />
      <circle cx="4.5" cy="6" r="1.2" />
      <circle cx="4.5" cy="12" r="1.2" />
      <circle cx="4.5" cy="18" r="1.2" />
    </svg>
  );
}

function CalendarIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      width="22"
      height="22"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <rect x="3" y="5" width="18" height="16" rx="2.5" />
      <path d="M3 10h18M8 3v4M16 3v4" />
    </svg>
  );
}

function PlusIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      width="26"
      height="26"
      fill="none"
      stroke="currentColor"
      strokeWidth="2.4"
      strokeLinecap="round"
      aria-hidden="true"
    >
      <path d="M12 5v14M5 12h14" />
    </svg>
  );
}

export default function App() {
  const {
    events,
    toast,
    showToast,
    addEvent,
    updateEvent,
    toggleCompleted,
    removeById,
    replaceAll
  } = useEvents();
  const [tab, setTab] = useState<TabKey>('list');
  const [today, setToday] = useState(todayISO);
  const [form, setForm] = useState<EventFormState | null>(null);
  const [confirm, setConfirm] = useState<ConfirmWithAction | null>(null);
  const fileRef = useRef<HTMLInputElement | null>(null);

  useEffect(() => {
    const timer = window.setInterval(() => setToday(todayISO()), 30_000);
    return () => window.clearInterval(timer);
  }, []);

  const handleExport = () => {
    downloadBackup(events);
    showToast('已导出备份文件');
  };

  const handleImportFile = async (file: File | undefined) => {
    if (!file) return;
    try {
      const backup = await readBackupFile(file);
      setConfirm({
        title: '导入备份',
        message: `导入将覆盖当前全部 ${events.length} 个事件，确定继续吗？`,
        confirmText: '覆盖导入',
        onConfirm: () => {
          replaceAll(backup.events);
          setConfirm(null);
        }
      });
    } catch (err) {
      showToast(err instanceof Error ? err.message : '导入失败', 'error');
    }
  };

  const requestDelete = (event: EventItem) => {
    setConfirm({
      title: '删除事件',
      message: `确定删除「${event.name}」吗？删除后无法恢复。`,
      onConfirm: () => {
        removeById(event.id);
        setConfirm(null);
        setForm(null);
      }
    });
  };

  const handleSubmit = (source: EventFormState, value: EventFormValue) => {
    const input = { name: value.name, details: value.details, dueDate: value.dueDate };
    if (source.kind === 'create') {
      addEvent(input);
    } else {
      updateEvent(source.event.id, { ...input, completed: value.completed });
    }
    setForm(null);
  };

  return (
    <div className="app">
      <header className="app-header">
        <div className="brand">倒数日·待办</div>
        <div className="header-actions">
          <button type="button" className="text-btn" onClick={handleExport}>
            导出
          </button>
          <button type="button" className="text-btn" onClick={() => fileRef.current?.click()}>
            导入
          </button>
          <input
            ref={fileRef}
            type="file"
            accept="application/json,.json"
            className="hidden-input"
            onChange={(e) => {
              const file = e.target.files?.[0];
              e.target.value = '';
              void handleImportFile(file);
            }}
          />
        </div>
      </header>

      <main className="app-main">
        {tab === 'list' ? (
          <EventList
            events={events}
            today={today}
            onEdit={(ev) => setForm({ kind: 'edit', event: ev })}
            onToggle={toggleCompleted}
            onDelete={requestDelete}
          />
        ) : (
          <CalendarView
            events={events}
            today={today}
            onEdit={(ev) => setForm({ kind: 'edit', event: ev })}
            onToggle={toggleCompleted}
            onDelete={requestDelete}
            onAddForDate={(iso) => setForm({ kind: 'create', defaultDueDate: iso })}
          />
        )}
      </main>

      <button
        type="button"
        className="fab"
        aria-label="新建事件"
        onClick={() => setForm({ kind: 'create', defaultDueDate: today })}
      >
        <PlusIcon />
      </button>

      <nav className="tab-bar">
        <button
          type="button"
          className={`tab-btn${tab === 'list' ? ' active' : ''}`}
          onClick={() => setTab('list')}
        >
          <ListIcon />
          <span>事件列表</span>
        </button>
        <button
          type="button"
          className={`tab-btn${tab === 'calendar' ? ' active' : ''}`}
          onClick={() => setTab('calendar')}
        >
          <CalendarIcon />
          <span>日历</span>
        </button>
      </nav>

      <EventFormSheet
        form={form}
        onClose={() => setForm(null)}
        onSubmit={handleSubmit}
        onRequestDelete={requestDelete}
      />
      <ConfirmDialog
        state={confirm}
        onCancel={() => setConfirm(null)}
        onConfirm={() => confirm?.onConfirm()}
      />
      {toast && (
        <div className={`toast toast-${toast.kind}`} role="status">
          {toast.text}
        </div>
      )}
    </div>
  );
}
