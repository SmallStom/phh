import { useCallback, useRef } from 'react';
import type { ExperienceCreate } from '../types/experience';
import type { RecordCreate } from '../types/record';

interface UseDraftSaveOptions<T> {
  storageKey: string;
  defaultValue: T;
  autoSaveDelay?: number;
  onAutoSave?: (data: T) => void;
}

// 从 localStorage 读取草稿
function loadDraft<T>(storageKey: string, defaultValue: T): T {
  if (typeof window === 'undefined') return defaultValue;
  
  try {
    const saved = localStorage.getItem(storageKey);
    if (saved) {
      return JSON.parse(saved);
    }
  } catch (error) {
    console.error('Failed to load draft:', error);
  }
  return defaultValue;
}

export function useDraftSave<T>({
  storageKey,
  defaultValue,
  autoSaveDelay = 2000,
  onAutoSave
}: UseDraftSaveOptions<T>) {
  // 使用 ref 存储所有状态，避免触发重新渲染
  const dataRef = useRef<T>(loadDraft(storageKey, defaultValue));
  const lastSavedRef = useRef<Date | null>(null);
  const saveTimerRef = useRef<NodeJS.Timeout | null>(null);

  // 初始化 lastSavedRef
  if (typeof window !== 'undefined' && lastSavedRef.current === null) {
    const saved = localStorage.getItem(storageKey);
    if (saved) {
      lastSavedRef.current = new Date();
    }
  }

  const save = useCallback((newData: T) => {
    // 更新 ref，不触发渲染
    dataRef.current = newData;
    
    // 清除之前的定时器
    if (saveTimerRef.current) {
      clearTimeout(saveTimerRef.current);
    }
    
    // 设置新的定时器
    saveTimerRef.current = setTimeout(() => {
      try {
        localStorage.setItem(storageKey, JSON.stringify(newData));
        lastSavedRef.current = new Date();
        
        if (onAutoSave) {
          onAutoSave(newData);
        }
      } catch (error) {
        console.error('Failed to save draft:', error);
      }
    }, autoSaveDelay);
  }, [storageKey, autoSaveDelay, onAutoSave]);

  const clear = useCallback(() => {
    dataRef.current = defaultValue;
    lastSavedRef.current = null;
    localStorage.removeItem(storageKey);
  }, [storageKey, defaultValue]);

  return {
    data: dataRef.current,
    save,
    clear,
    hasDraft: lastSavedRef.current !== null
  };
}

// 静态默认值，避免每次渲染都创建新对象
const RECORD_DRAFT_DEFAULT = {
  title: '',
  content: '',
  tags: [] as string[],
  recordType: 'note' as RecordCreate['record_type']
};

export function useRecordDraft(recordId?: string) {
  const storageKey = recordId 
    ? `draft_record_${recordId}` 
    : 'draft_record_new';

  return useDraftSave({
    storageKey,
    defaultValue: RECORD_DRAFT_DEFAULT,
    autoSaveDelay: 3000
  });
}

export function useExperienceDraft(experienceId?: string) {
  const storageKey = experienceId 
    ? `draft_experience_${experienceId}` 
    : 'draft_experience_new';

  return useDraftSave({
    storageKey,
    defaultValue: {
      title: '',
      description: '',
      tags: [] as string[],
      start_date: '',
      end_date: '',
      is_current: false,
      category: 'project' as ExperienceCreate['category'],
      is_public: false
    } as ExperienceCreate,
    autoSaveDelay: 3000
  });
}
