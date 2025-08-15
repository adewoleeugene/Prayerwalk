"use client";

import { useState, useEffect } from 'react';
import { Category, Prayer } from '@/lib/types';

const PRAYERS_STORAGE_KEY = 'prayersmart-prayers';
const CATEGORIES_STORAGE_KEY = 'prayersmart-categories';

const initialCategories: Category[] = [
  { id: 'family', name: 'Family', icon: 'Users' },
  { id: 'work', name: 'Work', icon: 'Briefcase' },
  { id: 'personal', name: 'Personal', icon: 'Heart' },
  { id: 'study', name: 'Study', icon: 'BookOpen' },
];

export const usePrayerStore = () => {
  const [prayers, setPrayers] = useState<Prayer[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [isLoaded, setIsLoaded] = useState(false);

  useEffect(() => {
    try {
      const storedPrayers = localStorage.getItem(PRAYERS_STORAGE_KEY);
      const storedCategories = localStorage.getItem(CATEGORIES_STORAGE_KEY);

      if (storedPrayers) {
        setPrayers(JSON.parse(storedPrayers));
      }

      if (storedCategories) {
        setCategories(JSON.parse(storedCategories));
      } else {
        setCategories(initialCategories);
        localStorage.setItem(CATEGORIES_STORAGE_KEY, JSON.stringify(initialCategories));
      }
    } catch (error) {
      console.error("Failed to load data from localStorage", error);
      setCategories(initialCategories);
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

  const addCategory = (category: Omit<Category, 'id'>) => {
    const newCategory: Category = {
      ...category,
      id: category.name.toLowerCase().replace(/\s+/g, '-'),
    };
    if (categories.some(c => c.id === newCategory.id)) {
      console.error("Category already exists");
      return;
    }
    setCategories(prev => [...prev, newCategory]);
  };

  return {
    prayers,
    categories,
    isLoaded,
    addPrayer,
    addPrayers,
    updatePrayer,
    deletePrayer,
    togglePrayerStatus,
    addCategory,
  };
};
