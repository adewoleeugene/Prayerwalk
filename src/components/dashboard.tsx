"use client";

import React, { useState } from 'react';
import { SidebarProvider, Sidebar, SidebarHeader, SidebarContent, SidebarMenu, SidebarMenuItem, SidebarMenuButton, SidebarFooter, SidebarInset, SidebarTrigger } from '@/components/ui/sidebar';
import { usePrayerStore } from '@/hooks/use-prayer-store';
import { getIcon } from '@/components/icons';
import { Logo } from '@/components/logo';
import { Button } from '@/components/ui/button';
import { CheckCircle, FolderPlus, Sparkles, Sun } from 'lucide-react';
import { PrayerList } from './prayer-list';
import { AddCategoryDialog } from './add-category-dialog';
import { IntelligentCaptureDialog } from './intelligent-capture-dialog';
import { Skeleton } from '@/components/ui/skeleton';
import { PrayerFormDialog } from './prayer-form-dialog';

export function Dashboard() {
  const { categories, isLoaded } = usePrayerStore();
  const [selectedView, setSelectedView] = useState('all'); // 'all', 'answered', or a categoryId
  const [isCategoryDialogOpen, setIsCategoryDialogOpen] = useState(false);
  const [isCaptureDialogOpen, setIsCaptureDialogOpen] = useState(false);
  const [isPrayerFormOpen, setIsPrayerFormOpen] = useState(false);

  const viewTitle = 
    selectedView === 'all' ? 'All Prayers' :
    selectedView === 'answered' ? 'Answered Prayers' :
    categories.find(c => c.id === selectedView)?.name || 'Prayers';

  return (
    <SidebarProvider>
      <Sidebar>
        <SidebarHeader>
          <Logo />
        </SidebarHeader>
        <SidebarContent>
          <SidebarMenu>
            <SidebarMenuItem>
              <SidebarMenuButton
                onClick={() => setSelectedView('all')}
                isActive={selectedView === 'all'}
                tooltip="View all active prayers"
              >
                <Sun />
                All Prayers
              </SidebarMenuButton>
            </SidebarMenuItem>
            
            {isLoaded ? categories.map((category) => {
              const Icon = getIcon(category.icon);
              return (
                <SidebarMenuItem key={category.id}>
                  <SidebarMenuButton
                    onClick={() => setSelectedView(category.id)}
                    isActive={selectedView === category.id}
                    tooltip={category.name}
                  >
                    <Icon />
                    {category.name}
                  </SidebarMenuButton>
                </SidebarMenuItem>
              );
            }) : (
              Array.from({ length: 3 }).map((_, i) => (
                <SidebarMenuItem key={i}>
                  <Skeleton className="h-8 w-full rounded-md" />
                </SidebarMenuItem>
              ))
            )}

            <SidebarMenuItem>
              <SidebarMenuButton
                onClick={() => setSelectedView('answered')}
                isActive={selectedView === 'answered'}
                tooltip="View answered prayers"
              >
                <CheckCircle />
                Answered
              </SidebarMenuButton>
            </SidebarMenuItem>
          </SidebarMenu>
        </SidebarContent>
        <SidebarFooter>
          <Button variant="ghost" className="w-full justify-start gap-2" onClick={() => setIsCategoryDialogOpen(true)}>
            <FolderPlus /> Add Category
          </Button>
        </SidebarFooter>
      </Sidebar>
      
      <SidebarInset>
        <header className="flex items-center justify-between p-4 border-b bg-background/80 backdrop-blur-sm sticky top-0 z-10">
          <div className="flex items-center gap-4">
             <SidebarTrigger className="md:hidden" />
             <h1 className="text-2xl font-bold font-headline">{viewTitle}</h1>
          </div>
          <div className="flex gap-2">
            <Button onClick={() => setIsPrayerFormOpen(true)} variant="outline">
              Add Prayer
            </Button>
            <Button onClick={() => setIsCaptureDialogOpen(true)}>
              <Sparkles className="mr-2 h-4 w-4" />
              Capture
            </Button>
          </div>
        </header>
        
        <PrayerList view={selectedView} />
        
      </SidebarInset>

      <AddCategoryDialog open={isCategoryDialogOpen} onOpenChange={setIsCategoryDialogOpen} />
      <IntelligentCaptureDialog open={isCaptureDialogOpen} onOpenChange={setIsCaptureDialogOpen} />
      <PrayerFormDialog open={isPrayerFormOpen} onOpenChange={setIsPrayerFormOpen} />

    </SidebarProvider>
  );
}
