
"use client";

import { useState, useEffect } from 'react';
import { Category, Prayer, Goal } from '@/lib/types';
import { suggestIcon } from '@/ai/flows/suggest-icon-flow';
import { suggestAlternativeCategory, SuggestAlternativeCategoryOutput } from '@/ai/flows/suggest-alternative-category-flow';

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

// This type is defined here to be accessible by components that use the hook
// without creating a circular dependency or a separate types file for this one-off case.
export type CategorySuggestion = {
  prayer: Omit<Prayer, 'id' | 'createdAt' | 'status'>;
  suggestion: SuggestAlternativeCategoryOutput;
};

export const usePrayerStore = () => {
  const [prayers, setPrayers] = useState<Prayer[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [goal, setGoalState] = useState<Goal>(initialGoal);
  const [isLoaded, setIsLoaded] = useState(false);
  const [categorySuggestion, setCategorySuggestion] = useState<CategorySuggestion | null>(null);

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

  const _addPrayer = (prayer: Omit<Prayer, 'id' | 'createdAt' | 'status'>) => {
    const newPrayer: Prayer = {
      ...prayer,
      id: new Date().toISOString() + Math.random(),
      createdAt: new Date().toISOString(),
      status: 'active',
    };
    setPrayers(prev => [newPrayer, ...prev]);
    return newPrayer;
  }

  const addPrayer = async (prayer: Omit<Prayer, 'id' | 'createdAt' | 'status'>) => {
    const suggestion = await suggestAlternativeCategory({
        prayerTitle: prayer.title,
        originalCategoryId: prayer.categoryId,
        categories: categories.map(c => ({ id: c.id, name: c.name })),
    });

    if (suggestion.suggestedCategoryId && suggestion.suggestionReason) {
        setCategorySuggestion({ prayer, suggestion });
        return null; // Indicates a suggestion is pending
    } else {
        return _addPrayer(prayer);
    }
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
  
  const updateCategory = async (categoryId: string, updatedData: Partial<Omit<Category, 'id'>>) => {
    const newName = updatedData.name;
    if (!newName) return;

    const newId = newName.toLowerCase().replace(/\s+/g, '-');
    if (newId !== categoryId && categories.some(c => c.id === newId)) {
      throw new Error("A category with that name already exists.");
    }

    const { iconName } = await suggestIcon({ categoryName: newName });
    
    setCategories(prev => prev.map(c => 
      c.id === categoryId ? { ...c, ...updatedData, id: newId, icon: iconName } : c
    ));

    // Update prayers with the new category ID
    if (newId !== categoryId) {
        setPrayers(prev => prev.map(p => 
            p.categoryId === categoryId ? { ...p, categoryId: newId } : p
        ));
    }
  };
  
  const deleteCategory = (categoryId: string) => {
    setCategories(prev => prev.filter(c => c.id !== categoryId));
    // Also delete prayers in that category
    setPrayers(prev => prev.filter(p => p.categoryId !== categoryId));
  };

  const setGoal = (newGoal: Partial<Goal>) => {
    setGoalState(prev => ({...prev, ...newGoal}));
  }
  
  const resolveSuggestion = (
    action: 'move' | 'keep_both' | 'keep_current'
  ) => {
    if (!categorySuggestion) return;

    const { prayer, suggestion } = categorySuggestion;
    const { suggestedCategoryId } = suggestion;

    if (action === 'move') {
      _addPrayer({ ...prayer, categoryId: suggestedCategoryId! });
    } else if (action === 'keep_both') {
      _addPrayer(prayer); // Add original
      _addPrayer({ ...prayer, categoryId: suggestedCategoryId! }); // Add suggested
    } else if (action === 'keep_current') {
      _addPrayer(prayer);
    }

    setCategorySuggestion(null); // Clear the suggestion
  };

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
    updateCategory,
    deleteCategory,
    setGoal,
    categorySuggestion,
    resolveSuggestion,
  };
};
