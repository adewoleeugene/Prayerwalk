"use client";

import React from 'react';

export function SettingsPage() {
  return (
    <>
        <header className="flex items-center justify-between p-4 border-b bg-background/80 backdrop-blur-sm sticky top-0 z-10">
            <h1 className="text-xl font-bold font-headline">Settings</h1>
        </header>
        <div className="flex flex-col items-center justify-center h-[calc(100vh-200px)] text-center text-muted-foreground">
            <p className="text-lg font-medium">Settings Coming Soon</p>
            <p className="text-sm">This is where you'll be able to configure the app.</p>
        </div>
    </>
  );
}

export default SettingsPage;
