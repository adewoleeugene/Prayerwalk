"use client";

import React from 'react';
import { usePrayerStore } from '@/hooks/use-prayer-store';
import { PrayerCard } from './prayer-card';
import { ScrollArea } from './ui/scroll-area';
import { Button } from './ui/button';
import Link from 'next/link';
import { Footprints } from 'lucide-react';
import { Skeleton } from './ui/skeleton';

type PrayerListProps = {
  view: string;
};

export function PrayerList({ view }: PrayerListProps) {
  const { prayers, isLoaded } = usePrayerStore();

  const filteredPrayers = prayers.filter(p => {
    if (view === 'all') return p.status === 'active';
    if (view === 'answered') return p.status === 'answered';
    return p.categoryId === view && p.status === 'active';
  });
  
  const showPrayerWalkButton = view !== 'all' && view !== 'answered' && filteredPrayers.length > 0;

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
    <ScrollArea className="h-[calc(100vh-65px)]">
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
          <div className="flex flex-col items-center justify-center h-[60vh] text-center text-muted-foreground">
             <p className="text-lg font-medium">No prayer points here yet.</p>
             <p className="text-sm">Add a new prayer point or use the Capture tool.</p>
          </div>
        )}
      </div>
    </ScrollArea>
  );
}
