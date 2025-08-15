"use client";

import React, { useState } from 'react';
import { usePrayerStore } from '@/hooks/use-prayer-store';
import { getIcon } from '@/components/icons';
import { Logo } from '@/components/logo';
import { Button } from '@/components/ui/button';
import { CheckCircle, FolderPlus, LogOut, MoreVertical, Sparkles, Sun } from 'lucide-react';
import { PrayerList } from './prayer-list';
import { AddCategoryDialog } from './add-category-dialog';
import { IntelligentCaptureDialog } from './intelligent-capture-dialog';
import { Skeleton } from '@/components/ui/skeleton';
import { PrayerFormDialog } from './prayer-form-dialog';
import { useAuth } from '@/hooks/use-auth';
import { MobileNav } from './mobile-nav';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from './ui/dropdown-menu';

export function Dashboard() {
  const { categories, isLoaded } = usePrayerStore();
  const { user, signOut } = useAuth();
  const [selectedView, setSelectedView] = useState('all'); // 'all', 'answered', or a categoryId
  const [isCategoryDialogOpen, setIsCategoryDialogOpen] = useState(false);
  const [isCaptureDialogOpen, setIsCaptureDialogOpen] = useState(false);
  const [isPrayerFormOpen, setIsPrayerFormOpen] = useState(false);

  const getCategoryName = (id: string) => categories.find(c => c.id === id)?.name;

  const viewTitle =
    selectedView === 'all' ? 'All Prayers' :
    selectedView === 'answered' ? 'Answered Prayers' :
    getCategoryName(selectedView) || 'Prayers';

  const ViewIcon =
    selectedView === 'all' ? Sun :
    selectedView === 'answered' ? CheckCircle :
    getIcon(categories.find(c => c.id === selectedView)?.icon || 'Default');

  return (
    <div className="flex flex-col min-h-screen">
      <header className="flex items-center justify-between p-4 border-b bg-background/80 backdrop-blur-sm sticky top-0 z-10">
        <div className="flex items-center gap-2">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon">
                <MoreVertical />
                <span className="sr-only">Open navigation menu</span>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="start">
              <DropdownMenuItem onClick={() => setSelectedView('all')} className="gap-2">
                <Sun /> All Prayers
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => setSelectedView('answered')} className="gap-2">
                <CheckCircle /> Answered Prayers
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              {isLoaded ? categories.map((category) => {
                const Icon = getIcon(category.icon);
                return (
                  <DropdownMenuItem key={category.id} onClick={() => setSelectedView(category.id)} className="gap-2">
                    <Icon /> {category.name}
                  </DropdownMenuItem>
                );
              }) : (
                <DropdownMenuItem disabled>Loading categories...</DropdownMenuItem>
              )}
               <DropdownMenuSeparator />
               <DropdownMenuItem onClick={() => setIsCategoryDialogOpen(true)} className="gap-2">
                  <FolderPlus/> Add Category
               </DropdownMenuItem>
               <DropdownMenuItem onClick={signOut} className="gap-2 text-destructive focus:text-destructive">
                 <LogOut /> Sign Out
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
          <div className="flex items-center gap-2">
            <ViewIcon className="h-5 w-5 text-muted-foreground" />
            <h1 className="text-xl font-bold font-headline truncate">{viewTitle}</h1>
          </div>
        </div>

        <div className="flex gap-2">
          <Button onClick={() => setIsPrayerFormOpen(true)} variant="outline" className="hidden sm:inline-flex">
            Add Prayer
          </Button>
          <Button onClick={() => setIsCaptureDialogOpen(true)} className="hidden sm:inline-flex">
            <Sparkles className="mr-2 h-4 w-4" />
            Capture
          </Button>
        </div>
      </header>

      <main className="flex-1 pb-20 md:pb-0">
        <PrayerList view={selectedView} />
      </main>

      <MobileNav
        onAddPrayerClick={() => setIsPrayerFormOpen(true)}
        onCaptureClick={() => setIsCaptureDialogOpen(true)}
      />

      <AddCategoryDialog open={isCategoryDialogOpen} onOpenChange={setIsCategoryDialogOpen} />
      <IntelligentCaptureDialog open={isCaptureDialogOpen} onOpenChange={setIsCaptureDialogOpen} />
      <PrayerFormDialog open={isPrayerFormOpen} onOpenChange={setIsPrayerFormOpen} />
    </div>
  );
}
