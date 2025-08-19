
"use client";

import React, { useEffect, useState, useMemo } from 'react';
import { usePrayerStore } from '@/hooks/use-prayer-store';
import { Prayer } from '@/lib/types';
import { useParams, useRouter, useSearchParams } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { ChevronLeft, ChevronRight, Loader2, ArrowLeft, Footprints } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import { useJournalStore } from '@/hooks/use-journal-store';
import { Carousel, CarouselContent, CarouselItem, CarouselNext, CarouselPrevious, type CarouselApi } from '@/components/ui/carousel';
import { cn } from '@/lib/utils';


export default function PrayerWalkPage() {
  const router = useRouter();
  const params = useParams();
  const searchParams = useSearchParams();
  const categoryId = params.category as string;
  const timingMode = searchParams.get('timingMode');
  const duration = parseInt(searchParams.get('duration') || '5', 10);
  
  const { prayers, categories, isLoaded } = usePrayerStore();
  const { setLastSessionDuration, addJournalEntry } = useJournalStore();
  const { toast } = useToast();

  const [sessionPrayers, setSessionPrayers] = useState<Prayer[]>([]);
  const [sessionTitle, setSessionTitle] = useState("Prayer Walk");
  const [sessionSubtitle, setSessionSubtitle] = useState("My Walk With God");
  const [isSessionEnded, setIsSessionEnded] = useState(false);
  const [startTime, setStartTime] = useState(0);
  const [elapsedTime, setElapsedTime] = useState(0);

  const [api, setApi] = React.useState<CarouselApi>()
  const [current, setCurrent] = React.useState(0)
  const [count, setCount] = React.useState(0)

  const [countdown, setCountdown] = useState<number | null>(null);

  useEffect(() => {
    if (!api) {
      return
    }
 
    setCount(api.scrollSnapList().length)
    setCurrent(api.selectedScrollSnap() + 1)
 
    api.on("select", () => {
      setCurrent(api.selectedScrollSnap() + 1)
      resetCountdown();
    })
  }, [api])

  const resetCountdown = () => {
    if (timingMode && sessionPrayers.length > 0) {
      if (timingMode === 'per_prayer') {
        setCountdown(duration * 60);
      } else if (timingMode === 'total') {
        const timePerPrayer = Math.floor((duration * 60) / sessionPrayers.length);
        setCountdown(timePerPrayer > 0 ? timePerPrayer : 1);
      }
    }
  };

  useEffect(() => {
    let timer: NodeJS.Timeout;
    if (startTime && !isSessionEnded) {
      timer = setInterval(() => {
        setElapsedTime(Math.floor((Date.now() - startTime) / 1000));
      }, 1000);
    }
    return () => clearInterval(timer);
  }, [startTime, isSessionEnded]);

  useEffect(() => {
    let countdownTimer: NodeJS.Timeout;
    if (countdown !== null && countdown > 0 && !isSessionEnded) {
      countdownTimer = setInterval(() => {
        setCountdown(prev => (prev ? prev - 1 : null));
      }, 1000);
    } else if (countdown === 0) {
        if(timingMode === 'per_prayer' && current < count) {
            api?.scrollNext();
        } else {
            handleEndSession();
        }
    }
    return () => clearInterval(countdownTimer);
  }, [countdown, isSessionEnded, api, current, count, timingMode]);


  React.useEffect(() => {
    if (isLoaded) {
      let filtered: Prayer[] = [];
      if (categoryId === 'shuffle') {
        const allActive = prayers.filter(p => p.status === 'active');
        filtered = allActive.sort(() => Math.random() - 0.5);
        setSessionTitle("Guided Walk");
        setSessionSubtitle("A shuffled prayer session")
      } else if (categoryId === 'custom') {
        const customPrayerIds = searchParams.get('ids')?.split(',') || [];
        if(customPrayerIds.length > 0) {
            const prayerMap = new Map(prayers.map(p => [p.id, p]));
            filtered = customPrayerIds.map(id => prayerMap.get(id)).filter((p): p is Prayer => !!p);
        }
        setSessionTitle("Custom Session");
        setSessionSubtitle(`${filtered.length} selected prayer points`)
      } else {
        filtered = prayers.filter(p => p.categoryId === categoryId && p.status === 'active');
        const category = categories.find(c => c.id === categoryId);
        setSessionTitle(category?.name || 'Category');
        setSessionSubtitle("My Walk With God");
      }
      
      setSessionPrayers(filtered);
      setStartTime(Date.now());
    }
  }, [isLoaded, prayers, categories, categoryId, searchParams]);

  useEffect(() => {
    resetCountdown();
  }, [sessionPrayers, timingMode, duration]);
  
  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    if (mins > 0) {
        return `${mins} minute${mins > 1 ? 's' : ''}${secs > 0 ? ` and ${secs} second${secs > 1 ? 's': ''}` : ''}`
    }
    return `${secs} second${secs > 1 ? 's': ''}`;
  }
  
  const formatTimer = (seconds: number) => {
    const mins = Math.floor(seconds / 60).toString().padStart(2, '0');
    const secs = (seconds % 60).toString().padStart(2, '0');
    return `${mins}:${secs}`;
  };

  const handleEndSession = () => {
    const finalElapsedTime = Math.floor((Date.now() - startTime) / 1000);
    setLastSessionDuration(finalElapsedTime);
    addJournalEntry({
      title: `${sessionTitle} Prayer Walk`,
      sourceType: 'live',
      notes: `Completed a prayer walk session for ${formatTime(finalElapsedTime)}.`,
      prayerPoints: sessionPrayers.slice(0, current).map(p => ({ point: p.title, bibleVerse: p.bibleVerse || '' })),
      categoryId: categoryId === 'shuffle' || categoryId === 'custom' ? undefined : categoryId,
      duration: finalElapsedTime,
    });
    setIsSessionEnded(true);
  };
  
  const SessionCompleteContent = () => {
      const finalElapsedTime = Math.floor((Date.now() - startTime) / 1000);
      return (
        <AlertDialogContent className="p-0 gap-0">
             <AlertDialogHeader className="text-center p-6 pb-4">
                <AlertDialogTitle className="text-3xl font-bold font-headline">Session Complete!</AlertDialogTitle>
                <AlertDialogDescription className="mt-2">
                     You prayed for {formatTime(finalElapsedTime)} through {current} prayer point(s).
                </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter className="p-4 pt-0">
                <AlertDialogAction onClick={() => router.push('/')} className="w-full">Finish</AlertDialogAction>
            </AlertDialogFooter>
        </AlertDialogContent>
      )
  }

  if (!isLoaded) {
    return (
        <div className="flex flex-col items-center justify-center h-screen gap-4">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
            <p>Loading your prayer walk...</p>
        </div>
    );
  }
  
  if (sessionPrayers.length === 0 && isLoaded) {
      return (
          <div className="flex flex-col items-center justify-center h-screen gap-4 p-4 text-center">
              <p className="text-lg">No active prayers found for this session.</p>
              <Button onClick={() => router.back()}>Go Back</Button>
          </div>
      );
  }

  return (
    <div className="flex flex-col h-screen bg-background p-4">
        {isSessionEnded ? (
             <div className="fixed inset-0 bg-background/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
                <AlertDialog open>
                    <SessionCompleteContent />
                </AlertDialog>
            </div>
        ) : (
        <>
            <header className="flex items-center justify-between mb-4">
                 <Button variant="ghost" size="icon" onClick={() => router.back()}>
                    <ArrowLeft />
                </Button>
                <h1 className="text-lg font-semibold font-headline">Prayer Session</h1>
                <Button variant="destructive" size="sm" onClick={handleEndSession}>End</Button>
            </header>
            
            <main className="flex-1 flex flex-col items-center justify-center space-y-6">
                <p className="text-5xl font-bold text-primary font-mono tabular-nums -mb-4 z-10">{formatTimer(countdown ?? elapsedTime)}</p>
                <div className="w-full max-w-md p-4 pt-12 bg-card rounded-2xl shadow-lg text-center">
                    <div className="flex justify-center mb-4">
                        <div className="w-20 h-20 bg-background rounded-full flex items-center justify-center">
                            <Footprints className="h-10 w-10 text-primary" />
                        </div>
                    </div>
                    <h2 className="text-2xl font-bold font-headline">{sessionTitle}</h2>
                    <p className="text-muted-foreground">{sessionSubtitle}</p>
                </div>
                
                <Carousel setApi={setApi} className="w-full max-w-md">
                    <CarouselContent>
                        {sessionPrayers.map((prayer) => (
                            <CarouselItem key={prayer.id}>
                                <Card className="shadow-lg">
                                    <CardContent className="p-6 text-center space-y-4">
                                        <p className="text-lg leading-relaxed">{prayer.title}</p>
                                        {prayer.bibleVerse && <p className="text-sm text-muted-foreground">{prayer.bibleVerse}</p>}
                                    </CardContent>
                                </Card>
                            </CarouselItem>
                        ))}
                    </CarouselContent>
                    <CarouselPrevious className="left-[-50px]" />
                    <CarouselNext className="right-[-50px]" />
                </Carousel>
            </main>

            <footer className="flex flex-col items-center justify-center gap-4 mt-auto pb-4">
                <div className="flex gap-2">
                    {Array.from({ length: count }).map((_, i) => (
                        <Button
                            key={i}
                            size="icon"
                            variant="ghost"
                            className={cn("h-2 w-2 rounded-full p-0", i === current - 1 ? 'bg-primary' : 'bg-primary/20')}
                            onClick={() => api?.scrollTo(i)}
                        />
                    ))}
                </div>
                 <div className="grid grid-cols-2 w-full max-w-xs gap-4">
                     <Button variant="outline" onClick={() => api?.scrollPrev()} disabled={current === 1}>
                        <ChevronLeft className="h-4 w-4 mr-1" /> Prev
                    </Button>
                    <Button onClick={() => api?.scrollNext()} disabled={current === count}>
                        Next <ChevronRight className="h-4 w-4 ml-1" />
                    </Button>
                 </div>
            </footer>
        </>
        )}
    </div>
  );
}
