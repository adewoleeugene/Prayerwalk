
"use client";

import React, { useState, useEffect } from 'react';
import { usePrayerStore } from '@/hooks/use-prayer-store';
import { Prayer } from '@/lib/types';
import { useParams, useRouter, useSearchParams } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { ChevronLeft, ChevronRight, Square, Loader2, CheckCircle, Edit } from 'lucide-react';
import { Progress } from '@/components/ui/progress';
import { PrayerFormDialog } from '@/components/prayer-form-dialog';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useToast } from '@/hooks/use-toast';

export default function PrayerWalkPage() {
  const router = useRouter();
  const params = useParams();
  const searchParams = useSearchParams();
  const categoryId = params.category as string;
  
  const { prayers, categories, isLoaded, togglePrayerStatus } = usePrayerStore();
  const { toast } = useToast();
  const [sessionPrayers, setSessionPrayers] = useState<Prayer[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [elapsedTime, setElapsedTime] = useState(0);
  const [sessionTitle, setSessionTitle] = useState("Prayer Walk");
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [selectedPrayer, setSelectedPrayer] = useState<Prayer | undefined>(undefined);

  useEffect(() => {
    if (isLoaded) {
      let filtered: Prayer[] = [];
      if (categoryId === 'shuffle') {
        const allActive = prayers.filter(p => p.status === 'active');
        // Simple shuffle algorithm
        filtered = allActive.sort(() => Math.random() - 0.5);
        setSessionTitle("Shuffled Prayer Walk");
      } else if (categoryId === 'custom') {
        const customPrayerIds = searchParams.get('ids')?.split(',') || [];
        if(customPrayerIds.length > 0) {
            const prayerMap = new Map(prayers.map(p => [p.id, p]));
            filtered = customPrayerIds.map(id => prayerMap.get(id)).filter((p): p is Prayer => !!p);
        }
        setSessionTitle("Custom Prayer Walk");
      } else {
        filtered = prayers.filter(p => p.categoryId === categoryId && p.status === 'active');
        const category = categories.find(c => c.id === categoryId);
        setSessionTitle(`${category?.name || 'Category'} Prayer Walk`);
      }
      setSessionPrayers(filtered);
    }
  }, [isLoaded, prayers, categories, categoryId, searchParams]);

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
              <p className="text-lg">No active prayers found for this session.</p>
              <Button onClick={() => router.back()}>Go Back</Button>
          </div>
      );
  }

  const currentPrayer = sessionPrayers[currentIndex];
  const progress = ((currentIndex + 1) / sessionPrayers.length) * 100;
  
  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = (seconds % 60).toString().padStart(2, '0');
    if (mins > 0) {
        return `${mins}m ${secs}s`;
    }
    return `${secs}s`;
  }

  const goNext = () => setCurrentIndex(prev => (prev + 1));
  const goPrev = () => setCurrentIndex(prev => (prev - 1));

  const handleEditClick = (prayer: Prayer) => {
    setSelectedPrayer(prayer);
    setIsFormOpen(true);
  }

  const handleMarkAnswered = (prayer: Prayer) => {
      togglePrayerStatus(prayer.id);
      toast({
          title: "Prayer Answered!",
          description: `"${prayer.title}" has been marked as answered.`
      });
  }

  if (currentIndex >= sessionPrayers.length) {
    return (
        <div className="flex flex-col h-screen bg-background">
          <header className="p-4 text-center border-b">
            <h1 className="text-3xl font-bold font-headline">Prayer Walk Complete!</h1>
            <p className="text-muted-foreground mt-2">
              You prayed for {formatTime(elapsedTime)} through {sessionPrayers.length} prayer points.
            </p>
          </header>

          <ScrollArea className="flex-1">
            <main className="p-4 md:p-6 space-y-4">
                {sessionPrayers.map(prayer => (
                    <Card key={prayer.id} className="shadow-sm">
                        <CardHeader>
                            <CardTitle className="text-lg">{prayer.title}</CardTitle>
                        </CardHeader>
                        <CardFooter className="flex justify-end gap-2">
                             <Button variant="outline" size="sm" onClick={() => handleEditClick(prayer)}>
                                <Edit className="h-4 w-4 mr-2" />
                                Add Note / Edit
                            </Button>
                            {prayer.status === 'active' && (
                                <Button variant="outline" size="sm" className="text-green-600" onClick={() => handleMarkAnswered(prayer)}>
                                    <CheckCircle className="h-4 w-4 mr-2" />
                                    Mark as Answered
                                </Button>
                            )}
                        </CardFooter>
                    </Card>
                ))}
            </main>
          </ScrollArea>
          
          <footer className="p-4 border-t bg-background">
            <Button onClick={() => router.push('/')} className="w-full" size="lg">Finish</Button>
          </footer>
          
          <PrayerFormDialog 
            open={isFormOpen} 
            onOpenChange={setIsFormOpen} 
            prayerToEdit={selectedPrayer}
          />
        </div>
    );
  }

  return (
    <div className="flex flex-col h-screen bg-background p-4 md:p-8">
      <header className="flex items-center justify-between mb-4">
        <h1 className="text-2xl font-bold font-headline">{sessionTitle}</h1>
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
       <PrayerFormDialog 
        open={isFormOpen} 
        onOpenChange={setIsFormOpen} 
        prayerToEdit={selectedPrayer}
      />
    </div>
  );
}
