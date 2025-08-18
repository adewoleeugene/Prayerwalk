
"use client";

import React, { useState } from 'react';
import { Prayer } from '@/lib/types';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { usePrayerStore } from '@/hooks/use-prayer-store';
import { Check, CheckCircle, Edit, Trash2 } from 'lucide-react';
import { PrayerFormDialog } from './prayer-form-dialog';
import { Badge } from './ui/badge';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from './ui/alert-dialog';
import { useToast } from '@/hooks/use-toast';

type PrayerCardProps = {
  prayer: Prayer;
};

export function PrayerCard({ prayer }: PrayerCardProps) {
  const { togglePrayerStatus, deletePrayer, categories } = usePrayerStore();
  const [isFormOpen, setIsFormOpen] = useState(false);
  const { toast } = useToast();
  const category = categories.find(c => c.id === prayer.categoryId);

  const handleToggleStatus = () => {
    togglePrayerStatus(prayer.id);
    if(prayer.status === 'active') {
        toast({
            title: "Prayer Answered!",
            description: `"${prayer.title}" marked as answered.`,
            action: (
              <div className="p-1 rounded-full bg-green-500">
                <Check className="h-4 w-4 text-white" />
              </div>
            ),
        });
    }
  }

  return (
    <>
      <Card className="shadow-md hover:shadow-lg transition-shadow duration-300 animate-in fade-in-50">
        <CardHeader>
          <CardTitle>{prayer.title}</CardTitle>
          {prayer.bibleVerse && <CardDescription>Inspired by: {prayer.bibleVerse}</CardDescription>}
        </CardHeader>
        {prayer.notes && (
          <CardContent>
            <p className="text-sm text-muted-foreground italic">"{prayer.notes}"</p>
          </CardContent>
        )}
        <CardFooter className="flex justify-between items-center">
          {category ? <Badge variant="secondary">{category.name}</Badge> : <div />}
          <div className="flex gap-1">
            {prayer.status === 'active' ? (
              <Button variant="ghost" size="icon" onClick={handleToggleStatus} aria-label="Mark as answered">
                <CheckCircle className="h-5 w-5 text-green-600 hover:text-green-500" />
              </Button>
            ) : (
                <AlertDialog>
                <AlertDialogTrigger asChild>
                    <Button variant="ghost" size="sm" className="text-destructive hover:text-destructive">
                        <Trash2 className="h-4 w-4 mr-2" />
                        Remove
                    </Button>
                </AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>Are you sure?</AlertDialogTitle>
                    <AlertDialogDescription>
                      This will permanently remove this answered prayer.
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel>Cancel</AlertDialogCancel>
                    <AlertDialogAction onClick={() => deletePrayer(prayer.id)}>Remove</AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            )}
            <Button variant="ghost" size="icon" onClick={() => setIsFormOpen(true)} aria-label="Edit prayer">
              <Edit className="h-5 w-5" />
            </Button>
            {prayer.status === 'active' && (
                <AlertDialog>
                <AlertDialogTrigger asChild>
                    <Button variant="ghost" size="icon" aria-label="Delete prayer">
                    <Trash2 className="h-5 w-5 text-destructive" />
                    </Button>
                </AlertDialogTrigger>
                <AlertDialogContent>
                    <AlertDialogHeader>
                    <AlertDialogTitle>Are you sure?</AlertDialogTitle>
                    <AlertDialogDescription>
                        This action cannot be undone. This will permanently delete this prayer point.
                    </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                    <AlertDialogCancel>Cancel</AlertDialogCancel>
                    <AlertDialogAction onClick={() => deletePrayer(prayer.id)}>Delete</AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
                </AlertDialog>
            )}
          </div>
        </CardFooter>
      </Card>
      <PrayerFormDialog open={isFormOpen} onOpenChange={setIsFormOpen} prayerToEdit={prayer} />
    </>
  );
}
