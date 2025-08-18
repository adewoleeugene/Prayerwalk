
"use client";

import React from 'react';
import { useJournalStore } from '@/hooks/use-journal-store';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Skeleton } from '@/components/ui/skeleton';
import { format } from 'date-fns';
import { Button } from '@/components/ui/button';
import { Trash2 } from 'lucide-react';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import Image from 'next/image';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';
import { JournalEntry } from '@/lib/types';

export function JournalEntryCard({ entry }: { entry: JournalEntry }) {
  const { deleteJournalEntry, updateJournalEntryNotes } = useJournalStore();
  const { toast } = useToast();
  const [notes, setNotes] = React.useState(entry.notes);

  const handleNotesSave = () => {
    updateJournalEntryNotes(entry.id, notes);
    toast({
      title: "Notes Updated",
      description: "Your changes have been saved successfully.",
    });
  };

  return (
      <Card className="mb-4">
          <CardHeader>
              <div className="flex items-start justify-between">
                  <div>
                      <CardTitle>{entry.title}</CardTitle>
                      <CardDescription>
                          Captured via {entry.sourceType} on {format(new Date(entry.createdAt), 'h:mm a')}
                      </CardDescription>
                  </div>
                  <AlertDialog>
                      <AlertDialogTrigger asChild>
                          <Button variant="ghost" size="icon" aria-label="Delete journal entry">
                              <Trash2 className="h-5 w-5 text-destructive" />
                          </Button>
                      </AlertDialogTrigger>
                      <AlertDialogContent>
                          <AlertDialogHeader>
                              <AlertDialogTitle>Are you sure?</AlertDialogTitle>
                              <AlertDialogDescription>
                                  This action cannot be undone. This will permanently delete this journal entry.
                              </AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                              <AlertDialogCancel>Cancel</AlertDialogCancel>
                              <AlertDialogAction onClick={() => deleteJournalEntry(entry.id)}>Delete</AlertDialogAction>
                          </AlertDialogFooter>
                      </AlertDialogContent>
                  </AlertDialog>
              </div>
          </CardHeader>
          <CardContent>
              <Accordion type="single" collapsible className="w-full">
                  {entry.sourceType !== 'text' && entry.sourceData && (
                      <AccordionItem value="source">
                          <AccordionTrigger>View Source</AccordionTrigger>
                          <AccordionContent>
                              {entry.sourceType === 'image' && (
                                  <Image src={entry.sourceData!} alt="Captured image" width={400} height={300} className="rounded-md object-contain" />
                              )}
                              {(entry.sourceType === 'audio' || entry.sourceType === 'live') && (
                                  <audio controls src={entry.sourceData} className="w-full" />
                              )}
                          </AccordionContent>
                      </AccordionItem>
                  )}
                   <AccordionItem value="notes">
                      <AccordionTrigger>View/Edit Notes</AccordionTrigger>
                      <AccordionContent className="space-y-2">
                        <Textarea 
                          value={notes} 
                          onChange={(e) => setNotes(e.target.value)} 
                          rows={8}
                          className="text-sm"
                        />
                        <Button onClick={handleNotesSave} size="sm">Save Notes</Button>
                      </AccordionContent>
                   </AccordionItem>
                  <AccordionItem value="prayer-points">
                      <AccordionTrigger>View Prayer Points ({entry.prayerPoints.length})</AccordionTrigger>
                      <AccordionContent>
                          {entry.prayerPoints.length > 0 ? (
                              <ul className="space-y-2">
                                  {entry.prayerPoints.map((pp, index) => (
                                      <li key={index} className="p-2 border rounded-md">
                                          <p className="font-medium">{pp.point}</p>
                                          <p className="text-sm text-muted-foreground">{pp.bibleVerse}</p>
                                      </li>
                                  ))}
                              </ul>
                          ) : "No prayer points were generated."}
                      </AccordionContent>
                  </AccordionItem>
              </Accordion>
          </CardContent>
      </Card>
  );
}

export function JournalList() {
    const { entries, isLoaded: isJournalLoaded } = useJournalStore();
    
    if (!isJournalLoaded) {
        return (
           <div className="space-y-4">
              <Skeleton className="h-12 w-full" />
              <Skeleton className="h-28 w-full" />
              <Skeleton className="h-28 w-full" />
          </div>
        );
    }

    if (entries.length === 0) {
        return (
            <div className="flex flex-col items-center justify-center h-[calc(100vh-400px)] text-center text-muted-foreground">
              <p className="text-lg font-medium">Your Journal is Empty</p>
              <p className="text-sm">Use the 'Take Note' button to start capturing your thoughts.</p>
            </div>
        );
    }

    return (
        <div className="space-y-4">
        {entries.map(entry => (
          <JournalEntryCard key={entry.id} entry={entry} />
        ))}
      </div>
    );
}
