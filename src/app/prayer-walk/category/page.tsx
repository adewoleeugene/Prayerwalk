
"use client";

import React from 'react';
import { usePrayerStore } from '@/hooks/use-prayer-store';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { ArrowLeft, Footprints } from 'lucide-react';
import { getIcon } from '@/components/icons';
import { ScrollArea } from '@/components/ui/scroll-area';

export function PrayerWalkCategorySelection() {
  const router = useRouter();
  const { categories, prayers, isLoaded } = usePrayerStore();

  const activeCategories = categories.filter(category => 
    prayers.some(p => p.categoryId === category.id && p.status === 'active')
  );

  return (
    <div className="flex flex-col h-screen">
      <header className="flex items-center justify-between p-4 border-b bg-background/80 backdrop-blur-sm sticky top-0 z-10">
        <Button variant="ghost" size="icon" onClick={() => router.back()}>
          <ArrowLeft />
        </Button>
        <h1 className="text-xl font-bold font-headline">Choose a Category</h1>
        <div className="w-10"/>
      </header>

      <ScrollArea className="flex-1">
        <main className="p-4 md:p-6">
          <div className="text-center mb-6">
            <p className="text-muted-foreground">Select a category to begin your guided prayer walk.</p>
          </div>

          {isLoaded && activeCategories.length > 0 ? (
            <div className="space-y-4">
              {activeCategories.map(category => {
                const Icon = getIcon(category.icon);
                const prayerCount = prayers.filter(p => p.categoryId === category.id && p.status === 'active').length;
                return (
                  <Card 
                    key={category.id} 
                    className="shadow-md hover:shadow-lg transition-shadow duration-300 cursor-pointer"
                    onClick={() => router.push(`/prayer-walk/${category.id}`)}
                  >
                    <CardContent className="p-4 flex items-center justify-between">
                      <div className="flex items-center gap-4">
                        <div className="p-2 bg-primary/10 rounded-lg">
                          <Icon className="h-6 w-6 text-primary" />
                        </div>
                        <div>
                          <h3 className="text-lg font-semibold">{category.name}</h3>
                          <p className="text-sm text-muted-foreground">{prayerCount} prayer(s)</p>
                        </div>
                      </div>
                      <Footprints className="h-6 w-6 text-primary" />
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center h-[calc(100vh-250px)] text-center text-muted-foreground">
              <p className="text-lg font-medium">No active prayers found.</p>
              <p className="text-sm">Add some prayer points to a category to start a prayer walk.</p>
            </div>
          )}
        </main>
      </ScrollArea>
    </div>
  );
}

export default PrayerWalkCategorySelection;
