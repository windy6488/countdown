import { useEffect, useRef, useState } from 'react';
import type { CategoryFilter, EventItem, TabKey } from './types';
import { useAppData } from './hooks/useAppData';
import { downloadBackup, readBackupFile } from './lib/backup';
import { todayISO } from './lib/date';
import { CalendarView } from './components/CalendarView';
import { BatchImportSheet } from './components/BatchImportSheet';
import { CategorySheet } from './components/CategorySheet';
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
    categories,
    settings,
    toast,
    showToast,
    addEvent,
    addMany,
    updateEvent,
    toggleCompleted,
    removeById,
    addCategory,
    removeCategory,
    setCompletedMode,
    importData
  } = useAppData();
  const [tab, setTab] = useState<TabKey>('list');
  const [today, setToday] = useState(todayISO);
  const [form, setForm] = useState<EventFormState | null>(null);
  const [confirm, setConfirm] = useState<ConfirmWithAction | null>(null);
  const [categorySheetOpen, setCategorySheetOpen] = useState(false);
  const [batchImportOpen, setBatchImportOpen] = useState(false);
  const [filter, setFilter] = useState<CategoryFilter>({ kind: 'all' });
  const [calendarDate, setCalendarDate] = useState(today);
  const fileRef = useRef<HTMLInputElement | null>(null);

  // 手机返回键：打开弹层时推入一条历史记录，返回键先关最上层弹层而不是关闭网页
  const overlayRef = useRef({ form: false, confirm: false, category: false, batch: false });
  overlayRef.current = {
    form: form !== null,
    confirm: confirm !== null,
    category: categorySheetOpen,
    batch: batchImportOpen
  };
  const historyPushedRef = useRef(false);
  const anyOverlayOpen = form !== null || confirm !== null || categorySheetOpen || batchImportOpen;

  const closeTopmostOverlay = () => {
    const flags = overlayRef.current;
    if (flags.confirm) setConfirm(null);
    else if (flags.form) setForm(null);
    else if (flags.category) setCategorySheetOpen(false);
    else if (flags.batch) setBatchImportOpen(false);
  };

  useEffect(() => {
    if (anyOverlayOpen && !historyPushedRef.current) {
      historyPushedRef.current = true;
      window.history.pushState({ overlay: true }, '');
    }
  }, [anyOverlayOpen]);

  useEffect(() => {
    if (!anyOverlayOpen) return;
    const onPopState = () => {
      const flags = overlayRef.current;
      let remainsOpen = false;
      if (flags.confirm) remainsOpen = flags.form || flags.category || flags.batch;
      else if (flags.form) remainsOpen = flags.category || flags.batch;
      else if (flags.category) remainsOpen = flags.batch;
      closeTopmostOverlay();
      historyPushedRef.current = false;
      if (remainsOpen) {
        historyPushedRef.current = true;
        window.history.pushState({ overlay: true }, '');
      }
    };
    window.addEventListener('popstate', onPopState);
    return () => window.removeEventListener('popstate', onPopState);
  }, [anyOverlayOpen]);

  useEffect(() => {
    const timer = window.setInterval(() => setToday(todayISO()), 30_000);
    return () => window.clearInterval(timer);
  }, []);

  const handleExport = () => {
    downloadBackup(events, categories);
    showToast('已导出备份文件');
  };

  const handleImportFile = async (file: File | undefined) => {
    if (!file) return;
    try {
      const backup = await readBackupFile(file);
      setConfirm({
        title: '导入备份',
        message: `导入将覆盖当前全部 ${events.length} 个事件和 ${categories.length} 个分类，确定继续吗？`,
        confirmText: '覆盖导入',
        onConfirm: () => {
          importData({ events: backup.events, categories: backup.categories });
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

  const requestDeleteCategory = (category: { id: string; name: string }) => {
    setConfirm({
      title: '删除分类',
      message: `删除分类「${category.name}」后，该分类下的事件会变为“未分类”。确定删除？`,
      onConfirm: () => {
        removeCategory(category.id);
        if (filter.kind === 'category' && filter.id === category.id) {
          setFilter({ kind: 'all' });
        }
        setConfirm(null);
      }
    });
  };

  const handleSubmit = (source: EventFormState, value: EventFormValue) => {
    const input = {
      name: value.name,
      details: value.details,
      dueDate: value.dueDate,
      categoryId: value.categoryId
    };
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
            categories={categories}
            today={today}
            filter={filter}
            completedMode={settings.completedMode}
            onFilterChange={setFilter}
            onCompletedModeChange={setCompletedMode}
            onManageCategories={() => setCategorySheetOpen(true)}
            onBatchImport={() => setBatchImportOpen(true)}
            onEdit={(ev) => setForm({ kind: 'edit', event: ev })}
            onToggle={toggleCompleted}
            onDelete={requestDelete}
          />
        ) : (
          <CalendarView
            events={events}
            categories={categories}
            today={today}
            onEdit={(ev) => setForm({ kind: 'edit', event: ev })}
            onToggle={toggleCompleted}
            onDelete={requestDelete}
            onAddForDate={(iso) => setForm({ kind: 'create', defaultDueDate: iso })}
            onSelectedDateChange={setCalendarDate}
          />
        )}
      </main>

      <button
        type="button"
        className="fab"
        aria-label="新建事件"
        onClick={() => setForm({ kind: 'create', defaultDueDate: tab === 'list' ? today : calendarDate })}
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
        categories={categories}
        onClose={() => setForm(null)}
        onSubmit={handleSubmit}
        onRequestDelete={requestDelete}
      />
      <CategorySheet
        open={categorySheetOpen}
        categories={categories}
        onAdd={(name) => addCategory(name)}
        onDelete={requestDeleteCategory}
        onClose={() => setCategorySheetOpen(false)}
      />
      <BatchImportSheet
        open={batchImportOpen}
        today={today}
        onClose={() => setBatchImportOpen(false)}
        onImport={(inputs) => {
          addMany(inputs);
          setBatchImportOpen(false);
        }}
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