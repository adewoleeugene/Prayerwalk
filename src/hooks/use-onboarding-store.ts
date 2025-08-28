"use client";

import { useState, useEffect } from 'react';

export interface UserGoal {
  id: string;
  title: string;
  description: string;
  targetValue: number;
  targetUnit: 'minutes' | 'sessions' | 'days' | 'prayers';
  timeframe: 'daily' | 'weekly' | 'monthly';
  isActive: boolean;
  createdAt: string;
}

export interface OnboardingStep {
  id: string;
  title: string;
  description: string;
  isCompleted: boolean;
  isOptional: boolean;
}

export interface OnboardingPreferences {
  primaryObjective: 'deepen_faith' | 'build_consistency' | 'prayer_variety' | 'spiritual_community' | '';
  preferredPrayerTime: 'morning' | 'afternoon' | 'evening' | 'flexible' | '';
  notificationsEnabled: boolean;
}

export interface OnboardingState {
  isOnboardingCompleted: boolean;
  currentStep: number;
  steps: OnboardingStep[];
  goals: UserGoal[];
  preferences: OnboardingPreferences;
}

const ONBOARDING_STORAGE_KEY = 'prayersmart-onboarding';
const GOALS_STORAGE_KEY = 'prayersmart-goals';
const PREFERENCES_STORAGE_KEY = 'prayersmart-preferences';

const defaultSteps: OnboardingStep[] = [
  {
    id: 'welcome',
    title: 'Welcome to PraySmart',
    description: 'Let\'s get you started on your prayer journey',
    isCompleted: false,
    isOptional: false,
  },

  {
    id: 'goals',
    title: 'Create Your Goals',
    description: 'Set measurable targets for your prayer life',
    isCompleted: false,
    isOptional: false,
  },
  {
    id: 'preferences',
    title: 'Customize Your Experience',
    description: 'Tell us about your prayer preferences',
    isCompleted: false,
    isOptional: true,
  },
  {
    id: 'complete',
    title: 'You\'re All Set!',
    description: 'Start your prayer journey with confidence',
    isCompleted: false,
    isOptional: false,
  },
];

const initialPreferences: OnboardingPreferences = {
  primaryObjective: '',
  preferredPrayerTime: '',
  notificationsEnabled: true,
};

const initialOnboardingState = {
  isOnboardingCompleted: false,
  currentStep: 0,
  steps: defaultSteps,
};

// Store implementation
// Helper function to safely access localStorage
function getStoredValue<T>(key: string, defaultValue: T): T {
  if (typeof window === 'undefined') return defaultValue;
  try {
    const item = localStorage.getItem(key);
    return item ? JSON.parse(item) : defaultValue;
  } catch {
    return defaultValue;
  }
}

// Helper function to safely set localStorage
function setStoredValue<T>(key: string, value: T): void {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch (error) {
    console.error(`Failed to save '${key}' to localStorage`, error);
  }
}

export const useOnboardingStore = () => {
  const [onboardingState, setOnboardingState] = useState(() => 
    getStoredValue(ONBOARDING_STORAGE_KEY, initialOnboardingState)
  );
  
  const [goals, setGoals] = useState<UserGoal[]>(() => 
    getStoredValue(GOALS_STORAGE_KEY, [])
  );
  
  const [preferences, setPreferences] = useState<OnboardingPreferences>(() => 
    getStoredValue(PREFERENCES_STORAGE_KEY, initialPreferences)
  );

  // Sync with localStorage when state changes
  useEffect(() => {
    setStoredValue(ONBOARDING_STORAGE_KEY, onboardingState);
  }, [onboardingState]);

  useEffect(() => {
    setStoredValue(GOALS_STORAGE_KEY, goals);
  }, [goals]);

  useEffect(() => {
    setStoredValue(PREFERENCES_STORAGE_KEY, preferences);
  }, [preferences]);

  const setCurrentStep = (step: number) => {
    setOnboardingState({
      ...onboardingState,
      currentStep: step,
    });
  };

  const completeStep = (stepId: string) => {
    setOnboardingState({
      ...onboardingState,
      steps: onboardingState.steps.map((step) =>
        step.id === stepId ? { ...step, isCompleted: true } : step
      ),
    });
  };

  const completeOnboarding = () => {
    setOnboardingState({
      ...onboardingState,
      isOnboardingCompleted: true,
      currentStep: onboardingState.steps.length - 1,
      steps: onboardingState.steps.map((step) => ({ ...step, isCompleted: true })),
    });
  };

  const resetOnboarding = () => {
    setOnboardingState(initialOnboardingState);
    setGoals([]);
    setPreferences(initialPreferences);
  };

  const addGoal = (goalData: Omit<UserGoal, 'id' | 'createdAt'>) => {
    const newGoal: UserGoal = {
      ...goalData,
      id: crypto.randomUUID(),
      createdAt: new Date().toISOString(),
    };
    setGoals([...goals, newGoal]);
  };

  const updateGoal = (id: string, updates: Partial<UserGoal>) => {
    setGoals(
      goals.map((goal) => (goal.id === id ? { ...goal, ...updates } : goal))
    );
  };

  const removeGoal = (id: string) => {
    setGoals(goals.filter((goal) => goal.id !== id));
  };

  const updatePreferences = (updates: Partial<OnboardingPreferences>) => {
    setPreferences({ ...preferences, ...updates });
  };

  return {
    // State
    isOnboardingCompleted: onboardingState.isOnboardingCompleted,
    currentStep: onboardingState.currentStep,
    steps: onboardingState.steps,
    goals,
    preferences,
    
    // Actions
    setCurrentStep,
    completeStep,
    completeOnboarding,
    resetOnboarding,
    addGoal,
    updateGoal,
    removeGoal,
    updatePreferences,
  };
};