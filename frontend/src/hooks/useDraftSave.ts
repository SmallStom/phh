import { useState, useEffect, useCallback } from 'react';
import type { ExperienceCreate } from '../types/experience';
import type { RecordCreate } from '../types/record';

interface UseDraftSaveOptions<T> {
  storageKey: string;
  defaultValue: T;
  autoSaveDelay?: number;
  onAutoSave?: (data: T) => void;
}

export function useDraftSave<T>({
  storageKey,
  defaultValue,
  autoSaveDelay = 2000,
  onAutoSave
}: UseDraftSaveOptions<T>) {
  const [data, setData] = useState<T>(() => {
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
  });

  const [lastSaved, setLastSaved] = useState<Date | null>(null);
  const [isDirty, setIsDirty] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  const save = useCallback((newData: T) => {
    setData(newData);
    setIsDirty(true);
    
    try {
      localStorage.setItem(storageKey, JSON.stringify(newData));
      setLastSaved(new Date());
      setIsDirty(false);
    } catch (error) {
      console.error('Failed to save draft:', error);
    }

    if (onAutoSave) {
      onAutoSave(newData);
    }
  }, [storageKey, onAutoSave]);

  const clear = useCallback(() => {
    setData(defaultValue);
    setLastSaved(null);
    setIsDirty(false);
    localStorage.removeItem(storageKey);
  }, [storageKey, defaultValue]);

  useEffect(() => {
    const timer = setTimeout(() => {
      if (isDirty) {
        setIsSaving(true);
        localStorage.setItem(storageKey, JSON.stringify(data));
        setLastSaved(new Date());
        setIsDirty(false);
        setIsSaving(false);
      }
    }, autoSaveDelay);

    return () => clearTimeout(timer);
  }, [data, isDirty, autoSaveDelay, storageKey]);

  return {
    data,
    save,
    clear,
    lastSaved,
    isDirty,
    isSaving,
    hasDraft: lastSaved !== null
  };
}

export function useRecordDraft(recordId?: string) {
  const storageKey = recordId 
    ? `draft_record_${recordId}` 
    : 'draft_record_new';

  return useDraftSave({
    storageKey,
    defaultValue: {
      title: '',
      content: '',
      tags: [] as string[],
      recordType: 'note' as RecordCreate['record_type']
    },
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
      startDate: '',
      endDate: '',
      isCurrent: false,
      category: 'project' as ExperienceCreate['category'],
      tags: [] as string[]
    },
    autoSaveDelay: 3000
  });
}
