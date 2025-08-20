
"use client";

import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { useAuth } from '@/hooks/use-auth';
import { ChevronRight, LogOut, User, Activity } from 'lucide-react';
import type { View } from '@/app/page';

export function SettingsPage({ setView }: { setView: (view: View) => void; }) {
  const { signOut } = useAuth();
  
  return (
    <>
      <header className="flex items-center justify-between p-4 border-b bg-background/80 backdrop-blur-sm sticky top-0 z-10">
        <h1 className="text-xl font-bold font-headline">Settings</h1>
      </header>
      <main className="p-4 md:p-6 space-y-6">
        <Card>
          <CardHeader>
            <CardTitle>Account</CardTitle>
            <CardDescription>Manage your account, activity, and sign out.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-2">
            <Button variant="outline" className="w-full justify-between" onClick={() => setView({ type: 'profile' })}>
              <div className='flex items-center gap-2'>
                <User className="h-4 w-4" />
                <span>Profile</span>
              </div>
              <ChevronRight className="h-4 w-4" />
            </Button>
            <Button variant="outline" className="w-full justify-between" onClick={() => setView({ type: 'activity' })}>
              <div className='flex items-center gap-2'>
                <Activity className="h-4 w-4" />
                <span>Activity & Goals</span>
              </div>
              <ChevronRight className="h-4 w-4" />
            </Button>
            <Button variant="outline" className="w-full justify-between text-destructive hover:text-destructive" onClick={() => signOut()}>
                <div className='flex items-center gap-2'>
                  <LogOut className="h-4 w-4" />
                  <span>Sign Out</span>
                </div>
                <ChevronRight className="h-4 w-4" />
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
