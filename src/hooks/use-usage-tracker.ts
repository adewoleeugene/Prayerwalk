
"use client";

import { useState, useEffect, useCallback } from 'react';
import { useAuth } from './use-auth';
import { DAILY_AI_LIMIT } from '@/lib/config';

const USAGE_STORAGE_KEY_PREFIX = 'praysmart-usage-';

type UsageData = {
  date: string; // YYYY-MM-DD
  count: number;
};

export const useUsageTracker = () => {
  const { user } = useAuth();
  const [usage, setUsage] = useState<UsageData>({ date: '', count: 0 });
  const [isLoaded, setIsLoaded] = useState(false);

  const getStorageKey = useCallback(() => {
    if (!user) return null;
    return `${USAGE_STORAGE_KEY_PREFIX}${user.uid}`;
  }, [user]);

  useEffect(() => {
    const storageKey = getStorageKey();
    if (!storageKey) return;

    const todayStr = new Date().toISOString().split('T')[0];
    try {
      const storedItem = localStorage.getItem(storageKey);
      if (storedItem) {
        const storedUsage: UsageData = JSON.parse(storedItem);
        if (storedUsage.date === todayStr) {
          setUsage(storedUsage);
        } else {
          // It's a new day, reset the usage
          const newUsage = { date: todayStr, count: 0 };
          setUsage(newUsage);
          localStorage.setItem(storageKey, JSON.stringify(newUsage));
        }
      } else {
        // No stored usage for this user yet
        setUsage({ date: todayStr, count: 0 });
      }
    } catch (error) {
      console.error("Failed to load usage data from localStorage", error);
      setUsage({ date: todayStr, count: 0 });
    }
    setIsLoaded(true);
  }, [getStorageKey]);

  const recordUsage = (amount = 1) => {
    const storageKey = getStorageKey();
    if (!storageKey || !isLoaded) return;

    setUsage(prevUsage => {
      const newCount = prevUsage.count + amount;
      const newUsage: UsageData = { ...prevUsage, count: newCount };
      try {
        localStorage.setItem(storageKey, JSON.stringify(newUsage));
      } catch (error) {
        console.error("Failed to save usage data to localStorage", error);
      }
      return newUsage;
    });
  };

  const hasReachedLimit = usage.count >= DAILY_AI_LIMIT;

  return {
    dailyCount: usage.count,
    limit: DAILY_AI_LIMIT,
    hasReachedLimit,
    recordUsage,
    isLoaded,
  };
};
