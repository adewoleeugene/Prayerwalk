
"use client";

import React, { useEffect, useState } from 'react';
import { useAuth } from '@/hooks/use-auth';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { FolderPlus, Footprints, Sparkles, Activity } from 'lucide-react';
import { getDailyVerse, DailyVerse } from '@/ai/flows/get-daily-verse';
import { Skeleton } from './ui/skeleton';
import { usePrayerStore } from '@/hooks/use-prayer-store';
import { PrayerCard } from './prayer-card';
import { AddCategoryDialog } from './add-category-dialog';
import { Avatar, AvatarFallback } from './ui/avatar';
import type { View } from '@/app/page';
import { analyzePrayerActivity, AnalyzePrayerActivityOutput } from '@/ai/flows/analyze-prayer-activity';
import { PrayerChart } from './prayer-chart';

type HomePageProps = {
  onCaptureClick: () => void;
  setView: (view: View) => void;
};

export function HomePage({ onCaptureClick, setView }: HomePageProps) {
  const { user } = useAuth();
  const { prayers, categories, isLoaded } = usePrayerStore();
  const [greeting, setGreeting] = useState('');
  const [dailyVerse, setDailyVerse] = useState<DailyVerse | null>(null);
  const [isLoadingVerse, setIsLoadingVerse] = useState(true);
  const [isCategoryDialogOpen, setIsCategoryDialogOpen] = useState(false);
  const [analysis, setAnalysis] = useState<AnalyzePrayerActivityOutput | null>(null);
  const [isLoadingAnalysis, setIsLoadingAnalysis] = useState(true);

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
    if(isLoaded && prayers.length > 0) {
      const recentPrayers = prayers.filter(p => p.status === 'active').slice(0, 10);
      const answeredPrayers = prayers.filter(p => p.status === 'answered').slice(0, 10);

      analyzePrayerActivity({ recentPrayers, answeredPrayers, categories })
        .then(setAnalysis)
        .catch(console.error)
        .finally(() => setIsLoadingAnalysis(false));
    } else if (isLoaded) {
      setIsLoadingAnalysis(false);
    }
  }, [isLoaded, prayers, categories]);

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
          
          {/* Recent Activity Analysis */}
          <Card className="shadow-md">
             <CardHeader>
                <CardTitle className="flex items-center gap-2 text-lg">
                  <Activity />
                  Recent Activity
                </CardTitle>
                <CardDescription>An AI-powered summary of your recent prayer life.</CardDescription>
            </CardHeader>
            <CardContent>
              {isLoadingAnalysis ? (
                 <div className="space-y-2">
                  <Skeleton className="h-4 w-full" />
                  <Skeleton className="h-4 w-2/3" />
                  <Skeleton className="h-32 w-full mt-2" />
                </div>
              ) : analysis && (analysis.summary || analysis.categoryDistribution.length > 0) ? (
                <div className="space-y-4">
                  <p className="text-sm text-muted-foreground italic">"{analysis.summary}"</p>
                  {analysis.categoryDistribution.length > 0 && <PrayerChart data={analysis.categoryDistribution} />}
                </div>
              ) : (
                 <div className="text-center text-muted-foreground py-8">
                  <p>No recent activity to analyze.</p>
                  <p>Start by adding some prayer points.</p>
                </div>
              )}
            </CardContent>
          </Card>
          
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
