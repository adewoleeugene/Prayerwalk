
"use client";

import React, { useState, useMemo } from 'react';
import { usePrayerStore } from '@/hooks/use-prayer-store';
import { Prayer } from '@/lib/types';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { ArrowLeft, Loader2 } from 'lucide-react';
import { getIcon } from '@/components/icons';

export default function CustomSessionPage() {
  const router = useRouter();
  const { prayers, categories, isLoaded } = usePrayerStore();
  const [selectedPrayers, setSelectedPrayers] = useState<Set<string>>(new Set());

  const activePrayersByCat = useMemo(() => {
    if (!isLoaded) return {};
    
    const activePrayers = prayers.filter(p => p.status === 'active');
    const grouped: { [key: string]: Prayer[] } = {};

    activePrayers.forEach(prayer => {
      if (!grouped[prayer.categoryId]) {
        grouped[prayer.categoryId] = [];
      }
      grouped[prayer.categoryId].push(prayer);
    });

    return grouped;
  }, [prayers, isLoaded]);

  const togglePrayer = (prayerId: string) => {
    setSelectedPrayers(prev => {
      const newSet = new Set(prev);
      if (newSet.has(prayerId)) {
        newSet.delete(prayerId);
      } else {
        newSet.add(prayerId);
      }
      return newSet;
    });
  };

  const handleStartSession = () => {
    const ids = Array.from(selectedPrayers).join(',');
    router.push(`/prayer-walk/setup?mode=custom&ids=${ids}&count=${selectedPrayers.size}`);
  };

  if (!isLoaded) {
    return (
      <div className="flex flex-col items-center justify-center h-screen gap-4">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
        <p>Loading prayers...</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-screen">
      <header className="flex items-center justify-between p-4 border-b bg-background/80 backdrop-blur-sm sticky top-0 z-10">
        <Button variant="ghost" size="icon" onClick={() => router.back()}>
          <ArrowLeft />
        </Button>
        <h1 className="text-xl font-bold font-headline">Create Custom Session</h1>
        <div className="w-10" />
      </header>
      
      <ScrollArea className="flex-1">
        <main className="p-4 md:p-6">
          <div className="text-center mb-6">
            <p className="text-muted-foreground">Select the prayer points you want to include in this session.</p>
          </div>
          
          <Accordion type="multiple" defaultValue={Object.keys(activePrayersByCat)} className="w-full">
            {categories.filter(c => activePrayersByCat[c.id]?.length > 0).map(category => {
              const Icon = getIcon(category.icon);
              return (
                <AccordionItem key={category.id} value={category.id}>
                  <AccordionTrigger>
                    <div className="flex items-center gap-2">
                        <Icon className="h-5 w-5" />
                        <span>{category.name} ({activePrayersByCat[category.id].length})</span>
                    </div>
                  </AccordionTrigger>
                  <AccordionContent>
                    <div className="space-y-2 pl-4">
                      {activePrayersByCat[category.id].map(prayer => (
                        <div 
                          key={prayer.id} 
                          className="flex items-center space-x-3 p-2 rounded-md border has-[:checked]:bg-secondary cursor-pointer"
                          onClick={() => togglePrayer(prayer.id)}
                        >
                            <Checkbox
                                id={`prayer-${prayer.id}`}
                                checked={selectedPrayers.has(prayer.id)}
                                onCheckedChange={() => togglePrayer(prayer.id)}
                            />
                            <label htmlFor={`prayer-${prayer.id}`} className="text-sm font-medium leading-none cursor-pointer">
                                {prayer.title}
                            </label>
                        </div>
                      ))}
                    </div>
                  </AccordionContent>
                </AccordionItem>
              )
            })}
          </Accordion>
        </main>
      </ScrollArea>
      
      {selectedPrayers.size > 0 && (
        <footer className="p-4 border-t bg-background sticky bottom-0">
          <Button 
            className="w-full" 
            size="lg"
            onClick={handleStartSession}
          >
            Start Walk with {selectedPrayers.size} prayer(s)
          </Button>
        </footer>
      )}
    </div>
  );
}
