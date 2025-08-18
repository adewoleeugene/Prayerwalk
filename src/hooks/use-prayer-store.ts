
"use client";

import { useState, useEffect } from 'react';
import { Category, Prayer, Goal } from '@/lib/types';
import { suggestIcon } from '@/ai/flows/suggest-icon-flow';

const PRAYERS_STORAGE_KEY = 'prayersmart-prayers';
const CATEGORIES_STORAGE_KEY = 'prayersmart-categories';
const GOAL_STORAGE_KEY = 'prayersmart-goal';

const initialCategories: Category[] = [
  { id: 'family', name: 'Family', icon: 'Users' },
  { id: 'work', name: 'Work', icon: 'Briefcase' },
  { id: 'personal', name: 'Personal', icon: 'Heart' },
  { id: 'study', name: 'Study', icon: 'BookOpen' },
];

const initialGoal: Goal = {
    dailyPrayerTime: 30, // default 30 minutes
};

export const usePrayerStore = () => {
  const [prayers, setPrayers] = useState<Prayer[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [goal, setGoalState] = useState<Goal>(initialGoal);
  const [isLoaded, setIsLoaded] = useState(false);

  useEffect(() => {
    try {
      const storedPrayers = localStorage.getItem(PRAYERS_STORAGE_KEY);
      const storedCategories = localStorage.getItem(CATEGORIES_STORAGE_KEY);
      const storedGoal = localStorage.getItem(GOAL_STORAGE_KEY);

      if (storedPrayers) {
        setPrayers(JSON.parse(storedPrayers));
      }

      if (storedCategories) {
        const parsedCategories = JSON.parse(storedCategories);
        if (parsedCategories.length > 0) {
          setCategories(parsedCategories);
        } else {
          setCategories(initialCategories);
        }
      } else {
        setCategories(initialCategories);
      }
      
      if (storedGoal) {
        setGoalState(JSON.parse(storedGoal));
      } else {
        setGoalState(initialGoal);
      }

    } catch (error) {
      console.error("Failed to load data from localStorage", error);
      setCategories(initialCategories);
      setGoalState(initialGoal);
    }
    setIsLoaded(true);
  }, []);

  useEffect(() => {
    if (isLoaded) {
      localStorage.setItem(PRAYERS_STORAGE_KEY, JSON.stringify(prayers));
    }
  }, [prayers, isLoaded]);

  useEffect(() => {
    if (isLoaded) {
      localStorage.setItem(CATEGORIES_STORAGE_KEY, JSON.stringify(categories));
    }
  }, [categories, isLoaded]);

  useEffect(() => {
    if (isLoaded) {
      localStorage.setItem(GOAL_STORAGE_KEY, JSON.stringify(goal));
    }
  }, [goal, isLoaded]);

  const addPrayer = (prayer: Omit<Prayer, 'id' | 'createdAt' | 'status'>) => {
    const newPrayer: Prayer = {
      ...prayer,
      id: new Date().toISOString() + Math.random(),
      createdAt: new Date().toISOString(),
      status: 'active',
    };
    setPrayers(prev => [newPrayer, ...prev]);
  };
  
  const addPrayers = (newPrayers: Omit<Prayer, 'id' | 'createdAt' | 'status'>[]) => {
    const prayersToAdd: Prayer[] = newPrayers.map(p => ({
      ...p,
      id: new Date().toISOString() + Math.random(),
      createdAt: new Date().toISOString(),
      status: 'active',
    }));
    setPrayers(prev => [...prayersToAdd, ...prev]);
  };

  const updatePrayer = (updatedPrayer: Prayer) => {
    setPrayers(prev => prev.map(p => (p.id === updatedPrayer.id ? updatedPrayer : p)));
  };

  const deletePrayer = (prayerId: string) => {
    setPrayers(prev => prev.filter(p => p.id !== prayerId));
  };
  
  const togglePrayerStatus = (prayerId: string) => {
    setPrayers(prev => prev.map(p => {
      if (p.id === prayerId) {
        return { ...p, status: p.status === 'active' ? 'answered' : 'active' };
      }
      return p;
    }));
  };

  const addCategory = async (category: Omit<Category, 'id' | 'icon'>) => {
    const categoryId = category.name.toLowerCase().replace(/\s+/g, '-');
    if (categories.some(c => c.id === categoryId)) {
      console.error("Category already exists");
      throw new Error("Category with this name already exists.");
    }
    
    const { iconName } = await suggestIcon({ categoryName: category.name });

    const newCategory: Category = {
      ...category,
      id: categoryId,
      icon: iconName,
    };
    setCategories(prev => [...prev, newCategory]);
  };

  const setGoal = (newGoal: Partial<Goal>) => {
    setGoalState(prev => ({...prev, ...newGoal}));
  }

  return {
    prayers,
    categories,
    goal,
    isLoaded,
    addPrayer,
    addPrayers,
    updatePrayer,
    deletePrayer,
    togglePrayerStatus,
    addCategory,
    setGoal,
  };
};
