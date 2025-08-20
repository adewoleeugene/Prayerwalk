
"use client";

import React, { useState } from 'react';
import { useJournalStore } from '@/hooks/use-journal-store';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Skeleton } from '@/components/ui/skeleton';
import { format, isSameDay } from 'date-fns';
import { Button } from '@/components/ui/button';
import { Trash2, ArrowLeft, Send, Loader2 } from 'lucide-react';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import Image from 'next/image';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';
import { JournalEntry } from '@/lib/types';
import { useRouter } from 'next/navigation';
import { askQuestionOnNotes } from '@/ai/flows/ask-question-on-notes-flow';
import { Input } from '@/components/ui/input';

export function JournalEntryCard({ entry }: { entry: JournalEntry }) {
  const { deleteJournalEntry, updateJournalEntryNotes, updateJournalEntryQaHistory } = useJournalStore();
  const { toast } = useToast();
  const [notes, setNotes] = React.useState(entry.notes);

  const [question, setQuestion] = useState("");
  const [isAsking, setIsAsking] = useState(false);
  const qaHistory = entry.qaHistory || [];

  const handleNotesSave = () => {
    updateJournalEntryNotes(entry.id, notes);
    toast({
      title: "Notes Updated",
      description: "Your changes have been saved successfully.",
    });
  };

  const handleAskQuestion = async () => {
    if (!question.trim()) return;

    setIsAsking(true);
    try {
        const result = await askQuestionOnNotes({ notes: entry.notes, question });
        updateJournalEntryQaHistory(entry.id, { question, answer: result.answer });
        setQuestion(""); // Clear input after asking
    } catch (error) {
        console.error("Error asking question:", error);
        toast({
            variant: "destructive",
            title: "Error",
            description: "Could not get an answer at this time.",
        });
    } finally {
        setIsAsking(false);
    }
  }

  return (
      <Card className="mb-4">
          <CardHeader>
              <div className="flex items-start justify-between">
                  <div>
                      <CardTitle>{entry.title}</CardTitle>
                      <CardDescription>
                          Captured via {entry.sourceType} on {format(new Date(entry.createdAt), 'MMMM d, yyyy h:mm a')}
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
                          ) : <p className="text-sm text-muted-foreground">No prayer points were generated for this entry.</p>}
                      </AccordionContent>
                  </AccordionItem>
                   <AccordionItem value="q-and-a">
                        <AccordionTrigger>Ask a Question</AccordionTrigger>
                        <AccordionContent className="space-y-4">
                            <div className="space-y-2">
                                {qaHistory.map((qa, index) => (
                                    <div key={index} className="space-y-2">
                                        <p className="p-2 bg-secondary rounded-md text-sm"><strong>You:</strong> {qa.question}</p>
                                        <p className="p-2 bg-primary/10 rounded-md text-sm"><strong>AI:</strong> {qa.answer}</p>
                                    </div>
                                ))}
                            </div>
                            <div className="flex items-center gap-2">
                                <Input 
                                    placeholder="Ask about your notes..."
                                    value={question}
                                    onChange={(e) => setQuestion(e.target.value)}
                                    onKeyDown={(e) => e.key === 'Enter' && handleAskQuestion()}
                                />
                                <Button onClick={handleAskQuestion} disabled={isAsking} size="icon">
                                    {isAsking ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
                                </Button>
                            </div>
                        </AccordionContent>
                    </AccordionItem>
              </Accordion>
          </CardContent>
      </Card>
  );
}

export function JournalList({ filterDate }: { filterDate?: Date }) {
    const { entries, isLoaded: isJournalLoaded } = useJournalStore();
    
    const filteredEntries = React.useMemo(() => {
        if (!filterDate) {
            return entries;
        }
        return entries.filter(entry => isSameDay(new Date(entry.createdAt), filterDate));
    }, [entries, filterDate]);

    if (!isJournalLoaded) {
        return (
           <div className="space-y-4">
              <Skeleton className="h-12 w-full" />
              <Skeleton className="h-28 w-full" />
              <Skeleton className="h-28 w-full" />
          </div>
        );
    }

    if (filteredEntries.length === 0) {
        return (
            <div className="flex flex-col items-center justify-center h-[calc(100vh-400px)] text-center text-muted-foreground">
              <p className="text-lg font-medium">No Journal Entries for this day</p>
              <p className="text-sm">Use the 'Take Note' button to capture your thoughts.</p>
            </div>
        );
    }

    return (
        <div className="space-y-4">
        {filteredEntries.map(entry => (
          <JournalEntryCard key={entry.id} entry={entry} />
        ))}
      </div>
    );
}

export function JournalPage() {
    const router = useRouter();
    return (
      <>
        <header className="flex items-center p-4 border-b bg-background/80 backdrop-blur-sm sticky top-0 z-10">
          <Button variant="ghost" size="icon" onClick={() => router.push('/')}>
              <ArrowLeft />
          </Button>
          <h1 className="text-xl font-bold font-headline mx-auto">Journal</h1>
          <div className="w-10" />
        </header>
        <ScrollArea className="h-[calc(100vh-129px)] md:h-[calc(100vh-65px)]">
          <main className="p-4 md:p-6 space-y-6">
              <JournalList />
          </main>
        </ScrollArea>
      </>
    );
  }
  
  export default JournalPage;
