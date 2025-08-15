"use client";

import React from 'react';
import { usePrayerStore } from '@/hooks/use-prayer-store';
import { PrayerCard } from './prayer-card';
import { ScrollArea } from './ui/scroll-area';
import { Button } from './ui/button';
import Link from 'next/link';
import { ArrowLeft, Footprints } from 'lucide-react';
import { Skeleton } from './ui/skeleton';
import { getIcon } from './icons';

type PrayerListProps = {
  view: string;
  onBack: () => void;
};

export function PrayerList({ view, onBack }: PrayerListProps) {
  const { prayers, categories, isLoaded } = usePrayerStore();

  const filteredPrayers = prayers.filter(p => {
    if (view === 'all') return p.status === 'active';
    if (view === 'answered') return p.status === 'answered';
    return p.categoryId === view && p.status === 'active';
  });
  
  const showPrayerWalkButton = view !== 'all' && view !== 'answered' && filteredPrayers.length > 0;

  const category = categories.find(c => c.id === view);
  
  let viewTitle = 'Prayers';
  if(view === 'all') {
    viewTitle = 'All Active Prayers';
  } else if (view === 'answered') {
    viewTitle = 'Answered Prayers';
  } else if (category) {
    viewTitle = category.name;
  }
  
  const ViewIcon =
    view === 'all' ? getIcon('Sun') :
    view === 'answered' ? getIcon('CheckCircle') :
    getIcon(category?.icon || 'Default');


  if (!isLoaded) {
    return (
      <div className="p-4 md:p-6 space-y-4">
        <Skeleton className="h-28 w-full" />
        <Skeleton className="h-28 w-full" />
        <Skeleton className="h-28 w-full" />
      </div>
    );
  }

  return (
    <>
      <header className="flex items-center justify-between p-4 border-b bg-background/80 backdrop-blur-sm sticky top-0 z-10">
        <Button variant="ghost" size="icon" onClick={onBack}>
          <ArrowLeft />
        </Button>
        <div className="flex items-center gap-2">
            <ViewIcon className="h-5 w-5 text-muted-foreground" />
            <h1 className="text-xl font-bold font-headline truncate">{viewTitle}</h1>
        </div>
        <div className="w-10"/>
      </header>

      <ScrollArea className="h-[calc(100vh-129px)] md:h-[calc(100vh-65px)]">
        <div className="p-4 md:p-6">
          {showPrayerWalkButton && (
            <div className="mb-4">
              <Button asChild className="w-full" size="lg">
                <Link href={`/prayer-walk/${view}`}>
                  <Footprints className="mr-2 h-5 w-5" />
                  Start Prayer Walk
                </Link>
              </Button>
            </div>
          )}
          
          {filteredPrayers.length > 0 ? (
            <div className="space-y-4">
              {filteredPrayers.map((prayer) => (
                <PrayerCard key={prayer.id} prayer={prayer} />
              ))}
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center h-[calc(100vh-200px)] text-center text-muted-foreground">
              <p className="text-lg font-medium">No prayer points here yet.</p>
              <p className="text-sm">Add a new prayer point or use the Capture tool.</p>
            </div>
          )}
        </div>
      </ScrollArea>
    </>
  );
}
