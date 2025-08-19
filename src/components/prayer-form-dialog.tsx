
"use client";

import React, { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { AlertDialog, AlertDialogContent, AlertDialogHeader, AlertDialogTitle, AlertDialogDescription, AlertDialogFooter, AlertDialogAction, AlertDialogCancel } from "@/components/ui/alert-dialog";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { usePrayerStore, CategorySuggestion } from '@/hooks/use-prayer-store';
import { Prayer } from '@/lib/types';
import { useToast } from '@/hooks/use-toast';
import { Loader2 } from 'lucide-react';

const prayerSchema = z.object({
  title: z.string().min(3, "Title must be at least 3 characters."),
  categoryId: z.string().min(1, "Please select a category."),
  bibleVerse: z.string().optional(),
  notes: z.string().optional(),
});

type PrayerFormDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  prayerToEdit?: Prayer;
  defaultValues?: Partial<z.infer<typeof prayerSchema>>;
};

function CategorySuggestionDialog({
  suggestion,
  onResolve,
  onOpenChange,
}: {
  suggestion: CategorySuggestion;
  onResolve: (action: 'move' | 'keep_both' | 'keep_current') => void;
  onOpenChange: (open: boolean) => void;
}) {
    const { categories } = usePrayerStore();
    const originalCategory = categories.find(c => c.id === suggestion.prayer.categoryId)?.name;
    const suggestedCategory = categories.find(c => c.id === suggestion.suggestion.suggestedCategoryId)?.name;

    return (
        <AlertDialog open={!!suggestion} onOpenChange={onOpenChange}>
            <AlertDialogContent>
                <AlertDialogHeader>
                    <AlertDialogTitle>Category Suggestion</AlertDialogTitle>
                    <AlertDialogDescription>
                        {suggestion.suggestion.suggestionReason} We noticed you put this under <strong>{originalCategory}</strong>. Would you like to move it to <strong>{suggestedCategory}</strong> instead?
                    </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter className="flex-col sm:flex-col sm:space-x-0 gap-2">
                    <Button onClick={() => onResolve('move')}>Move to "{suggestedCategory}"</Button>
                    <Button variant="secondary" onClick={() => onResolve('keep_both')}>Keep in Both</Button>
                    <Button variant="outline" onClick={() => onResolve('keep_current')}>Keep in "{originalCategory}"</Button>
                </AlertDialogFooter>
            </AlertDialogContent>
        </AlertDialog>
    );
}

export function PrayerFormDialog({ open, onOpenChange, prayerToEdit, defaultValues }: PrayerFormDialogProps) {
  const { addPrayer, updatePrayer, categories, categorySuggestion, resolveSuggestion } = usePrayerStore();
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const form = useForm<z.infer<typeof prayerSchema>>({
    resolver: zodResolver(prayerSchema),
    defaultValues: prayerToEdit || defaultValues || {
      title: "",
      categoryId: "",
      bibleVerse: "",
      notes: ""
    },
  });

  useEffect(() => {
    if (open) {
      const initialValues = prayerToEdit || defaultValues || {
        title: "",
        categoryId: categories.length > 0 ? categories[0].id : "",
        bibleVerse: "",
        notes: ""
      };
      form.reset(initialValues);
    }
  }, [prayerToEdit, defaultValues, form, open, categories]);

  async function onSubmit(values: z.infer<typeof prayerSchema>) {
    setIsSubmitting(true);
    if (prayerToEdit) {
      updatePrayer({ ...prayerToEdit, ...values });
      toast({ title: "Prayer Updated", description: "Your changes have been saved." });
      onOpenChange(false);
    } else {
      const result = await addPrayer(values);
      if (result) { // No suggestion was triggered
        toast({ title: "Prayer Added", description: "A new prayer point is in your library." });
        onOpenChange(false);
      }
      // If result is null, the suggestion dialog will open via the store's state
    }
    setIsSubmitting(false);
  }

  const handleResolveSuggestion = (action: 'move' | 'keep_both' | 'keep_current') => {
    resolveSuggestion(action);
    let description = "";
    if (action === 'move') description = "The prayer has been moved.";
    else if (action === 'keep_both') description = "The prayer was added to both categories.";
    else description = "The prayer was added to the original category."

    toast({ title: "Action Complete", description });
  }

  if (categorySuggestion) {
      return <CategorySuggestionDialog 
        suggestion={categorySuggestion}
        onResolve={handleResolveSuggestion}
        onOpenChange={(isOpen) => { if(!isOpen) resolveSuggestion('keep_current')}}
      />
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>{prayerToEdit ? 'Edit Prayer Point' : 'Add Prayer Point'}</DialogTitle>
          <DialogDescription>
            {prayerToEdit ? 'Update your prayer point details.' : 'Add a new prayer point to your library.'}
          </DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 pt-4">
            <FormField control={form.control} name="title" render={({ field }) => (
              <FormItem>
                <FormLabel>Prayer Point</FormLabel>
                <FormControl><Input placeholder="e.g., For strength and guidance" {...field} /></FormControl>
                <FormMessage />
              </FormItem>
            )} />
            <FormField control={form.control} name="categoryId" render={({ field }) => (
              <FormItem>
                <FormLabel>Category</FormLabel>
                <Select onValueChange={field.onChange} defaultValue={field.value}>
                  <FormControl><SelectTrigger><SelectValue placeholder="Select a category" /></SelectTrigger></FormControl>
                  <SelectContent>
                    {categories.map(c => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )} />
            <FormField control={form.control} name="bibleVerse" render={({ field }) => (
              <FormItem>
                <FormLabel>Bible Verse (optional)</FormLabel>
                <FormControl><Input placeholder="e.g., Philippians 4:13" {...field} /></FormControl>
                <FormMessage />
              </FormItem>
            )} />
            <FormField control={form.control} name="notes" render={({ field }) => (
              <FormItem>
                <FormLabel>Reflection / Notes (optional)</FormLabel>
                <FormControl><Textarea placeholder="Your thoughts and reflections..." {...field} /></FormControl>
                <FormMessage />
              </FormItem>
            )} />
            <DialogFooter>
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                {prayerToEdit ? 'Save Changes' : 'Add Prayer'}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
