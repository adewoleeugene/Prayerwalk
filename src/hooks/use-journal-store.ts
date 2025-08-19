
"use client";

import { useState, useEffect, useCallback } from 'react';
import { JournalEntry } from '@/lib/types';

const JOURNAL_STORAGE_KEY = 'praysmart-journal';
const LAST_SESSION_DURATION_KEY = 'praysmart-last-session-duration';

// Custom hook for cross-tab state synchronization
function useSyncedState<T>(key: string, initialState: T): [T, (value: T | ((prevState: T) => T)) => void, boolean] {
  const [state, setState] = useState<T>(initialState);
  const [isLoaded, setIsLoaded] = useState(false);

  useEffect(() => {
    let mounted = true;
    try {
      const storedValue = localStorage.getItem(key);
      if (storedValue) {
        if (mounted) setState(JSON.parse(storedValue));
      } else {
        if (mounted) setState(initialState);
      }
    } catch (error) {
      console.error(`Failed to load '${key}' from localStorage`, error);
      if (mounted) setState(initialState);
    } finally {
       if (mounted) setIsLoaded(true);
    }
     return () => { mounted = false };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [key]);

  const setSyncedState = useCallback((value: T | ((prevState: T) => T)) => {
    setState(prevState => {
        const valueToStore = value instanceof Function ? value(prevState) : value;

        // Prevent unnecessary updates if the value hasn't changed
        if (JSON.stringify(prevState) === JSON.stringify(valueToStore)) {
            return prevState;
        }

        try {
            const serializedValue = JSON.stringify(valueToStore);
            localStorage.setItem(key, serializedValue);
            window.dispatchEvent(new StorageEvent('storage', {
                key: key,
                newValue: serializedValue,
                storageArea: window.localStorage,
            }));
        } catch (error) {
            console.error(`Failed to save '${key}' to localStorage`, error);
        }
        return valueToStore;
    });
  }, [key]);
  
  useEffect(() => {
    const handleStorageChange = (event: StorageEvent) => {
      if (event.storageArea === window.localStorage && event.key === key && event.newValue) {
        try {
          setState(JSON.parse(event.newValue));
        } catch (error) {
          console.error(`Failed to parse stored value for '${key}'`, error);
        }
      }
    };
    window.addEventListener('storage', handleStorageChange);
    return () => {
      window.removeEventListener('storage', handleStorageChange);
    };
  }, [key]);

  return [state, setSyncedState, isLoaded];
}


export const useJournalStore = () => {
  const [entries, setEntries, isEntriesLoaded] = useSyncedState<JournalEntry[]>(JOURNAL_STORAGE_KEY, []);
  const [lastSessionDuration, setLastSessionDuration, isDurationLoaded] = useSyncedState<number | null>(LAST_SESSION_DURATION_KEY, 0);

  const isLoaded = isEntriesLoaded && isDurationLoaded;

  const addJournalEntry = (entry: Omit<JournalEntry, 'id' | 'createdAt'>) => {
    const newEntry: JournalEntry = {
      ...entry,
      id: new Date().toISOString() + Math.random(),
      createdAt: new Date().toISOString(),
    };
    const updatedEntries = [newEntry, ...entries];
    setEntries(updatedEntries);
  };

  const deleteJournalEntry = (id: string) => {
    setEntries(entries.filter(entry => entry.id !== id));
  };
  
  const updateJournalEntryNotes = (id: string, notes: string) => {
    setEntries(entries.map(entry => 
      entry.id === id ? { ...entry, notes } : entry
    ));
  };

  return {
    entries,
    isLoaded,
    addJournalEntry,
    deleteJournalEntry,
    updateJournalEntryNotes,
    lastSessionDuration,
    setLastSessionDuration
  };
};
