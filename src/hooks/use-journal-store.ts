
"use client";

import { useState, useEffect } from 'react';
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
      }

    } catch (error) {
      console.error("Failed to load journal entries from localStorage", error);
    }
    setIsLoaded(true);
  }, []);

  useEffect(() => {
    if (isLoaded) {
      localStorage.setItem(JOURNAL_STORAGE_KEY, JSON.stringify(entries));
      if (lastSessionDuration !== null) {
        localStorage.setItem(LAST_SESSION_DURATION_KEY, JSON.stringify(lastSessionDuration));
      }
    }
  }, [entries, lastSessionDuration, isLoaded]);

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

  const setLastSessionDuration = (duration: number) => {
    setLastSessionDurationState(duration);
  }

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
