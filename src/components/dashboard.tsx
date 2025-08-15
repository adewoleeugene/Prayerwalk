"use client";

import React, { useState } from 'react';
import { usePrayerStore } from '@/hooks/use-prayer-store';
import { Button } from '@/components/ui/button';
import { FolderPlus, LogOut } from 'lucide-react';
import { AddCategoryDialog } from './add-category-dialog';
import { useAuth } from '@/hooks/use-auth';
import { CategoryCard } from './category-card';
import { ScrollArea } from './ui/scroll-area';
import { Skeleton } from './ui/skeleton';

type DashboardProps = {
  onSelectView: (viewId: string) => void;
};

export function Dashboard({ onSelectView }: DashboardProps) {
  const { categories, prayers, isLoaded } = usePrayerStore();
  const { signOut } = useAuth();
  const [isCategoryDialogOpen, setIsCategoryDialogOpen] = useState(false);

  const answeredCount = prayers.filter(p => p.status === 'answered').length;
  const allActiveCount = prayers.filter(p => p.status === 'active').length;

  return (
    <div className="flex flex-col min-h-screen">
      <header className="flex items-center justify-between p-4 border-b bg-background/80 backdrop-blur-sm sticky top-0 z-10">
        <h1 className="text-xl font-bold font-headline">My Prayer Board</h1>
        <div className="flex items-center gap-2">
            <Button variant="ghost" size="icon" onClick={() => setIsCategoryDialogOpen(true)}>
                <FolderPlus />
                <span className="sr-only">Add Category</span>
            </Button>
            <Button variant="ghost" size="icon" onClick={signOut}>
                <LogOut />
                <span className="sr-only">Sign Out</span>
            </Button>
        </div>
      </header>

      <main className="flex-1">
        <ScrollArea className="h-[calc(100vh-65px)]">
          <div className="p-4 md:p-6">
            {!isLoaded ? (
              <div className="grid grid-cols-2 gap-4">
                  <Skeleton className="h-24 w-full" />
                  <Skeleton className="h-24 w-full" />
                  <Skeleton className="h-24 w-full" />
                  <Skeleton className="h-24 w-full" />
              </div>
            ) : (
              <div className="grid grid-cols-2 gap-4">
                <CategoryCard
                  name="All Prayers"
                  icon="Sun"
                  count={allActiveCount}
                  onClick={() => onSelectView('all')}
                />
                <CategoryCard
                  name="Answered"
                  icon="CheckCircle"
                  count={answeredCount}
                  onClick={() => onSelectView('answered')}
                />
                {categories.map(category => (
                  <CategoryCard
                    key={category.id}
                    name={category.name}
                    icon={category.icon}
                    count={prayers.filter(p => p.categoryId === category.id && p.status === 'active').length}
                    onClick={() => onSelectView(category.id)}
                  />
                ))}
              </div>
            )}
          </div>
        </ScrollArea>
      </main>

      <AddCategoryDialog open={isCategoryDialogOpen} onOpenChange={setIsCategoryDialogOpen} />
    </div>
  );
}
