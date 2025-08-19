
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
  id: string;
  title: string;
  createdAt: string;
  sourceType: 'text' | 'image' | 'audio' | 'live' | 'document';
  sourceData?: string; // Data URI for image/audio/document
  notes: string; // Full transcribed text
  prayerPoints: { point: string; bibleVerse: string; }[];
  categoryId?: string;
  duration?: number; // Duration in seconds for prayer walks
}

export interface Goal {
    dailyPrayerTime: number; // in minutes
}
