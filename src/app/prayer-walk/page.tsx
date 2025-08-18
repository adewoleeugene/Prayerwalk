
"use client";

import React from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { ArrowLeft, Library, Shuffle, ListVideo } from 'lucide-react';
import { ScrollArea } from '@/components/ui/scroll-area';
import type { View } from '@/app/page';

export function PrayerWalkLobby() {
  const router = useRouter();

  const handleStartShuffle = () => {
    router.push(`/prayer-walk/setup?mode=shuffle`);
  };

  return (
    <div className="flex flex-col h-screen">
      <header className="flex items-center justify-between p-4 border-b bg-background/80 backdrop-blur-sm sticky top-0 z-10">
        <Button variant="ghost" size="icon" onClick={() => router.push('/')}>
          <ArrowLeft />
        </Button>
        <h1 className="text-xl font-bold font-headline">Start a Prayer Walk</h1>
        <div className="w-10"/>
      </header>

      <ScrollArea className="flex-1">
        <main className="p-4 md:p-6">
          <div className="text-center mb-6">
            <h2 className="text-2xl font-bold font-headline">Choose a Mode</h2>
            <p className="text-muted-foreground">How would you like to begin your prayer session?</p>
          </div>

          <div className="space-y-4">
            <Card 
              className="shadow-md hover:shadow-lg transition-shadow duration-300 cursor-pointer"
              onClick={() => router.push(`/prayer-walk/category`)}
            >
              <CardHeader>
                  <CardTitle className="flex items-center gap-3">
                      <Library className="h-6 w-6 text-primary" />
                      Pray by Category
                  </CardTitle>
                  <CardDescription>A quick, focused session on one of your categories.</CardDescription>
              </CardHeader>
            </Card>

             <Card 
                className="shadow-md hover:shadow-lg transition-shadow duration-300 cursor-pointer"
                onClick={() => router.push('/prayer-walk/custom')}
              >
              <CardHeader>
                  <CardTitle className="flex items-center gap-3 text-primary">
                      <ListVideo className="h-6 w-6" />
                      Create Custom Session
                  </CardTitle>
                  <CardDescription>Build a prayer "playlist" from multiple categories.</CardDescription>
              </CardHeader>
            </Card>

            <Card 
              className="shadow-md hover:shadow-lg transition-shadow duration-300 cursor-pointer"
              onClick={handleStartShuffle}
            >
              <CardHeader>
                  <CardTitle className="flex items-center gap-3 text-primary">
                      <Shuffle className="h-6 w-6" />
                      Guided Walk (Shuffle)
                  </CardTitle>
                  <CardDescription>Let the app create a randomized prayer list for you.</CardDescription>
              </CardHeader>
            </Card>
          </div>
        </main>
      </ScrollArea>
    </div>
  );
}

export default PrayerWalkLobby;
