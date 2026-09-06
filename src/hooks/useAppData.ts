import { useCallback, useEffect, useRef, useState } from 'react';
import type { AppSettings, Category, CompletedMode, EventItem, ToastInfo } from '../types';
import {
  applyPatch,
  createEvent,
  removeEvent,
  type EventInput,
  type EventPatch
} from '../lib/events';
import { clearCategoryRefs, createCategoryName } from '../lib/categories';
import { readCategories, readEvents, writeCategories, writeEvents } from '../lib/storage';
import { readSettings, writeSettings } from '../lib/settings';

export interface ImportPayload {
  events: EventItem[];
  categories: Category[];
}

export function useAppData() {
  const [events, setEvents] = useState<EventItem[]>(() => {
    if (typeof window === 'undefined') return [];
    return readEvents(window.localStorage).events;
  });
  const [categories, setCategories] = useState<Category[]>(() => {
    if (typeof window === 'undefined') return [];
    return readCategories(window.localStorage).categories;
  });
  const [settings, setSettings] = useState<AppSettings>(() => {
    if (typeof window === 'undefined') return { completedMode: 'collapse' };
    return readSettings(window.localStorage).settings;
  });
  const [toast, setToast] = useState<ToastInfo | null>(null);
  const timerRef = useRef<number | null>(null);

  const showToast = useCallback((text: string, kind: ToastInfo['kind'] = 'success') => {
    if (timerRef.current !== null) window.clearTimeout(timerRef.current);
    setToast({ text, kind });
    timerRef.current = window.setTimeout(() => {
      setToast(null);
      timerRef.current = null;
    }, 2600);
  }, []);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    const problems: string[] = [];
    if (!readEvents(window.localStorage).ok) problems.push('事件数据异常，已重置为空列表');
    if (!readCategories(window.localStorage).ok) problems.push('分类数据异常，已重置为空');
    if (!readSettings(window.localStorage).ok) problems.push('显示设置异常，已恢复默认');
    if (problems.length > 0) showToast(problems.join('；'), 'error');
    return () => {
      if (timerRef.current !== null) window.clearTimeout(timerRef.current);
    };
  }, [showToast]);

  const commitEvents = useCallback(
    (next: EventItem[], successText?: string) => {
      setEvents(next);
      const saved = typeof window !== 'undefined' && writeEvents(window.localStorage, next);
      if (!saved) {
        showToast('保存失败：浏览器存储不可用', 'error');
      } else if (successText) {
        showToast(successText);
      }
    },
    [showToast]
  );

  const commitCategories = useCallback(
    (next: Category[], successText?: string) => {
      setCategories(next);
      const saved = typeof window !== 'undefined' && writeCategories(window.localStorage, next);
      if (!saved) {
        showToast('保存失败：浏览器存储不可用', 'error');
      } else if (successText) {
        showToast(successText);
      }
    },
    [showToast]
  );

  const addEvent = useCallback(
    (input: EventInput) => {
      commitEvents([...events, createEvent(input)], '已新建事件');
    },
    [events, commitEvents]
  );

  const addMany = useCallback(
    (inputs: EventInput[]) => {
      if (inputs.length === 0) return;
      const created = inputs.map((input) => createEvent(input));
      commitEvents([...events, ...created], `已批量导入 ${created.length} 个事件`);
    },
    [events, commitEvents]
  );
  const updateEvent = useCallback(
    (id: string, patch: EventPatch, successText?: string) => {
      commitEvents(applyPatch(events, id, patch), successText);
    },
    [events, commitEvents]
  );

  const toggleCompleted = useCallback(
    (id: string) => {
      const target = events.find((ev) => ev.id === id);
      if (!target) return;
      updateEvent(id, { completed: !target.completed });
    },
    [events, updateEvent]
  );

  const removeById = useCallback(
    (id: string) => {
      commitEvents(removeEvent(events, id), '已删除');
    },
    [events, commitEvents]
  );

  const addCategory = useCallback(
    (rawName: string) => {
      const result = createCategoryName(categories, rawName);
      if (!result.ok || !result.category) return result;
      commitCategories([...categories, result.category], '已添加分类');
      return { ok: true };
    },
    [categories, commitCategories]
  );

  const removeCategory = useCallback(
    (id: string) => {
      const nextCategories = categories.filter((c) => c.id !== id);
      commitCategories(nextCategories);
      commitEvents(clearCategoryRefs(events, id), '已删除分类');
    },
    [categories, events, commitCategories, commitEvents]
  );

  const setCompletedMode = useCallback(
    (mode: CompletedMode) => {
      const next = { ...settings, completedMode: mode };
      setSettings(next);
      const saved = typeof window !== 'undefined' && writeSettings(window.localStorage, next);
      if (!saved) showToast('保存失败：浏览器存储不可用', 'error');
    },
    [settings, showToast]
  );

  const importData = useCallback(
    (payload: ImportPayload) => {
      const seen = new Set<string>();
      const nextCategories: Category[] = [];
      for (const category of payload.categories) {
        if (seen.has(category.id)) continue;
        seen.add(category.id);
        nextCategories.push({ ...category });
      }
      const categoryIds = new Set(nextCategories.map((c) => c.id));
      const eventSeen = new Set<string>();
      const nextEvents: EventItem[] = [];
      for (const item of payload.events) {
        if (eventSeen.has(item.id)) continue;
        eventSeen.add(item.id);
        nextEvents.push({
          ...item,
          categoryId: item.categoryId && categoryIds.has(item.categoryId) ? item.categoryId : null
        });
      }
      commitCategories(nextCategories);
      commitEvents(nextEvents, `已导入 ${nextEvents.length} 个事件、${nextCategories.length} 个分类`);
    },
    [commitCategories, commitEvents]
  );

  return {
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
  };
}