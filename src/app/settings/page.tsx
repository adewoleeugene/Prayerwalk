
"use client";

import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { useAuth } from '@/hooks/use-auth';
import { ChevronRight, LogOut, User, Target } from 'lucide-react';
import type { View } from '@/app/page';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { usePrayerStore } from '@/hooks/use-prayer-store';
import { useToast } from '@/hooks/use-toast';
import { Loader2 } from 'lucide-react';

export function SettingsPage({ setView }: { setView: (view: View) => void; }) {
  const { signOut } = useAuth();
  const { goal, setGoal, isLoaded } = usePrayerStore();
  const { toast } = useToast();
  const [dailyGoal, setDailyGoal] = useState(goal.dailyPrayerTime);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    if (isLoaded) {
      setDailyGoal(goal.dailyPrayerTime);
    }
  }, [isLoaded, goal.dailyPrayerTime]);

  const handleSaveChanges = () => {
    setIsSaving(true);
    setGoal({ dailyPrayerTime: Number(dailyGoal) });
    setTimeout(() => {
      toast({
        title: "Settings Saved",
        description: "Your prayer goal has been updated.",
      });
      setIsSaving(false);
    }, 500);
  };
  
  return (
    <>
      <header className="flex items-center justify-between p-4 border-b bg-background/80 backdrop-blur-sm sticky top-0 z-10">
        <h1 className="text-xl font-bold font-headline">Settings</h1>
      </header>
      <main className="p-4 md:p-6 space-y-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
                <Target className="h-5 w-5" />
                Prayer Goal
            </CardTitle>
            <CardDescription>Set your daily prayer time goal in minutes.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
             <div className="space-y-2">
                <Label htmlFor="daily-goal">Daily Prayer Time (minutes)</Label>
                <Input 
                    id="daily-goal" 
                    type="number" 
                    value={dailyGoal}
                    onChange={(e) => setDailyGoal(Number(e.target.value))}
                    placeholder="e.g., 30"
                    min="1"
                />
             </div>
             <Button onClick={handleSaveChanges} disabled={isSaving || !isLoaded}>
                {isSaving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Save Goal
             </Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Account</CardTitle>
            <CardDescription>Manage your account and sign out.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-2">
            <Button variant="outline" className="w-full justify-between" onClick={() => setView({ type: 'profile' })}>
              <div className='flex items-center gap-2'>
                <User className="h-4 w-4" />
                <span>Profile</span>
              </div>
              <ChevronRight className="h-4 w-4" />
            </Button>
            <Button variant="outline" className="w-full justify-between text-destructive hover:text-destructive" onClick={signOut}>
                <div className='flex items-center gap-2'>
                  <LogOut className="h-4 w-4" />
                  <span>Sign Out</span>
                </div>
            </Button>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader>
            <CardTitle>About</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">PraySmart v1.0.0</p>
          </CardContent>
        </Card>
      </main>
    </>
  );
}

export default SettingsPage;
