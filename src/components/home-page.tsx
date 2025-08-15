"use client";

import React, { useEffect, useState } from 'react';
import { useAuth } from '@/hooks/use-auth';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Footprints, LogOut, Sparkles } from 'lucide-react';
import { getDailyVerse, DailyVerse } from '@/ai/flows/get-daily-verse';
import { Skeleton } from './ui/skeleton';
import { usePrayerStore } from '@/hooks/use-prayer-store';
import { PrayerCard } from './prayer-card';
import { useRouter } from 'next/navigation';

type HomePageProps = {
  onCaptureClick: () => void;
};

export function HomePage({ onCaptureClick }: HomePageProps) {
  const { user, signOut } = useAuth();
  const { prayers, isLoaded } = usePrayerStore();
  const router = useRouter();
  const [greeting, setGreeting] = useState('');
  const [dailyVerse, setDailyVerse] = useState<DailyVerse | null>(null);
  const [isLoadingVerse, setIsLoadingVerse] = useState(true);

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

  const recentPrayers = prayers.slice(0, 3);
  const userName = user?.displayName || user?.email?.split('@')[0] || 'friend';

  return (
    <div className="flex flex-col">
      <header className="flex items-center justify-between p-4">
        <h1 className="text-xl font-bold font-headline capitalize">{greeting}, {userName}!</h1>
        <Button variant="ghost" size="icon" onClick={signOut}>
          <LogOut />
          <span className="sr-only">Sign Out</span>
        </Button>
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
        <div className="grid grid-cols-2 gap-4">
          <Button size="lg" className="h-20 flex-col gap-1" onClick={() => router.push('/prayer-walk')}>
            <Footprints className="h-6 w-6" />
            <span>Start Prayer Walk</span>
          </Button>
          <Button size="lg" variant="secondary" className="h-20 flex-col gap-1" onClick={onCaptureClick}>
            <Sparkles className="h-6 w-6" />
            <span>Take Note</span>
          </Button>
        </div>
        
        {/* Recent Prayer Points */}
        <div>
          <h2 className="text-lg font-bold font-headline mb-2">Recent Prayer Points</h2>
          {isLoaded && recentPrayers.length > 0 ? (
            <div className="space-y-4">
              {recentPrayers.map(prayer => <PrayerCard key={prayer.id} prayer={prayer} />)}
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
  );
}
