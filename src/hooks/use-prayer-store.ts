
"use client";

import { useState, useEffect, useCallback, useSyncExternalStore } from 'react';
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

const prayersStore = createStore<Prayer[]>(PRAYERS_STORAGE_KEY, []);
const categoriesStore = createStore<Category[]>(CATEGORIES_STORAGE_KEY, initialCategories);
const goalStore = createStore<Goal>(GOAL_STORAGE_KEY, initialGoal);

const deduplicateCategories = (categories: Category[]): Category[] => {
    const seen = new Set<string>();
    return categories.filter(category => {
        const isDuplicate = seen.has(category.id);
        seen.add(category.id);
        return !isDuplicate;
    });
};


export const usePrayerStore = () => {
  const prayers = useSyncExternalStore(prayersStore.subscribe, prayersStore.get);
  const categories = useSyncExternalStore(categoriesStore.subscribe, categoriesStore.get);
  const goal = useSyncExternalStore(goalStore.subscribe, goalStore.get);
  
  const [isLoaded, setIsLoaded] = useState(false);
  const [categorySuggestion, setCategorySuggestion] = useState<CategorySuggestion | null>(null);

  useEffect(() => {
    // Clean up duplicates on first load if necessary
    const currentCategories = categoriesStore.get();
    const cleaned = deduplicateCategories(currentCategories);
    if (currentCategories.length !== cleaned.length) {
        categoriesStore.set(cleaned);
    }
    setIsLoaded(true);
  }, []);

  const _addPrayer = (prayer: Omit<Prayer, 'id' | 'createdAt' | 'status'>) => {
    const newPrayer: Prayer = {
      ...prayer,
      id: new Date().toISOString() + Math.random(),
      createdAt: new Date().toISOString(),
      status: 'active',
    };
    prayersStore.set(prev => [newPrayer, ...prev]);
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
    prayersStore.set(prev => [...prayersToAdd, ...prev]);
  };

  const updatePrayer = (updatedPrayer: Prayer) => {
    prayersStore.set(prev => prev.map(p => (p.id === updatedPrayer.id ? updatedPrayer : p)));
  };

  const deletePrayer = (prayerId: string) => {
    prayersStore.set(prev => prev.filter(p => p.id !== prayerId));
  };
  
  const togglePrayerStatus = (prayerId: string) => {
    prayersStore.set(prev => prev.map(p => {
      if (p.id === prayerId) {
        return { ...p, status: p.status === 'active' ? 'answered' : 'active' };
      }
      return p;
    }));
  };

  const addCategory = async (category: Omit<Category, 'id' | 'icon'>) => {
    const categoryId = category.name.toLowerCase().replace(/\s+/g, '-');
    const currentCategories = categoriesStore.get();
    
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
    
    categoriesStore.set(prev => [...prev, newCategory]);
  };
  
  const updateCategory = async (categoryId: string, updatedData: Partial<Omit<Category, 'id'>>) => {
    const newName = updatedData.name;
    if (!newName) return;
    const currentCategories = categoriesStore.get();

    const newId = newName.toLowerCase().replace(/\s+/g, '-');
    if (newId !== categoryId && currentCategories.some(c => c.id === newId)) {
      throw new Error("A category with that name already exists.");
    }

    let iconName = 'Folder';
    try {
      const result = await suggestIcon({ categoryName: newName });
      iconName = result.iconName;
    } catch (error) {
      console.error("Failed to suggest an icon on update, using default. Error:", error);
    }
    
    categoriesStore.set(prev => prev.map(c => 
      c.id === categoryId ? { ...c, ...updatedData, id: newId, icon: iconName } : c
    ));

    // Update prayers with the new category ID
    if (newId !== categoryId) {
        prayersStore.set(prev => prev.map(p => 
            p.categoryId === categoryId ? { ...p, categoryId: newId } : p
        ));
    }
  };
  
  const deleteCategory = (categoryId: string) => {
    categoriesStore.set(prev => prev.filter(c => c.id !== categoryId));
    // Also delete prayers in that category
    prayersStore.set(prev => prev.filter(p => p.categoryId !== categoryId));
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
    setGoal: goalStore.set,
    categorySuggestion,
    resolveSuggestion,
  };
};
