"use client";

import React, { useState } from 'react';
import { usePrayerStore } from '@/hooks/use-prayer-store';
import { Button } from '@/components/ui/button';
import { PlusCircle } from 'lucide-react';
import { AddCategoryDialog } from './add-category-dialog';
import { CategoryCard } from './category-card';
import { ScrollArea } from './ui/scroll-area';
import { Skeleton } from './ui/skeleton';
import { PrayerList } from './prayer-list';
import { Card, CardContent } from './ui/card';

export function Dashboard() {
  const { categories, prayers, isLoaded } = usePrayerStore();
  const [isCategoryDialogOpen, setIsCategoryDialogOpen] = useState(false);
  const [selectedView, setSelectedView] = useState<string | null>(null);

  const answeredCount = prayers.filter(p => p.status === 'answered').length;
  const allActiveCount = prayers.filter(p => p.status === 'active').length;

  if (selectedView) {
    return <PrayerList view={selectedView} onBack={() => setSelectedView(null)} />;
  }

  return (
    <div className="flex flex-col min-h-screen">
      <header className="flex items-center justify-between p-4 border-b bg-background/80 backdrop-blur-sm sticky top-0 z-10">
        <h1 className="text-xl font-bold font-headline">My Prayer Library</h1>
        <div className="w-10" />
      </header>

      <main className="flex-1">
        <ScrollArea className="h-[calc(100vh-129px)] md:h-[calc(100vh-65px)]">
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
                  onClick={() => setSelectedView('all')}
                />
                <CategoryCard
                  name="Answered"
                  icon="CheckCircle"
                  count={answeredCount}
                  onClick={() => setSelectedView('answered')}
                />
                {categories.map(category => (
                  <CategoryCard
                    key={category.id}
                    name={category.name}
                    icon={category.icon}
                    count={prayers.filter(p => p.categoryId === category.id && p.status === 'active').length}
                    onClick={() => setSelectedView(category.id)}
                  />
                ))}
                <Card
                  className="shadow-md hover:shadow-lg transition-shadow duration-300 cursor-pointer border-dashed border-2 hover:border-primary"
                  onClick={() => setIsCategoryDialogOpen(true)}
                >
                  <CardContent className="p-4 flex flex-col items-center justify-center h-full text-primary">
                    <PlusCircle className="h-8 w-8" />
                    <h3 className="text-lg font-semibold mt-2">Add Category</h3>
                  </CardContent>
                </Card>
              </div>
            )}
          </div>
        </ScrollArea>
      </main>

      <AddCategoryDialog open={isCategoryDialogOpen} onOpenChange={setIsCategoryDialogOpen} />
    </div>
  );
}
