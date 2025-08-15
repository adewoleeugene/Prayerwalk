"use client";

import React, { useState, useEffect } from 'react';
import { usePrayerStore } from '@/hooks/use-prayer-store';
import { Prayer } from '@/lib/types';
import { useParams, useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { ChevronLeft, ChevronRight, Square, Loader2 } from 'lucide-react';
import { Progress } from '@/components/ui/progress';

export default function PrayerWalkPage() {
  const router = useRouter();
  const params = useParams();
  const categoryId = params.category as string;
  
  const { prayers, categories, isLoaded } = usePrayerStore();
  const [sessionPrayers, setSessionPrayers] = useState<Prayer[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [elapsedTime, setElapsedTime] = useState(0);

  const category = categories.find(c => c.id === categoryId);

  useEffect(() => {
    if (isLoaded) {
      const filtered = prayers.filter(p => p.categoryId === categoryId && p.status === 'active');
      setSessionPrayers(filtered);
    }
  }, [isLoaded, prayers, categoryId]);

  useEffect(() => {
    const timer = setInterval(() => {
      setElapsedTime(prev => prev + 1);
    }, 1000);
    return () => clearInterval(timer);
  }, []);
  
  if (!isLoaded) {
    return (
        <div className="flex flex-col items-center justify-center h-screen gap-4">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
            <p>Loading your prayer walk...</p>
        </div>
    );
  }
  
  if (sessionPrayers.length === 0) {
      return (
          <div className="flex flex-col items-center justify-center h-screen gap-4 p-4 text-center">
              <p className="text-lg">No active prayers in this category to start a walk.</p>
              <Button onClick={() => router.back()}>Go Back</Button>
          </div>
      );
  }

  const currentPrayer = sessionPrayers[currentIndex];
  const progress = ((currentIndex + 1) / sessionPrayers.length) * 100;
  
  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60).toString().padStart(2, '0');
    const secs = (seconds % 60).toString().padStart(2, '0');
    return `${mins}:${secs}`;
  }

  const goNext = () => setCurrentIndex(prev => (prev + 1));
  const goPrev = () => setCurrentIndex(prev => (prev - 1));

  if (currentIndex >= sessionPrayers.length) {
    return (
        <div className="flex flex-col items-center justify-center h-screen gap-4 p-4 text-center">
            <h1 className="text-3xl font-bold font-headline">Prayer Walk Complete!</h1>
            <p className="text-lg">You've gone through all your prayer points for {category?.name}.</p>
            <p>Total time: {formatTime(elapsedTime)}</p>
            <Button onClick={() => router.back()}>Finish</Button>
        </div>
    );
  }

  return (
    <div className="flex flex-col h-screen bg-background p-4 md:p-8">
      <header className="flex items-center justify-between mb-4">
        <h1 className="text-2xl font-bold font-headline">{category?.name} Prayer Walk</h1>
        <div className="text-lg font-semibold tabular-nums">{formatTime(elapsedTime)}</div>
      </header>

      <Progress value={progress} className="w-full mb-8" />
      
      <main className="flex-1 flex items-center justify-center">
        <Card className="w-full max-w-2xl shadow-xl animate-in fade-in zoom-in-95">
          <CardHeader>
            <CardTitle className="text-3xl md:text-4xl text-center">{currentPrayer.title}</CardTitle>
            {currentPrayer.bibleVerse && (
              <CardDescription className="text-center text-md pt-2">
                {currentPrayer.bibleVerse}
              </CardDescription>
            )}
          </CardHeader>
          {currentPrayer.notes && (
            <CardContent>
                <p className="text-center text-muted-foreground italic">"{currentPrayer.notes}"</p>
            </CardContent>
          )}
        </Card>
      </main>

      <footer className="grid grid-cols-3 items-center gap-4 mt-8">
        <Button variant="outline" size="lg" onClick={goPrev} disabled={currentIndex === 0}>
          <ChevronLeft className="h-6 w-6 md:mr-2"/>
          <span className="hidden md:inline">Prev</span>
        </Button>
        <Button variant="destructive" size="lg" onClick={() => router.back()}>
          <Square className="h-5 w-5 md:mr-2" />
          <span className="hidden md:inline">End Walk</span>
        </Button>
        <Button size="lg" onClick={goNext}>
          <span className="hidden md:inline">{currentIndex === sessionPrayers.length - 1 ? "Finish" : "Next"}</span>
          <ChevronRight className="h-6 w-6 md:ml-2" />
        </Button>
      </footer>
    </div>
  );
}
