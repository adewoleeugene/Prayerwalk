
"use client";

import React from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useAuth } from '@/hooks/use-auth';
import { ArrowLeft } from 'lucide-react';
import type { View } from '@/app/page';

export function ProfilePage({ setView }: { setView: (view: View) => void; }) {
  const { user } = useAuth();
  
  // This would be a form in a real app
  const handleUpdateProfile = (e: React.FormEvent) => {
    e.preventDefault();
    // Profile update logic would go here
  };

  return (
    <>
      <header className="flex items-center p-4 border-b bg-background/80 backdrop-blur-sm sticky top-0 z-10">
        <Button variant="ghost" size="icon" onClick={() => setView({ type: 'settings' })}>
          <ArrowLeft />
        </Button>
        <h1 className="text-xl font-bold font-headline mx-auto">Profile</h1>
        <div className="w-10" />
      </header>
      <main className="p-4 md:p-6">
        <Card>
          <CardHeader>
            <CardTitle>Your Information</CardTitle>
            <CardDescription>Update your display name and email.</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleUpdateProfile} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="displayName">Display Name</Label>
                <Input id="displayName" defaultValue={user?.displayName || ''} placeholder="Your name" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="email">Email Address</Label>
                <Input id="email" type="email" value={user?.email || ''} disabled />
              </div>
              <Button type="submit" className="w-full">Save Changes</Button>
            </form>
          </CardContent>
        </Card>
      </main>
    </>
  );
}

export default ProfilePage;
