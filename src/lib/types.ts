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
