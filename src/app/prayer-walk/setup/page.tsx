
"use client";

import React, { useState, useMemo } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Label } from '@/components/ui/label';
import { Slider } from '@/components/ui/slider';
import { ArrowLeft } from 'lucide-react';
import { usePrayerStore } from '@/hooks/use-prayer-store';

type TimingMode = 'per_prayer' | 'total';

export default function PrayerWalkSetupPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { categories, prayers } = usePrayerStore();

  const mode = searchParams.get('mode'); // category, custom, shuffle
  const id = searchParams.get('id'); // categoryId or null
  const ids = searchParams.get('ids'); // comma-separated prayerIds or null
  
  const prayerCount = useMemo(() => {
    if (mode === 'shuffle') {
      return prayers.filter(p => p.status === 'active').length;
    }
    return parseInt(searchParams.get('count') || '0', 10)
  }, [mode, searchParams, prayers]);


  const [timingMode, setTimingMode] = useState<TimingMode>('per_prayer');
  const [duration, setDuration] = useState(5); // Default 5 minutes

  const sessionTitle = useMemo(() => {
    if (mode === 'category') {
      const category = categories.find(c => c.id === id);
      return `${category?.name || 'Category'} Session`;
    }
    if (mode === 'custom') return 'Custom Session';
    if (mode === 'shuffle') return 'Shuffled Session';
    return 'Prayer Session';
  }, [mode, id, categories]);

  const handleStartWalk = () => {
    let path = '';
    let finalIds = '';
    
    if (mode === 'category' && id) {
      path = `/prayer-walk/${id}`;
    } else if (mode === 'custom' && ids) {
      path = `/prayer-walk/custom`;
      finalIds = `&ids=${ids}`;
    } else if (mode === 'shuffle') {
      path = `/prayer-walk/shuffle`;
    }
    
    if (path) {
      router.push(`${path}?timingMode=${timingMode}&duration=${duration}${finalIds}`);
    }
  };

  const getDurationLabel = () => {
    if (timingMode === 'total') {
      return `Total Time: ${duration} min`;
    }
    return `Time per Prayer: ${duration} min`;
  };

  return (
    <div className="flex flex-col h-screen">
      <header className="flex items-center justify-between p-4 border-b bg-background/80 backdrop-blur-sm sticky top-0 z-10">
        <Button variant="ghost" size="icon" onClick={() => router.back()}>
          <ArrowLeft />
        </Button>
        <h1 className="text-xl font-bold font-headline">Session Setup</h1>
        <div className="w-10"/>
      </header>

      <main className="flex-1 p-4 md:p-6">
        <Card>
          <CardHeader>
            <CardTitle className="font-bold text-2xl">{sessionTitle}</CardTitle>
            <CardDescription>
              {prayerCount > 0 
                ? `You are about to pray through ${prayerCount} prayer point${prayerCount > 1 ? 's' : ''}.` 
                : 'Setting up your shuffled walk.'}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-8">
            <div className="space-y-4">
              <h3 className="font-semibold text-lg">Timing</h3>
              <RadioGroup value={timingMode} onValueChange={(value) => setTimingMode(value as TimingMode)} className="space-y-2">
                <Label htmlFor="per_prayer" className="flex items-center gap-3 p-3 border rounded-md has-[:checked]:bg-secondary has-[:checked]:border-primary/50 cursor-pointer">
                  <RadioGroupItem value="per_prayer" id="per_prayer" />
                  Time Per Prayer
                </Label>
                <Label htmlFor="total" className="flex items-center gap-3 p-3 border rounded-md has-[:checked]:bg-secondary has-[:checked]:border-primary/50 cursor-pointer">
                  <RadioGroupItem value="total" id="total" />
                  Total Session Time
                </Label>
              </RadioGroup>
            </div>

            <div className="space-y-4">
                <Label htmlFor="duration-slider" className="text-lg font-semibold">{getDurationLabel()}</Label>
                <Slider
                    id="duration-slider"
                    value={[duration]}
                    onValueChange={(value) => setDuration(value[0])}
                    min={1}
                    max={timingMode === 'total' ? 120 : 30}
                    step={1}
                />
                 <p className="text-sm text-muted-foreground">
                    {timingMode === 'total' 
                        ? 'Set the total length for the entire prayer session.'
                        : 'Set how long you want to focus on each prayer point.'
                    }
                </p>
            </div>
          </CardContent>
        </Card>
      </main>

       <footer className="p-4 border-t bg-background sticky bottom-0">
          <Button 
            className="w-full" 
            size="lg"
            onClick={handleStartWalk}
            disabled={prayerCount === 0 && mode !== 'shuffle'}
          >
            Start Prayer Walk
          </Button>
        </footer>
    </div>
  );
}
