import { useCallback, useEffect, useRef, useState } from 'react';
import type { EventItem, ToastInfo } from '../types';
import {
  applyPatch,
  createEvent,
  removeEvent,
  type EventInput,
  type EventPatch
} from '../lib/events';
import { readEvents, writeEvents } from '../lib/storage';

export function useEvents() {
  const [events, setEvents] = useState<EventItem[]>(() => {
    if (typeof window === 'undefined') return [];
    return readEvents(window.localStorage).events;
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
    const result = readEvents(window.localStorage);
    if (!result.ok) {
      showToast('本地数据异常，已重置为空列表', 'error');
    }
    return () => {
      if (timerRef.current !== null) window.clearTimeout(timerRef.current);
    };
  }, [showToast]);

  const commit = useCallback(
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

  const addEvent = useCallback(
    (input: EventInput) => {
      commit([...events, createEvent(input)], '已新建事件');
    },
    [events, commit]
  );

  const updateEvent = useCallback(
    (id: string, patch: EventPatch, successText?: string) => {
      commit(applyPatch(events, id, patch), successText);
    },
    [events, commit]
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
      commit(removeEvent(events, id), '已删除');
    },
    [events, commit]
  );

  const replaceAll = useCallback(
    (incoming: EventItem[]) => {
      const seen = new Set<string>();
      const next: EventItem[] = [];
      for (const item of incoming) {
        if (seen.has(item.id)) continue;
        seen.add(item.id);
        next.push({ ...item });
      }
      commit(next, `已导入 ${next.length} 个事件`);
    },
    [commit]
  );

  return {
    events,
    toast,
    showToast,
    addEvent,
    updateEvent,
    toggleCompleted,
    removeById,
    replaceAll
  };
}
