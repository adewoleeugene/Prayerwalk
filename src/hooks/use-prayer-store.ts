
"use client";

import { useState, useEffect, useCallback } from 'react';
import { Category, Prayer, Goal } from '@/lib/types';
import { suggestIcon } from '@/ai/flows/suggest-icon-flow';
import { suggestAlternativeCategory, SuggestAlternativeCategoryOutput } from '@/ai/flows/suggest-alternative-category-flow';

const PRAYERS_STORAGE_KEY = 'prayersmart-prayers';
const CATEGORIES_STORAGE_KEY = 'prayersmart-categories';
const GOAL_STORAGE_KEY = 'prayersmart-goal';

const initialCategories: Category[] = [];

const initialGoal: Goal = {
    dailyPrayerTime: 30, // default 30 minutes
};

// This type is defined here to be accessible by components that use the hook
// without creating a circular dependency or a separate types file for this one-off case.
export type CategorySuggestion = {
  prayer: Omit<Prayer, 'id' | 'createdAt' | 'status'>;
  suggestion: SuggestAlternativeCategoryOutput;
};


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
          // Prevent infinite loop by checking if the state is already the same
          if(event.newValue !== JSON.stringify(state)) {
             setState(JSON.parse(event.newValue));
          }
        } catch (error) {
          console.error(`Failed to parse stored value for '${key}'`, error);
        }
      }
    };
    window.addEventListener('storage', handleStorageChange);
    return () => {
      window.removeEventListener('storage', handleStorageChange);
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [key]);

  return [state, setSyncedState, isLoaded];
}


export const usePrayerStore = () => {
  const [prayers, setPrayers, isPrayersLoaded] = useSyncedState<Prayer[]>(PRAYERS_STORAGE_KEY, []);
  const [categories, setCategories, isCategoriesLoaded] = useSyncedState<Category[]>(CATEGORIES_STORAGE_KEY, initialCategories);
  const [goal, setGoal, isGoalLoaded] = useSyncedState<Goal>(GOAL_STORAGE_KEY, initialGoal);
  
  const [isLoaded, setIsLoaded] = useState(false);
  const [categorySuggestion, setCategorySuggestion] = useState<CategorySuggestion | null>(null);

  useEffect(() => {
    if(isPrayersLoaded && isCategoriesLoaded && isGoalLoaded) {
      //Ensure initial categories are set if local storage is empty
      if(localStorage.getItem(CATEGORIES_STORAGE_KEY) === null) {
        setCategories(initialCategories);
      }
      setIsLoaded(true);
    }
  }, [isPrayersLoaded, isCategoriesLoaded, isGoalLoaded, setCategories]);

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
    
    // 1. Get the current state directly
    let currentCategories: Category[] = [];
    setCategories(prev => {
        currentCategories = prev;
        return prev;
    });

    // 2. Perform the check outside the setState updater
    if (currentCategories.some(c => c.id === categoryId)) {
        console.error("Category already exists");
        throw new Error("Category with this name already exists.");
    }

    let iconName = 'Folder'; // Default icon
    try {
        const result = await suggestIcon({ categoryName: category.name });
        iconName = result.iconName;
    } catch(error) {
        console.error("An error occurred while suggesting an icon, using default. Error:", error);
    }

    const newCategory: Category = {
      ...category,
      id: categoryId,
      icon: iconName,
    };

    // 3. Update state
    setCategories(prev => [...prev, newCategory]);
  };
  
  const updateCategory = async (categoryId: string, updatedData: Partial<Omit<Category, 'id'>>) => {
    const newName = updatedData.name;
    if (!newName) return;

    const newId = newName.toLowerCase().replace(/\s+/g, '-');
    if (newId !== categoryId && categories.some(c => c.id === newId)) {
      throw new Error("A category with that name already exists.");
    }

    let iconName = 'Folder';
    try {
      const result = await suggestIcon({ categoryName: newName });
      iconName = result.iconName;
    } catch (error) {
      console.error("Failed to suggest an icon on update, using default. Error:", error);
    }
    
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
