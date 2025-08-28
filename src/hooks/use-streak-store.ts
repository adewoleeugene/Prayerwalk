"use client";

import { useState, useEffect, useCallback, useSyncExternalStore } from 'react';
import { StreakData, StreakHistoryEntry, Goal } from '@/lib/types';
import { format, isToday, parseISO, differenceInDays, startOfDay } from 'date-fns';

const STREAK_STORAGE_KEY = 'praysmart-streak-data';

// Initial streak data
const initialStreakData: StreakData = {
  currentStreak: 0,
  longestStreak: 0,
  lastPrayerDate: null,
  todayCompleted: false,
  streakHistory: [],
};

// Store implementation for useSyncExternalStore
function createStreakStore() {
  let state = initialStreakData;
  const listeners = new Set<() => void>();

  // Load from localStorage on initialization
  if (typeof window !== 'undefined') {
    try {
      const storedValue = localStorage.getItem(STREAK_STORAGE_KEY);
      if (storedValue) {
        const parsed = JSON.parse(storedValue);
        // Validate and update today's status
        state = {
          ...parsed,
          todayCompleted: checkTodayCompleted(parsed.streakHistory),
        };
      }
    } catch (error) {
      console.error('Failed to load streak data from localStorage', error);
    }
  }

  const get = () => state;
  
  const set = (newState: StreakData | ((prev: StreakData) => StreakData)) => {
    const nextState = typeof newState === 'function' ? newState(state) : newState;
    state = nextState;
    
    // Save to localStorage
    if (typeof window !== 'undefined') {
      try {
        localStorage.setItem(STREAK_STORAGE_KEY, JSON.stringify(state));
      } catch (error) {
        console.error('Failed to save streak data to localStorage', error);
      }
    }
    
    // Notify listeners
    listeners.forEach(listener => listener());
  };
  
  const subscribe = (listener: () => void) => {
    listeners.add(listener);
    return () => listeners.delete(listener);
  };
  
  return { get, set, subscribe };
}

// Helper function to check if today is completed
function checkTodayCompleted(streakHistory: StreakHistoryEntry[]): boolean {
  const today = format(new Date(), 'yyyy-MM-dd');
  const todayEntry = streakHistory.find(entry => entry.date === today);
  return todayEntry?.completed || false;
}

// Helper function to calculate streak from history
function calculateStreakFromHistory(streakHistory: StreakHistoryEntry[]): { currentStreak: number; longestStreak: number } {
  if (streakHistory.length === 0) {
    return { currentStreak: 0, longestStreak: 0 };
  }

  // Sort history by date (newest first)
  const sortedHistory = [...streakHistory].sort((a, b) => b.date.localeCompare(a.date));
  
  let currentStreak = 0;
  let longestStreak = 0;
  let tempStreak = 0;
  
  // Calculate current streak (from today backwards)
  const today = format(new Date(), 'yyyy-MM-dd');
  let currentDate = new Date();
  
  for (let i = 0; i < sortedHistory.length; i++) {
    const entry = sortedHistory[i];
    const entryDate = format(currentDate, 'yyyy-MM-dd');
    
    if (entry.date === entryDate && entry.completed) {
      currentStreak++;
      currentDate.setDate(currentDate.getDate() - 1);
    } else if (entry.date === entryDate && !entry.completed) {
      break;
    } else {
      // Gap in history, check if it's today and we haven't completed it yet
      if (entryDate === today && !checkTodayCompleted(streakHistory)) {
        currentDate.setDate(currentDate.getDate() - 1);
        continue;
      }
      break;
    }
  }
  
  // Calculate longest streak
  for (const entry of sortedHistory) {
    if (entry.completed) {
      tempStreak++;
      longestStreak = Math.max(longestStreak, tempStreak);
    } else {
      tempStreak = 0;
    }
  }
  
  return { currentStreak, longestStreak };
}

const streakStore = createStreakStore();

export const useStreakStore = () => {
  const streakData = useSyncExternalStore(
    streakStore.subscribe,
    streakStore.get,
    () => initialStreakData // getServerSnapshot
  );
  
  const [isLoaded, setIsLoaded] = useState(false);
  
  useEffect(() => {
    setIsLoaded(true);
  }, []);
  
  const recordPrayerCompletion = useCallback((durationMinutes: number, dailyGoal: number) => {
    const today = format(new Date(), 'yyyy-MM-dd');
    
    streakStore.set(prevData => {
      // Update or add today's entry
      const updatedHistory = [...prevData.streakHistory];
      const todayIndex = updatedHistory.findIndex(entry => entry.date === today);
      
      let newEntry: StreakHistoryEntry;
      if (todayIndex >= 0) {
        const existingEntry = updatedHistory[todayIndex];
        const newTotalMinutes = existingEntry.prayerTimeMinutes + durationMinutes;
        newEntry = {
          ...existingEntry,
          prayerTimeMinutes: newTotalMinutes,
          prayerCount: existingEntry.prayerCount + 1,
          completed: newTotalMinutes >= dailyGoal,
        };
        updatedHistory[todayIndex] = newEntry;
      } else {
        newEntry = {
          date: today,
          prayerTimeMinutes: durationMinutes,
          prayerCount: 1,
          completed: durationMinutes >= dailyGoal,
        };
        updatedHistory.push(newEntry);
      }
      
      // Recalculate streaks
      const { currentStreak, longestStreak } = calculateStreakFromHistory(updatedHistory);
      
      return {
        ...prevData,
        currentStreak,
        longestStreak,
        lastPrayerDate: today,
        todayCompleted: newEntry.completed,
        streakHistory: updatedHistory,
      };
    });
  }, []);
  
  const resetStreak = useCallback(() => {
    streakStore.set(initialStreakData);
  }, []);
  
  const getStreakForDate = useCallback((date: string) => {
    const entry = streakData.streakHistory.find(entry => entry.date === date);
    return entry || { date, completed: false, prayerTimeMinutes: 0, prayerCount: 0 };
  }, [streakData.streakHistory]);
  
  const getRecentHistory = useCallback((days: number = 7) => {
    const result: StreakHistoryEntry[] = [];
    const today = new Date();
    
    for (let i = days - 1; i >= 0; i--) {
      const date = new Date(today);
      date.setDate(date.getDate() - i);
      const dateStr = format(date, 'yyyy-MM-dd');
      
      const entry = streakData.streakHistory.find(entry => entry.date === dateStr);
      result.push(entry || { date: dateStr, completed: false, prayerTimeMinutes: 0, prayerCount: 0 });
    }
    
    return result;
  }, [streakData.streakHistory]);
  
  return {
    streakData,
    isLoaded,
    recordPrayerCompletion,
    resetStreak,
    getStreakForDate,
    getRecentHistory,
  };
};