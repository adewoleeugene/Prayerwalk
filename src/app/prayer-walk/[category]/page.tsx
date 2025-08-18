
"use client";

import React, { useEffect, useState, useMemo } from 'react';
import { usePrayerStore } from '@/hooks/use-prayer-store';
import { Prayer } from '@/lib/types';
import { useParams, useRouter, useSearchParams } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { ChevronLeft, ChevronRight, Square, Loader2, CheckCircle, Edit, Timer } from 'lucide-react';
import { Progress } from '@/components/ui/progress';
import { PrayerFormDialog } from '@/components/prayer-form-dialog';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useToast } from '@/hooks/use-toast';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { useJournalStore } from '@/hooks/use-journal-store';

export default function PrayerWalkPage() {
  const router = useRouter();
  const params = useParams();
  const searchParams = useSearchParams();
  const categoryId = params.category as string;
  
  const { prayers, categories, isLoaded, togglePrayerStatus } = usePrayerStore();
  const { setLastSessionDuration, addJournalEntry } = useJournalStore();
  const { toast } = useToast();

  const [sessionPrayers, setSessionPrayers] = useState<Prayer[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [selectedPrayer, setSelectedPrayer] = useState<Prayer | undefined>(undefined);
  const [sessionTitle, setSessionTitle] = useState("Prayer Walk");
  
  // Timer state
  const [timePerPrayer, setTimePerPrayer] = useState(300); // default 5 mins
  const [remainingTime, setRemainingTime] = useState(timePerPrayer);
  const [isSessionActive, setIsSessionActive] = useState(false);
  const [isSessionEnded, setIsSessionEnded] = useState(false);
  const [elapsedTime, setElapsedTime] = useState(0);

  React.useEffect(() => {
    if (isLoaded) {
      const timingMode = searchParams.get('timingMode') || 'per_prayer';
      const duration = parseInt(searchParams.get('duration') || '5', 10);
      
      let filtered: Prayer[] = [];
      if (categoryId === 'shuffle') {
        const allActive = prayers.filter(p => p.status === 'active');
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
      
      if (filtered.length > 0) {
        let newTimePerPrayer = 300; // Default
        if (timingMode === 'total' && filtered.length > 0) {
            newTimePerPrayer = Math.floor((duration * 60) / filtered.length);
        } else { // 'per_prayer'
            newTimePerPrayer = duration * 60;
        }
        setTimePerPrayer(newTimePerPrayer);
        setRemainingTime(newTimePerPrayer);
        setIsSessionActive(true);
      }
    }
  }, [isLoaded, prayers, categories, categoryId, searchParams]);

  useEffect(() => {
    let elapsedTimer: NodeJS.Timeout;
    let remainingTimer: NodeJS.Timeout;

    if (isSessionActive && !isSessionEnded) {
      elapsedTimer = setInterval(() => {
          setElapsedTime(prev => prev + 1);
      }, 1000);

      remainingTimer = setInterval(() => {
          setRemainingTime(prev => {
              if (prev > 1) return prev - 1;
              goNext(); // Automatically go to the next prayer when time is up
              return 0;
          });
      }, 1000);
    }

    return () => {
        clearInterval(elapsedTimer);
        clearInterval(remainingTimer);
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isSessionActive, isSessionEnded]);
  
  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    if (mins > 0) {
        return `${mins} minute${mins > 1 ? 's' : ''} ${secs > 0 ? `and ${secs} second${secs > 1 ? 's': ''}` : ''}`
    }
    return `${secs} second${secs > 1 ? 's': ''}`;
  }

  const formatCountdown = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = (seconds % 60).toString().padStart(2, '0');
    return `${mins}:${secs}`;
  }

  const addTime = (seconds: number) => {
      setRemainingTime(prev => prev + seconds);
  }

  const completeSession = () => {
    setIsSessionActive(false);
    setIsSessionEnded(true);
    setCurrentIndex(sessionPrayers.length);
    setLastSessionDuration(elapsedTime);
    addJournalEntry({
      title: sessionTitle,
      sourceType: 'live',
      notes: `Completed a prayer walk session for ${formatTime(elapsedTime)}.`,
      prayerPoints: sessionPrayers.slice(0, currentIndex + 1).map(p => ({ point: p.title, bibleVerse: p.bibleVerse || '' })),
      categoryId: categoryId,
      duration: elapsedTime,
    });
  }

  const goNext = () => {
    if (currentIndex < sessionPrayers.length - 1) {
        setCurrentIndex(prev => prev + 1);
        setRemainingTime(timePerPrayer);
    } else {
        completeSession();
    }
  };
  
  const goPrev = () => {
      if (currentIndex > 0) {
        setCurrentIndex(prev => prev - 1);
        setRemainingTime(timePerPrayer);
      }
  };

  const handleEditClick = (prayer: Prayer) => {
    setSelectedPrayer(prayer);
    setIsFormOpen(true);
  }

  const handleMarkAnswered = (prayerId: string) => {
      togglePrayerStatus(prayerId);
      const prayer = sessionPrayers.find(p => p.id === prayerId);
      if (prayer) {
        toast({
            title: "Prayer Answered!",
            description: `"${prayer.title}" has been marked as answered.`
        });
        setSessionPrayers(prev => prev.map(p => p.id === prayerId ? { ...p, status: 'answered' } : p));
      }
  }

  const handleEndSession = () => {
    completeSession();
  };
  
  const SessionCompleteContent = () => {
      const prayersPrayed = sessionPrayers.slice(0, Math.min(currentIndex, sessionPrayers.length));
      const answeredCount = prayersPrayed.filter(p => p.status === 'answered').length;

      return (
        <AlertDialogContent className="p-0 gap-0">
             <AlertDialogHeader className="text-center p-4 border-b">
                <AlertDialogTitle className="text-3xl font-bold font-headline">Prayer Walk Complete!</AlertDialogTitle>
                <AlertDialogDescription className="mt-2">
                     You prayed for {formatTime(elapsedTime)} through {prayersPrayed.length} prayer point(s). {answeredCount > 0 && `${answeredCount} prayer(s) were answered.`}
                </AlertDialogDescription>
            </AlertDialogHeader>

            <ScrollArea className="max-h-[50vh] -mx-6 px-2">
                <main className="py-4 space-y-4 px-4">
                    {prayersPrayed.map(prayer => (
                        <Card key={prayer.id} className="shadow-sm">
                            <CardHeader className="p-4">
                                <CardTitle className="text-md font-medium">{prayer.title}</CardTitle>
                            </CardHeader>
                            <CardFooter className="flex justify-end gap-2 p-2 pt-0">
                                <Button variant="outline" size="sm" onClick={() => handleEditClick(prayer)}>
                                    <Edit className="h-4 w-4 mr-2" />
                                    Add Note
                                </Button>
                                {prayer.status === 'active' ? (
                                    <Button variant="outline" size="sm" className="text-green-600 border-green-600/50 hover:bg-green-50 hover:text-green-700" onClick={() => handleMarkAnswered(prayer.id)}>
                                        <CheckCircle className="h-4 w-4 mr-2" />
                                        Answered
                                    </Button>
                                ) : (
                                    <Button variant="ghost" size="sm" disabled className="text-green-600">
                                        <CheckCircle className="h-4 w-4 mr-2" />
                                        Answered
                                    </Button>
                                )}
                            </CardFooter>
                        </Card>
                    ))}
                </main>
            </ScrollArea>

            <AlertDialogFooter className="p-4 border-t">
                <AlertDialogAction onClick={() => {
                    router.push('/');
                }} className="w-full">Finish</AlertDialogAction>
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

  const currentPrayer = sessionPrayers[currentIndex];
  const progress = ((currentIndex + 1) / sessionPrayers.length) * 100;
  
  if (!currentPrayer && !isSessionEnded) {
      return (
          <div className="flex flex-col items-center justify-center h-screen gap-4">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
              <p>Preparing your session...</p>
          </div>
      );
  }


  return (
    <div className="flex flex-col h-screen bg-background p-4 md:p-8">
        {isSessionEnded ? (
             <div className="fixed inset-0 bg-background/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
                <AlertDialog open>
                    <SessionCompleteContent />
                </AlertDialog>
            </div>
        ) : (
        <>
            <header className="flex items-center justify-between mb-4">
                <h1 className="text-2xl font-bold font-headline">{sessionTitle}</h1>
                <div className="text-lg font-semibold tabular-nums flex items-center gap-2">
                    <Timer className="h-5 w-5" />
                    {formatCountdown(remainingTime)}
                </div>
            </header>

            <Progress value={progress} className="w-full mb-4" />
            
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

            <div className="grid grid-cols-5 gap-2 my-4">
                    <Button variant="outline" size="sm" onClick={() => addTime(30)}>+30s</Button>
                    <Button variant="outline" size="sm" onClick={() => addTime(60)}>+1m</Button>
                    <Button variant="outline" size="sm" onClick={() => addTime(180)}>+3m</Button>
                    <Button variant="outline" size="sm" onClick={() => addTime(300)}>+5m</Button>
                    <Button variant="outline" size="sm" onClick={() => addTime(600)}>+10m</Button>
            </div>

            <footer className="grid grid-cols-3 items-center gap-4 mt-auto">
                <Button variant="outline" size="lg" onClick={goPrev} disabled={currentIndex === 0}>
                <ChevronLeft className="h-6 w-6 md:mr-2"/>
                <span className="hidden md:inline">Prev</span>
                </Button>
                
                <AlertDialog>
                    <AlertDialogTrigger asChild>
                        <Button variant="destructive" size="lg">
                            <Square className="h-5 w-5 md:mr-2" />
                            <span className="hidden md:inline">End Walk</span>
                        </Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent>
                        <AlertDialogHeader>
                            <AlertDialogTitle>End your prayer walk?</AlertDialogTitle>
                            <AlertDialogDescription>
                                This will end the current session. You can review your prayers before finishing.
                            </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                            <AlertDialogCancel>Cancel</AlertDialogCancel>
                            <AlertDialogAction onClick={handleEndSession}>End Walk</AlertDialogAction>
                        </AlertDialogFooter>
                    </AlertDialogContent>
                </AlertDialog>

                <Button size="lg" onClick={goNext}>
                <span className="hidden md:inline">{currentIndex === sessionPrayers.length - 1 ? "Finish" : "Next"}</span>
                <ChevronRight className="h-6 w-6 md:ml-2" />
                </Button>
            </footer>
        </>
        )}
       <PrayerFormDialog 
        open={isFormOpen} 
        onOpenChange={setIsFormOpen} 
        prayerToEdit={selectedPrayer}
      />
    </div>
  );
}
