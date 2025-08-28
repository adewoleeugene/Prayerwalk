
"use client";

import React, { useEffect, useState, useMemo, useRef, useCallback, Suspense } from 'react';
import { usePrayerStore } from '@/hooks/use-prayer-store';
import { useStreakStore } from '@/hooks/use-streak-store';
import { Prayer } from '@/lib/types';
import { useParams, useRouter, useSearchParams } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Textarea } from '@/components/ui/textarea';
import { ChevronLeft, ChevronRight, Loader2, ArrowLeft, Footprints, Check, Pause, Play, BookOpen, Volume2, VolumeX } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import { useJournalStore } from '@/hooks/use-journal-store';
import { Carousel, CarouselContent, CarouselItem, CarouselNext, CarouselPrevious, type CarouselApi } from '@/components/ui/carousel';
import { cn } from '@/lib/utils';
import { ScrollArea } from '@/components/ui/scroll-area';
import { getVerseText } from '@/ai/flows/get-verse-text';
import { cachedAIFlow } from '@/lib/ai-cache';
import { Skeleton } from '@/components/ui/skeleton';

const VerseDisplay = ({ reference }: { reference: string }) => {
  const [verseText, setVerseText] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchVerse = async () => {
      try {
        setIsLoading(true);
        setError(null);
        const result = await getVerseText({ reference });
         if (result && result.text) {
           setVerseText(result.text);
         } else {
           setError('Failed to load verse');
         }
      } catch (err) {
        console.error('Error fetching verse:', err);
        setError('Failed to load verse');
      } finally {
        setIsLoading(false);
      }
    };

    if (reference) {
      fetchVerse();
    }
  }, [reference]);

  if (isLoading) {
    return (
      <div className="space-y-2">
        <Skeleton className="h-4 w-full" />
        <Skeleton className="h-4 w-3/4" />
      </div>
    );
  }

  if (error || !verseText) {
    return (
      <div className="text-sm text-muted-foreground italic">
        <BookOpen className="h-4 w-4 inline mr-1" />
        {reference}
      </div>
    );
  }

  return (
    <div className="text-sm text-muted-foreground space-y-2">
      <p className="italic leading-relaxed">"{verseText}"</p>
      <p className="text-xs font-medium">{reference}</p>
    </div>
  );
};

function PrayerWalkPageContent() {
  const router = useRouter();
  const params = useParams();
  const searchParams = useSearchParams();
  const categoryId = params.category as string;
  const timingMode = searchParams.get('timingMode');
  const duration = parseInt(searchParams.get('duration') || '5', 10);
  
  const { prayers, categories, isLoaded, togglePrayerStatus, goal } = usePrayerStore();
  const { setLastSessionDuration, addJournalEntry } = useJournalStore();
  const { recordPrayerCompletion } = useStreakStore();
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
  const [isPaused, setIsPaused] = useState(false);
  const [intervalDuration, setIntervalDuration] = useState<number>(0);
  const [currentPrayerStartTime, setCurrentPrayerStartTime] = useState<number>(0);

  const audioRef = useRef<HTMLAudioElement | null>(null);
  const [audioEnabled, setAudioEnabled] = useState(false);
  const [soundNotificationsEnabled, setSoundNotificationsEnabled] = useState(true);
  const [userReflections, setUserReflections] = useState('');
  const [showReflectionInput, setShowReflectionInput] = useState(false);
  const audioEnabledRef = useRef(false);
  
  // Complete beep sound data URI (base64 encoded WAV) - working version from test page
  const beepSoundDataUri = "data:audio/wav;base64,UklGRnoGAABXQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YQoGAACBhYqFbF1fdJivrJBhNjVgodDbq2EcBj+a2/LDciUFLIHO8tiJNwgZaLvt559NEAxQp+PwtmMcBjiR1/LMeSwFJHfH8N2QQAoUXrTp66hVFApGn+DyvmwhBSuBzvLZiTYIG2m98OScTgwOUarm7blmGgU7k9n1unEiBC13yO/eizEIHWq+8+OWTAAAAAA=";

  useEffect(() => {
    if (!api) {
      return
    }
 
    setCount(api.scrollSnapList().length)
    setCurrent(api.selectedScrollSnap() + 1)
 
    api.on("select", () => {
      setCurrent(api.selectedScrollSnap() + 1);
      // Reset countdown for automatic rotation
      if (intervalDuration > 0) {
        setCountdown(intervalDuration);
        setCurrentPrayerStartTime(Date.now());
      }
      
      // Play sound on prayer change
      if (audioEnabledRef.current && soundNotificationsEnabled) {
        if (audioRef.current) {
          // Reset audio position before playing to prevent interruption errors
          audioRef.current.currentTime = 0;
          
          // Properly handle audio playbook promise
          const playPromise = audioRef.current.play();
          if (playPromise !== undefined) {
            playPromise.then(() => {
              // Audio played successfully
            }).catch((e: any) => {
              console.error("HTML5 audio failed, using Web Audio API:", e);
              // Fallback to Web Audio API
              createBeepSound();
            });
          }
        } else {
          // Use Web Audio API directly
          createBeepSound();
        }
      }
    })
  }, [api, soundNotificationsEnabled, intervalDuration])

  // Function to create beep using Web Audio API as fallback
  const createBeepSound = () => {
    try {
      const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
      const oscillator = audioContext.createOscillator();
      const gainNode = audioContext.createGain();
      
      oscillator.connect(gainNode);
      gainNode.connect(audioContext.destination);
      
      oscillator.frequency.setValueAtTime(800, audioContext.currentTime); // 800Hz beep
      gainNode.gain.setValueAtTime(0.3, audioContext.currentTime);
      gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.2);
      
      oscillator.start(audioContext.currentTime);
      oscillator.stop(audioContext.currentTime + 0.2);
    } catch (error) {
      console.error("Web Audio API failed:", error);
    }
  };

  // Function to toggle sound notifications
  const toggleSoundNotifications = () => {
    setSoundNotificationsEnabled(!soundNotificationsEnabled);
    toast({
      title: soundNotificationsEnabled ? "Sound Notifications Disabled" : "Sound Notifications Enabled",
      description: soundNotificationsEnabled 
        ? "You will no longer hear beeps when prayers change." 
        : "You will now hear beeps when prayers change.",
      variant: "default"
    });
  };

  // Function to enable audio with user interaction
  const enableAudio = async () => {
    if (audioRef.current) {
      try {
        // Test if audio can be played
        audioRef.current.currentTime = 0;
        const testPlayPromise = audioRef.current.play();
        if (testPlayPromise !== undefined) {
          await testPlayPromise;
          audioRef.current.pause();
          audioRef.current.currentTime = 0;
        }
        setAudioEnabled(true);
        audioEnabledRef.current = true;
        toast({
          title: "Audio Enabled",
          description: "You will now hear beeps when prayers change.",
          variant: "default"
        });
      } catch (error) {
        try {
          // Try Web Audio API as fallback
           createBeepSound();
           setAudioEnabled(true);
           audioEnabledRef.current = true;
          toast({
            title: "Audio Enabled (Web Audio)",
            description: "Using Web Audio API for beep sounds.",
            variant: "default"
          });
        } catch (webAudioError) {
          toast({
            title: "Audio Failed",
            description: "Unable to enable audio on this device.",
            variant: "destructive"
          });
        }
      }
    } else {
      // No HTML5 audio element, try Web Audio API directly
      try {
        createBeepSound();
        setAudioEnabled(true);
        audioEnabledRef.current = true;
        toast({
          title: "Audio Enabled (Web Audio)",
          description: "Using Web Audio API for beep sounds.",
          variant: "default"
        });
      } catch (error) {
        toast({
          title: "Audio Failed",
          description: "Unable to enable audio on this device.",
          variant: "destructive"
        });
      }
    }
  };

  const resetCountdown = () => {
    setCountdown(intervalDuration);
    setCurrentPrayerStartTime(Date.now());
  };

  useEffect(() => {
    if (startTime > 0 && !isSessionEnded && !isPaused && !showReflectionInput) {
      const interval = setInterval(() => {
        setElapsedTime(Math.floor((Date.now() - startTime) / 1000));
      }, 1000);
      return () => clearInterval(interval);
    }
  }, [startTime, isSessionEnded, isPaused, showReflectionInput]);

  useEffect(() => {
    if (countdown !== null && countdown > 0 && !isSessionEnded && !isPaused && !showReflectionInput) {
      const timer = setTimeout(() => {
        setCountdown(prev => {
          if (prev === null) return null;
          if (prev <= 1) {
            // Time's up - advance to next prayer automatically
            if (api && current < count) {
              api.scrollNext();
              return intervalDuration; // Reset countdown for next prayer
            } else {
              // All prayers completed - show reflection input
              setShowReflectionInput(true);
              return 0;
            }
          }
          return prev - 1;
        });
      }, 1000);
      return () => clearTimeout(timer);
    }
  }, [countdown, isSessionEnded, api, current, count, isPaused, showReflectionInput, intervalDuration]);


  React.useEffect(() => {
    if (!isLoaded || !prayers || !categories) return;

    const category = categories.find(cat => cat.id === categoryId);
    if (!category) {
      router.push('/prayer-walk');
      return;
    }

    const categoryPrayers = prayers.filter(prayer => prayer.categoryId === categoryId);
    
    // Get count from search params, default to 5
    const count = parseInt(searchParams.get('count') || '5', 10);
    
    // Shuffle and select prayers
    const shuffled = [...categoryPrayers].sort(() => Math.random() - 0.5);
    const selected = shuffled.slice(0, Math.min(count, categoryPrayers.length));
    
    setSessionPrayers(selected);
    setSessionTitle(category.name);
    setSessionSubtitle("My Walk With God");
    
    // Calculate interval duration for automatic rotation
    const totalDuration = duration * 60; // Total session time in seconds
    const prayerCount = selected.length;
    const calculatedInterval = Math.floor(totalDuration / prayerCount);
    
    setIntervalDuration(calculatedInterval);
    setCountdown(calculatedInterval); // Start with first interval
    setCurrentPrayerStartTime(Date.now());
  }, [isLoaded, prayers, categories, categoryId, searchParams]);

  useEffect(() => {
    setStartTime(Date.now());
  }, [sessionPrayers, timingMode, duration]);
  
  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const formatTimer = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const handleEndSession = () => {
    setShowReflectionInput(true);
  };

  const handleCompleteSession = () => {
    const sessionDuration = Math.floor((Date.now() - startTime) / 1000);
    const sessionDurationMinutes = Math.floor(sessionDuration / 60);
    setLastSessionDuration(sessionDuration);
    
    // Record prayer completion for streak tracking
    recordPrayerCompletion(sessionDurationMinutes, goal.dailyPrayerTime);
    
    // Add journal entry with user reflections
    const notes = userReflections.trim() 
      ? `Completed prayer walk: ${sessionTitle}. Duration: ${formatTime(sessionDuration)}. Prayers: ${sessionPrayers.length}\n\nReflections: ${userReflections}`
      : `Completed prayer walk: ${sessionTitle}. Duration: ${formatTime(sessionDuration)}. Prayers: ${sessionPrayers.length}`;
    
    addJournalEntry({
       title: `${sessionTitle} Prayer Walk`,
       sourceType: 'live' as const,
       notes: notes,
       prayerPoints: sessionPrayers.map(p => ({ point: p.title, bibleVerse: p.bibleVerse || '' })),
       categoryId: categoryId,
       duration: sessionDuration
     });
    
    setShowReflectionInput(false);
    setIsSessionEnded(true);
  };
  
  const ReflectionInputContent = () => {
    const sessionDuration = Math.floor((Date.now() - startTime) / 1000);
    // Calculate precise average time per prayer based on configured duration and prayer count
    const averageTimePerPrayer = sessionPrayers.length > 0 
      ? (timingMode === 'total' 
          ? Math.floor((duration * 60) / sessionPrayers.length) 
          : duration * 60)
      : 0;
    
    return (
      <AlertDialogContent className="max-w-md">
        <AlertDialogHeader>
          <AlertDialogTitle className="text-center flex items-center justify-center gap-2">
            <BookOpen className="h-6 w-6 text-primary" />
            Session Reflection
          </AlertDialogTitle>
          <AlertDialogDescription className="text-center space-y-4">
            <div className="bg-muted p-4 rounded-lg space-y-2">
              <p className="font-semibold">{sessionTitle}</p>
              <p className="text-sm text-muted-foreground">{sessionSubtitle}</p>
              <div className="grid grid-cols-3 gap-4 text-sm">
                <div>
                  <p className="font-medium">Duration</p>
                  <p className="text-muted-foreground">{formatTime(sessionDuration)}</p>
                </div>
                <div>
                  <p className="font-medium">Prayers</p>
                  <p className="text-muted-foreground">{sessionPrayers.length}</p>
                </div>
                <div>
                  <p className="font-medium">Avg/Prayer</p>
                  <p className="text-muted-foreground">{formatTime(averageTimePerPrayer)}</p>
                </div>
              </div>
            </div>
            <div className="text-left space-y-2">
              <p className="text-sm font-medium">Add your thoughts and reflections (optional):</p>
              <Textarea
                placeholder="What did God speak to you during this prayer time? Any insights, answers, or commitments you want to remember?"
                value={userReflections}
                onChange={(e) => setUserReflections(e.target.value)}
                className="min-h-[100px] resize-none"
              />
            </div>
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter className="flex-col gap-2">
          <AlertDialogAction 
            onClick={handleCompleteSession}
            className="w-full"
          >
            Complete Session
          </AlertDialogAction>
          <AlertDialogCancel 
            onClick={() => setShowReflectionInput(false)}
            className="w-full"
          >
            Continue Praying
          </AlertDialogCancel>
        </AlertDialogFooter>
      </AlertDialogContent>
    );
  };

  const SessionCompleteContent = () => {
    const sessionDuration = Math.floor((Date.now() - startTime) / 1000);
    // Calculate precise average time per prayer based on configured duration and prayer count
    const averageTimePerPrayer = sessionPrayers.length > 0 
      ? (timingMode === 'total' 
          ? Math.floor((duration * 60) / sessionPrayers.length) 
          : duration * 60)
      : 0;
    
    return (
      <AlertDialogContent className="max-w-md">
        <AlertDialogHeader>
          <AlertDialogTitle className="text-center flex items-center justify-center gap-2">
            <Check className="h-6 w-6 text-green-500" />
            Session Complete
          </AlertDialogTitle>
          <AlertDialogDescription className="text-center space-y-4">
            <div className="bg-muted p-4 rounded-lg space-y-2">
              <p className="font-semibold">{sessionTitle}</p>
              <p className="text-sm text-muted-foreground">{sessionSubtitle}</p>
              <div className="grid grid-cols-3 gap-4 text-sm">
                <div>
                  <p className="font-medium">Duration</p>
                  <p className="text-muted-foreground">{formatTime(sessionDuration)}</p>
                </div>
                <div>
                  <p className="font-medium">Prayers</p>
                  <p className="text-muted-foreground">{sessionPrayers.length}</p>
                </div>
                <div>
                  <p className="font-medium">Avg/Prayer</p>
                  <p className="text-muted-foreground">{formatTime(averageTimePerPrayer)}</p>
                </div>
              </div>
            </div>
            <p>Your prayer session has been saved to your journal.</p>
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter className="flex-col gap-2">
          <AlertDialogAction 
            onClick={() => router.push('/journal')} 
            className="w-full"
          >
            View Journal
          </AlertDialogAction>
          <AlertDialogCancel 
            onClick={() => router.push('/prayer-walk')} 
            className="w-full"
          >
            Back to Prayer Walk
          </AlertDialogCancel>
        </AlertDialogFooter>
      </AlertDialogContent>
    );
  };

  if (!isLoaded) {
    return (
      <div className="flex items-center justify-center h-screen">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  if (sessionPrayers.length === 0 && isLoaded) {
    return (
      <div className="flex flex-col items-center justify-center h-screen p-4 text-center">
        <h1 className="text-2xl font-bold mb-4">No Prayers Found</h1>
        <p className="text-muted-foreground mb-4">There are no prayers in this category yet.</p>
        <Button onClick={() => router.back()}>Go Back</Button>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-screen bg-background p-4">
        {showReflectionInput ? (
             <div className="fixed inset-0 bg-background/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
                <AlertDialog open>
                    <ReflectionInputContent />
                </AlertDialog>
            </div>
        ) : isSessionEnded ? (
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
                                        {prayer.bibleVerse && <VerseDisplay reference={prayer.bibleVerse} />}
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
                 <div className="flex flex-col gap-4 items-center">
                     {/* Audio controls */}
                     <div className="flex gap-2 items-center">
                         <Button 
                             variant={audioEnabled ? "default" : "outline"} 
                             size="sm" 
                             onClick={enableAudio}
                             disabled={audioEnabled}
                             className="flex items-center gap-2"
                         >
                             {audioEnabled ? <Volume2 className="h-4 w-4" /> : <VolumeX className="h-4 w-4" />}
                             {audioEnabled ? "Sound On" : "Enable Sound"}
                         </Button>
                         
                         {audioEnabled && (
                             <Button 
                                 variant={soundNotificationsEnabled ? "default" : "outline"} 
                                 size="sm" 
                                 onClick={toggleSoundNotifications}
                                 className="flex items-center gap-2"
                             >
                                 {soundNotificationsEnabled ? <Volume2 className="h-4 w-4" /> : <VolumeX className="h-4 w-4" />}
                                 {soundNotificationsEnabled ? "Beeps On" : "Beeps Off"}
                             </Button>
                         )}
                     </div>
                     
                     {/* Navigation controls */}
                     <div className="grid grid-cols-3 w-full max-w-xs gap-4 items-center">
                         <Button variant="outline" className="justify-self-start" onClick={() => api?.scrollPrev()} disabled={current === 1}>
                            <ChevronLeft className="h-4 w-4 mr-1" /> Prev
                        </Button>
                        <Button 
                            variant="secondary" 
                            size="icon" 
                            className="h-14 w-14 rounded-full justify-self-center"
                            onClick={() => setIsPaused(!isPaused)}
                        >
                            {isPaused ? <Play className="h-6 w-6" /> : <Pause className="h-6 w-6" />}
                        </Button>
                        <Button onClick={() => api?.scrollNext()} className="justify-self-end" disabled={current === count}>
                            Next <ChevronRight className="h-4 w-4 ml-1" />
                        </Button>
                     </div>
                     
                     {/* Progress indicator */}
                     <div className="text-center text-sm text-muted-foreground mt-2">
                        Prayer {current} of {count} • Auto-advancing
                     </div>
                 </div>
            </footer>
        </>
        )}
        
        {/* Hidden audio element for beep sound */}
        <audio 
          ref={audioRef} 
          preload="auto" 
          style={{ display: 'none' }}
        >
          <source src={beepSoundDataUri} type="audio/wav" />
        </audio>
    </div>
  );
}

export default function PrayerWalkPage() {
  return (
    <Suspense fallback={
      <div className="flex items-center justify-center h-screen">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    }>
      <PrayerWalkPageContent />
    </Suspense>
  );
}

    



    