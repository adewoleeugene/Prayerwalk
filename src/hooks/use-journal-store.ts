
"use client";

import { useState, useEffect } from 'react';
import { JournalEntry } from '@/lib/types';

const JOURNAL_STORAGE_KEY = 'praysmart-journal';

export const useJournalStore = () => {
  const [entries, setEntries] = useState<JournalEntry[]>([]);
  const [isLoaded, setIsLoaded] = useState(false);

  useEffect(() => {
    try {
      const storedEntries = localStorage.getItem(JOURNAL_STORAGE_KEY);
      if (storedEntries) {
        setEntries(JSON.parse(storedEntries));
      }
    } catch (error) {
      console.error("Failed to load journal entries from localStorage", error);
    }
    setIsLoaded(true);
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

  return {
    entries,
    isLoaded,
    addJournalEntry,
    deleteJournalEntry,
  };
};
