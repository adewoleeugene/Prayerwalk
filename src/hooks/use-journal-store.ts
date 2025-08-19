
"use client";

import { useState, useEffect, useCallback, useSyncExternalStore } from 'react';
import { JournalEntry } from '@/lib/types';

const JOURNAL_STORAGE_KEY = 'praysmart-journal';
const LAST_SESSION_DURATION_KEY = 'praysmart-last-session-duration';

// --- Store Implementation for useSyncExternalStore ---
function createStore<T>(key: string, initialState: T) {
    let state = initialState;
    const listeners = new Set<() => void>();

    try {
        const storedValue = localStorage.getItem(key);
        if (storedValue) {
            state = JSON.parse(storedValue);
        }
    } catch (error) {
        console.error(`Failed to load '${key}' from localStorage`, error);
    }

    const subscribe = (listener: () => void) => {
        listeners.add(listener);
        return () => listeners.delete(listener);
    };

    const emitChange = () => {
        for (const listener of listeners) {
            listener();
        }
    };

    // Listen for changes in other tabs
    if (typeof window !== "undefined") {
        window.addEventListener('storage', (event) => {
            if (event.storageArea === localStorage && event.key === key && event.newValue) {
                try {
                    state = JSON.parse(event.newValue);
                    emitChange();
                } catch (e) {
                    console.error(e);
                }
            }
        });
    }

    return {
        get: () => state,
        set: (value: T | ((prevState: T) => T)) => {
            const oldValue = state;
            const newValue = typeof value === 'function' ? (value as (prevState: T) => T)(oldValue) : value;

            if (JSON.stringify(oldValue) === JSON.stringify(newValue)) {
                return;
            }

            state = newValue;
            try {
                localStorage.setItem(key, JSON.stringify(state));
            } catch (error) {
                 console.error(`Failed to save '${key}' to localStorage`, error);
            }
            emitChange();
        },
        subscribe
    };
}


const entriesStore = createStore<JournalEntry[]>(JOURNAL_STORAGE_KEY, []);
const durationStore = createStore<number | null>(LAST_SESSION_DURATION_KEY, 0);


export const useJournalStore = () => {
  const entries = useSyncExternalStore(entriesStore.subscribe, entriesStore.get);
  const lastSessionDuration = useSyncExternalStore(durationStore.subscribe, durationStore.get);
  const [isLoaded, setIsLoaded] = useState(false);

  useEffect(() => {
    setIsLoaded(true);
  }, []);

  const addJournalEntry = (entry: Omit<JournalEntry, 'id' | 'createdAt'>) => {
    const newEntry: JournalEntry = {
      ...entry,
      id: new Date().toISOString() + Math.random(),
      createdAt: new Date().toISOString(),
    };
    entriesStore.set(prev => [newEntry, ...prev]);
  };

  const deleteJournalEntry = (id: string) => {
    entriesStore.set(prev => prev.filter(entry => entry.id !== id));
  };
  
  const updateJournalEntryNotes = (id: string, notes: string) => {
    entriesStore.set(prev => prev.map(entry => 
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
    setLastSessionDuration: durationStore.set,
  };
};
