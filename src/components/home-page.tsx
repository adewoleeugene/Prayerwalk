
"use client";

import React, { useEffect, useState } from 'react';
import { useAuth } from '@/hooks/use-auth';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { FolderPlus, Footprints, Sparkles, Trash2, ArrowRight } from 'lucide-react';
import { getDailyVerse, DailyVerse } from '@/ai/flows/get-daily-verse';
import { cachedAIFlow } from '@/lib/ai-cache';
import { Skeleton } from './ui/skeleton';
import { usePrayerStore } from '@/hooks/use-prayer-store';
import { PrayerCard } from './prayer-card';
import { AddCategoryDialog } from './add-category-dialog';
import { Avatar, AvatarFallback } from './ui/avatar';
import type { View } from '@/app/page';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from './ui/alert-dialog';
import { useToast } from '@/hooks/use-toast';
import { format, subDays, isToday } from 'date-fns';
import { analyzePrayerActivity, AnalyzePrayerActivityOutput } from '@/ai/flows/analyze-prayer-activity';
import { useJournalStore } from '@/hooks/use-journal-store';
import { StreakCounter } from './streak-counter';



type HomePageProps = {
  onCaptureClick: () => void;
  setView: (view: View) => void;
};



export function HomePage({ onCaptureClick, setView }: HomePageProps) {
  const { user } = useAuth();
  const { prayers, categories, isLoaded: isPrayerStoreLoaded, deletePrayer } = usePrayerStore();
  const { entries, isLoaded: isJournalStoreLoaded } = useJournalStore();
  const [greeting, setGreeting] = useState('');
  const [dailyVerse, setDailyVerse] = useState<DailyVerse | null>(null);
  const [isLoadingVerse, setIsLoadingVerse] = useState(true);
  const [isCategoryDialogOpen, setIsCategoryDialogOpen] = useState(false);
  const [analysis, setAnalysis] = useState<AnalyzePrayerActivityOutput | null>(null);
  const [isLoadingAnalysis, setIsLoadingAnalysis] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    const hours = new Date().getHours();
    if (hours < 12) setGreeting('Good morning');
    else if (hours < 18) setGreeting('Good afternoon');
    else setGreeting('Good evening');

    const fetchOrLoadVerse = async () => {
      setIsLoadingVerse(true);
      const today = new Date().toDateString();
      
      try {
        // Use cachedAIFlow for client-side caching with 24-hour TTL
        const verse = await cachedAIFlow(
          'getDailyVerse',
          () => getDailyVerse(),
          { date: today },
          { ttl: 24 * 60 * 60 * 1000 } // 24 hours
        );
        
        if (verse && verse.verse && verse.reference) {
          setDailyVerse(verse);
        }
      } catch (error) {
        console.error("Failed to fetch daily verse:", error);
      } finally {
        setIsLoadingVerse(false);
      }
    };
    
    fetchOrLoadVerse();
  }, []);

  const recentPrayerWalks = React.useMemo(() => {
    if (!isJournalStoreLoaded) return [];
    return entries.filter(e => e.sourceType === 'live' && e.duration).sort((a,b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  }, [entries, isJournalStoreLoaded]);


  useEffect(() => {
    if (isPrayerStoreLoaded && isJournalStoreLoaded) {
        // Only run analysis if there's actual activity
        if (recentPrayerWalks.length > 0) {
            const oneWeekAgo = subDays(new Date(), 7);
            const recentPrayers = prayers.filter(p => new Date(p.createdAt) > oneWeekAgo);
            const answeredPrayers = prayers.filter(p => p.status === 'answered' && new Date(p.createdAt) > oneWeekAgo);

            if (recentPrayers.length > 0 || answeredPrayers.length > 0) {
                setIsLoadingAnalysis(true);
                analyzePrayerActivity({
                    recentPrayers,
                    answeredPrayers,
                    categories
                }).then(setAnalysis).catch(err => {
                    console.error("Failed to analyze prayer activity", err);
                    setAnalysis(null);
                }).finally(() => {
                    setIsLoadingAnalysis(false);
                });
            }
        } else {
             setIsLoadingAnalysis(false);
             setAnalysis(null);
        }
    }
  }, [isPrayerStoreLoaded, isJournalStoreLoaded, prayers, categories, recentPrayerWalks]);
  
  
  const lastPrayerWalk = recentPrayerWalks.length > 0 ? recentPrayerWalks[0] : null;
  const lastPrayerTime = lastPrayerWalk ? new Date(lastPrayerWalk.createdAt) : null;
  const lastSessionDuration = lastPrayerWalk ? lastPrayerWalk.duration : null;

  const lastSessionDurationFormatted = React.useMemo(() => {
    if (!lastSessionDuration) return ["0", "minutes"];
    const minutes = Math.floor(lastSessionDuration / 60);
    const unit = minutes === 1 ? 'minute' : 'minutes';
    return [minutes.toString(), unit];
  }, [lastSessionDuration]);

  const showRecentActivity = !!lastPrayerWalk;

  const recentPrayersForDisplay = prayers.filter(p => p.status === 'active').slice(0, 3);
  const userName = user?.displayName || user?.email?.split('@')[0] || 'friend';
  const userInitial = (user?.displayName || user?.email || 'U').charAt(0).toUpperCase();

  return (
    <>
      <div className="flex flex-col">
        <header className="flex items-center justify-between p-4">
          <h1 className="text-xl font-bold font-headline capitalize">{greeting}, {userName}!</h1>
          <Avatar className="cursor-pointer" onClick={() => setView({ type: 'settings' })}>
            <AvatarFallback>{userInitial}</AvatarFallback>
          </Avatar>
        </header>

        <main className="px-4 pb-4 space-y-6">
          <Card className="shadow-lg bg-primary text-primary-foreground">
            <CardHeader>
              <CardTitle className="text-lg">Verse of the Day</CardTitle>
            </CardHeader>
            <CardContent>
              {isLoadingVerse ? (
                <div className="space-y-2">
                  <Skeleton className="h-4 w-full bg-primary-foreground/20" />
                  <Skeleton className="h-4 w-2/3 bg-primary-foreground/20" />
                  <Skeleton className="h-4 w-1/3 bg-primary-foreground/20" />
                </div>
              ) : dailyVerse ? (
                <>
                  <p className="text-xl font-light">"{dailyVerse.verse}"</p>
                  <p className="text-right mt-2 font-semibold">{dailyVerse.reference}</p>
                </>
              ) : (
                <p>Could not load a verse today. Please try again later.</p>
              )}
            </CardContent>
          </Card>

          <StreakCounter collapsible={true} linkToActivities={true} />

          <div className="grid grid-cols-3 gap-2">
            <Button size="lg" className="h-20 flex-col gap-1 text-xs" onClick={() => setView({type: 'prayer-walk'})}>
              <Footprints className="h-5 w-5" />
              <span>Prayer Walk</span>
            </Button>
            <Button size="lg" variant="secondary" className="h-20 flex-col gap-1 text-xs" onClick={onCaptureClick}>
              <Sparkles className="h-5 w-5" />
              <span>Take Note</span>
            </Button>
            <Button size="lg" variant="secondary" className="h-20 flex-col gap-1 text-xs" onClick={() => setIsCategoryDialogOpen(true)}>
              <FolderPlus className="h-5 w-5" />
              <span>Add Category</span>
            </Button>
          </div>
          
          {showRecentActivity && (
            <div className="space-y-2">
              <h2 className="text-lg font-bold font-headline">Recent Activity</h2>
              <Card className="shadow-md cursor-pointer hover:shadow-lg transition-shadow" onClick={() => setView({ type: 'activity' })}>
                  <CardHeader>
                      <div className="grid grid-cols-2 gap-6 w-full">
                          <div>
                              <p className="text-sm text-muted-foreground">Last Prayer</p>
                              <p className="text-xl font-bold">{lastPrayerTime ? format(lastPrayerTime, 'p') : 'N/A'}</p>
                              <p className="text-sm font-medium">{lastPrayerTime ? format(lastPrayerTime, 'eeee') : ''}</p>
                          </div>
                          <div>
                              <p className="text-sm text-muted-foreground">Duration</p>
                              <p className="text-2xl font-bold">{lastSessionDurationFormatted[0]}</p>
                              <p className="text-sm font-medium capitalize">{lastSessionDurationFormatted[1]}</p>
                          </div>
                      </div>
                  </CardHeader>
                  {(isLoadingAnalysis || analysis?.summary) && (
                    <CardContent>
                        <h3 className="font-semibold text-md mb-2">Weekly Analysis</h3>
                        {isLoadingAnalysis ? (
                            <div className="space-y-2">
                                <Skeleton className="h-4 w-full" />
                                <Skeleton className="h-4 w-5/6" />
                            </div>
                        ) : analysis?.summary ? (
                            <p className="text-sm text-muted-foreground">{analysis.summary}</p>
                        ) : null}
                    </CardContent>
                  )}
              </Card>
            </div>
          )}
          
          <div>
            <h2 className="text-lg font-bold font-headline mb-2">Recent Prayer Points</h2>
            {isPrayerStoreLoaded && recentPrayersForDisplay.length > 0 ? (
              <div className="space-y-4">
                {recentPrayersForDisplay.map(prayer => <PrayerCard key={prayer.id} prayer={prayer} />)}
              </div>
            ) : (
              <div className="text-center text-muted-foreground py-8">
                <p>No prayer points yet.</p>
                <p>Tap 'Take Note' to add your first prayer point.</p>
              </div>
            )}
          </div>
        </main>
      </div>
      <AddCategoryDialog open={isCategoryDialogOpen} onOpenChange={setIsCategoryDialogOpen} />
    </>
  );
}
