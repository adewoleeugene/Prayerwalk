
"use client";

import { useState, useEffect, useCallback } from 'react';
import { JournalEntry } from '@/lib/types';

const JOURNAL_STORAGE_KEY = 'praysmart-journal';
const LAST_SESSION_DURATION_KEY = 'praysmart-last-session-duration';


export const useJournalStore = () => {
  const [entries, setEntries] = useState<JournalEntry[]>([]);
  const [lastSessionDuration, setLastSessionDurationState] = useState<number | null>(null);
  const [isLoaded, setIsLoaded] = useState(false);

  useEffect(() => {
    try {
      const storedEntries = localStorage.getItem(JOURNAL_STORAGE_KEY);
      if (storedEntries) {
        setEntries(JSON.parse(storedEntries));
      }
      const storedDuration = localStorage.getItem(LAST_SESSION_DURATION_KEY);
      if (storedDuration) {
        setLastSessionDurationState(JSON.parse(storedDuration));
      } else {
        setLastSessionDurationState(0);
      }

    } catch (error) {
      console.error("Failed to load journal entries from localStorage", error);
    }
    setIsLoaded(true);
  }, []);

  const setLastSessionDuration = useCallback((duration: number) => {
    localStorage.setItem(LAST_SESSION_DURATION_KEY, JSON.stringify(duration));
    setLastSessionDurationState(duration);
  }, []);

  useEffect(() => {
    if (isLoaded) {
      localStorage.setItem(JOURNAL_STORAGE_KEY, JSON.stringify(entries));
    }
  }, [entries, isLoaded]);

  const addJournalEntry = (entry: Omit<JournalEntry, 'id' | 'createdAt'>) => {
    const newEntry: JournalEntry = {
      ...entry,
      id: new Date().toISOString() + Math.random(),
      createdAt: new Date().toISOString(),
    };
    setEntries(prev => [newEntry, ...prev]);
  };

  const deleteJournalEntry = (id: string) => {
    setEntries(prev => prev.filter(entry => entry.id !== id));
  };
  
  const updateJournalEntryNotes = (id: string, notes: string) => {
    setEntries(prev => prev.map(entry => 
      entry.id === id ? { ...entry, notes } : entry
    ));
  };
  
  // This effect handles events from other tabs/windows
  useEffect(() => {
    const handleStorageChange = (event: StorageEvent) => {
      if (event.key === LAST_SESSION_DURATION_KEY && event.newValue) {
        setLastSessionDurationState(JSON.parse(event.newValue));
      }
      if (event.key === JOURNAL_STORAGE_KEY && event.newValue) {
        setEntries(JSON.parse(event.newValue));
      }
    };

    window.addEventListener('storage', handleStorageChange);
    return () => {
      window.removeEventListener('storage', handleStorageChange);
    };
  }, []);


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
