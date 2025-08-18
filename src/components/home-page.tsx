
"use client";

import React, { useEffect, useState } from 'react';
import { useAuth } from '@/hooks/use-auth';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { FolderPlus, Footprints, Sparkles, Activity, Trash2 } from 'lucide-react';
import { getDailyVerse, DailyVerse } from '@/ai/flows/get-daily-verse';
import { Skeleton } from './ui/skeleton';
import { usePrayerStore } from '@/hooks/use-prayer-store';
import { PrayerCard } from './prayer-card';
import { AddCategoryDialog } from './add-category-dialog';
import { Avatar, AvatarFallback } from './ui/avatar';
import type { View } from '@/app/page';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from './ui/alert-dialog';
import { useToast } from '@/hooks/use-toast';
import { format, subDays, formatDistanceToNow } from 'date-fns';
import { analyzePrayerActivity, AnalyzePrayerActivityOutput } from '@/ai/flows/analyze-prayer-activity';
import { useJournalStore } from '@/hooks/use-journal-store';


type HomePageProps = {
  onCaptureClick: () => void;
  setView: (view: View) => void;
};

export function HomePage({ onCaptureClick, setView }: HomePageProps) {
  const { user } = useAuth();
  const { prayers, categories, isLoaded } = usePrayerStore();
  const { lastSessionDuration } = useJournalStore();
  const [greeting, setGreeting] = useState('');
  const [dailyVerse, setDailyVerse] = useState<DailyVerse | null>(null);
  const [isLoadingVerse, setIsLoadingVerse] = useState(true);
  const [isCategoryDialogOpen, setIsCategoryDialogOpen] = useState(false);
  const [showRecentActivity, setShowRecentActivity] = useState(true);
  const [analysis, setAnalysis] = useState<AnalyzePrayerActivityOutput | null>(null);
  const [isLoadingAnalysis, setIsLoadingAnalysis] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    const hours = new Date().getHours();
    if (hours < 12) setGreeting('Good morning');
    else if (hours < 18) setGreeting('Good afternoon');
    else setGreeting('Good evening');

    getDailyVerse()
      .then(setDailyVerse)
      .catch(console.error)
      .finally(() => setIsLoadingVerse(false));
  }, []);

  useEffect(() => {
    if (isLoaded && showRecentActivity) {
      const oneWeekAgo = subDays(new Date(), 7);
      const recentPrayers = prayers.filter(p => new Date(p.createdAt) > oneWeekAgo && p.status === 'active');
      const answeredPrayers = prayers.filter(p => new Date(p.createdAt) > oneWeekAgo && p.status === 'answered');

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
      } else {
        setIsLoadingAnalysis(false);
        setAnalysis(null);
      }
    }
  }, [isLoaded, prayers, categories, showRecentActivity]);
  
  const handleClearActivity = () => {
    setShowRecentActivity(false);
    toast({
      title: "Activity Cleared",
      description: "Your recent activity has been cleared from the dashboard.",
    })
  }
  
  const lastPrayer = prayers.length > 0 ? prayers[0] : null;
  const lastPrayerTime = lastPrayer ? new Date(lastPrayer.createdAt) : null;
  
  const lastSessionDurationFormatted = (() => {
    if (lastSessionDuration === null || lastSessionDuration === 0) return "0 minutes";
    const minutes = Math.floor(lastSessionDuration / 60);
    return `${minutes} minute${minutes !== 1 ? 's' : ''}`;
  })();


  const recentPrayersForDisplay = showRecentActivity ? prayers.filter(p => p.status === 'active').slice(0, 3) : [];
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
          {/* Verse of the Day Card */}
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

          {/* Quick Actions */}
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
          
          {/* Recent Activity */}
          { showRecentActivity && (
            <div>
              <div className="flex justify-between items-center mb-2">
                <h2 className="text-lg font-bold font-headline">Recent Activity</h2>
                <AlertDialog>
                  <AlertDialogTrigger asChild>
                    <Button variant="ghost" size="icon" aria-label="Clear activity">
                        <Trash2 className="h-4 w-4 text-muted-foreground" />
                    </Button>
                  </AlertDialogTrigger>
                  <AlertDialogContent>
                      <AlertDialogHeader>
                          <AlertDialogTitle>Are you sure?</AlertDialogTitle>
                          <AlertDialogDescription>
                              This action will clear your recent activity summary and recent prayer points from this dashboard view. It will not delete any of your prayer data.
                          </AlertDialogDescription>
                      </AlertDialogHeader>
                      <AlertDialogFooter>
                          <AlertDialogCancel>Cancel</AlertDialogCancel>
                          <AlertDialogAction onClick={handleClearActivity}>Clear</AlertDialogAction>
                      </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <Card className="shadow-md">
                    <CardContent className="p-4">
                        <p className="text-sm text-muted-foreground">Last Prayer</p>
                        <p className="text-xl font-bold">{lastPrayerTime ? format(lastPrayerTime, 'p') : 'N/A'}</p>
                        <p className="text-sm font-medium">{lastPrayerTime ? format(lastPrayerTime, 'eeee') : ''}</p>
                    </CardContent>
                </Card>
                <Card className="shadow-md">
                     <CardContent className="p-4">
                        <p className="text-sm text-muted-foreground">Duration</p>
                        <p className="text-2xl font-bold">{lastSessionDurationFormatted.split(' ')[0]}</p>
                        <p className="text-sm font-medium">{lastSessionDurationFormatted.split(' ')[1]}</p>
                    </CardContent>
                </Card>
              </div>

              {isLoadingAnalysis ? (
                 <Card className="mt-4 shadow-md"><CardContent className="p-4"><Skeleton className="h-20 w-full" /></CardContent></Card>
              ) : analysis && (
                <>
                    <Card className="mt-4 shadow-md">
                        <CardHeader>
                            <CardTitle className="text-lg">Weekly Analysis</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <p className="text-sm text-muted-foreground">{analysis.summary}</p>
                        </CardContent>
                    </Card>
                </>
              )}
            </div>
          )}
          
          {/* Recent Prayer Points */}
          <div>
            <h2 className="text-lg font-bold font-headline mb-2">Recent Prayer Points</h2>
            {isLoaded && recentPrayersForDisplay.length > 0 ? (
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
