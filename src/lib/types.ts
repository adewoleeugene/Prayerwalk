
import { z } from 'zod';

export interface Prayer {
  id: string;
  title: string;
  categoryId: string;
  bibleVerse?: string;
  notes?: string;
  status: 'active' | 'answered';
  createdAt: string;
}

export interface Category {
  id: string;
  name: string;
  icon: string;
}

export interface JournalEntry {
  id:string;
  title: string;
  createdAt: string;
  sourceType: 'text' | 'image' | 'audio' | 'live' | 'document';
  sourceData?: string; // Data URI for image/audio/document
  notes: string; // Full transcribed text
  prayerPoints: { point: string; bibleVerse: string; }[];
  categoryId?: string;
  duration?: number; // Duration in seconds for prayer walks
  qaHistory?: { question: string; answer: string; }[];
}

export interface Goal {
    dailyPrayerTime: number; // in minutes
}

export interface StreakData {
  currentStreak: number;
  longestStreak: number;
  lastPrayerDate: string | null; // ISO date string
  todayCompleted: boolean;
  streakHistory: StreakHistoryEntry[];
}

export interface StreakHistoryEntry {
  date: string; // ISO date string (YYYY-MM-DD)
  completed: boolean;
  prayerTimeMinutes: number; // Total prayer time in minutes for the day
  prayerCount: number; // Number of prayer sessions (kept for backward compatibility)
}



// Schemas for propose-category-flow
export const ProposeCategoryInputSchema = z.object({
  prayerPoints: z.array(z.string()).describe('A list of prayer points.'),
  categories: z.array(z.object({id: z.string(), name: z.string()})).describe('A list of available categories.'),
});
export type ProposeCategoryInput = z.infer<typeof ProposeCategoryInputSchema>;

export const ProposeCategoryOutputSchema = z.object({
  existingCategoryId: z.string().optional().describe('The ID of an existing category if a good match is found.'),
  newCategoryName: z.string().optional().describe('The name for a new category if no existing one is suitable.'),
});
export type ProposeCategoryOutput = z.infer<typeof ProposeCategoryOutputSchema>;
