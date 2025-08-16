
"use client";

import React, { useState, useRef, useEffect } from 'react';
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { convertImageTextToPrayerPoints } from '@/ai/flows/convert-image-text-to-prayer-points';
import { transcribeAudioToPrayerPoints } from '@/ai/flows/transcribe-audio-to-prayer-points';
import { useToast } from '@/hooks/use-toast';
import { useJournalStore } from '@/hooks/use-journal-store';
import { usePrayerStore } from '@/hooks/use-prayer-store';
import { Loader2, Mic, Upload, Square, NotebookText, Save, Library } from 'lucide-react';
import { ScrollArea } from './ui/scroll-area';
import { generatePrayerPointsFromText } from '@/ai/flows/generate-prayer-points-from-text';
import { Textarea } from './ui/textarea';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Checkbox } from './ui/checkbox';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { Form, FormControl, FormField, FormItem, FormMessage } from './ui/form';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { AlertDialog, AlertDialogContent, AlertDialogHeader, AlertDialogTitle, AlertDialogDescription, AlertDialogFooter, AlertDialogCancel, AlertDialogAction } from './ui/alert-dialog';
import { suggestCategory } from '@/ai/flows/suggest-category-flow';


type IntelligentCaptureDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
};

type PrayerPoint = { point: string; bibleVerse: string; };

type CaptureResult = {
  title: string;
  sourceType: 'text' | 'image' | 'audio' | 'live';
  sourceData?: string;
  notes: string;
  prayerPoints: PrayerPoint[];
};

const AddPrayersSchema = z.object({
  categoryId: z.string().min(1, "Please select a category."),
});

export function IntelligentCaptureDialog({ open, onOpenChange }: IntelligentCaptureDialogProps) {
  const { addJournalEntry } = useJournalStore();
  const { addPrayers, categories } = usePrayerStore();
  const { toast } = useToast();
  const imageInputRef = useRef<HTMLInputElement>(null);
  const audioInputRef = useRef<HTMLInputElement>(null);
  
  const [isLoading, setIsLoading] = useState(false);
  const [loadingMessage, setLoadingMessage] = useState('Analyzing...');
  const [result, setResult] = useState<CaptureResult | null>(null);
  const [editableNotes, setEditableNotes] = useState('');
  const [currentTab, setCurrentTab] = useState('text');
  const [textInput, setTextInput] = useState("");
  const [captureTitle, setCaptureTitle] = useState("");
  const [selectedPoints, setSelectedPoints] = useState<number[]>([]);
  const [isCategoryDialogOpen, setIsCategoryDialogOpen] = useState(false);
  const [isSuggestingCategory, setIsSuggestingCategory] = useState(false);

  // Live recording state
  const [isRecording, setIsRecording] = useState(false);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);

  const form = useForm<z.infer<typeof AddPrayersSchema>>({
    resolver: zodResolver(AddPrayersSchema),
    defaultValues: { categoryId: "" }
  });

  useEffect(() => {
    if (open) {
        resetAllTabs();
        setCaptureTitle(`Capture - ${new Date().toLocaleString()}`);
    }
  }, [open]);

  useEffect(() => {
    if (open && isRecording) {
      handleStopRecording();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>, type: 'image' | 'audio') => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsLoading(true);
    setResult(null);

    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onloadend = async () => {
      const dataUri = reader.result as string;
      try {
        if (type === 'image') {
          setLoadingMessage('Analyzing image...');
          const response = await convertImageTextToPrayerPoints({ photoDataUri: dataUri });
          setResult({
            title: captureTitle,
            sourceType: 'image',
            sourceData: dataUri,
            notes: response.extractedText,
            prayerPoints: response.prayerPoints,
          });
          setEditableNotes(response.extractedText);
          setSelectedPoints([]);
        } else {
          setLoadingMessage('Transcribing audio...');
          const response = await transcribeAudioToPrayerPoints({ audioDataUri: dataUri });
          setResult({
            title: captureTitle,
            sourceType: 'audio',
            sourceData: dataUri,
            notes: response.notes,
            prayerPoints: response.prayerPoints,
          });
          setEditableNotes(response.notes);
          setSelectedPoints([]);
        }
      } catch (error) {
        console.error(`Error processing ${type}:`, error);
        toast({
          variant: "destructive",
          title: `Failed to process ${type}`,
          description: "An error occurred. Please try another file.",
        });
      } finally {
        setIsLoading(false);
      }
    };
  };

  const handleGenerateFromText = async () => {
      if (!textInput.trim()) {
          toast({ variant: 'destructive', title: 'Text is empty', description: 'Please enter some text to generate prayer points.' });
          return;
      }
      setIsLoading(true);
      setResult(null);
      setLoadingMessage('Generating prayer points...');
      try {
          const response = await generatePrayerPointsFromText({ text: textInput });
          setResult({
            title: captureTitle,
            sourceType: 'text',
            notes: response.notes,
            prayerPoints: response.prayerPoints,
          });
          setEditableNotes(response.notes);
          setSelectedPoints([]);
      } catch (error) {
          console.error("Error generating from text:", error);
          toast({ variant: 'destructive', title: 'Generation Failed' });
      } finally {
          setIsLoading(false);
      }
  }

  const handleStartRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      audioChunksRef.current = [];
      mediaRecorderRef.current = new MediaRecorder(stream, { mimeType: 'audio/webm' });
      
      mediaRecorderRef.current.ondataavailable = (event) => {
        audioChunksRef.current.push(event.data);
      };

      mediaRecorderRef.current.onstop = async () => {
        const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
        const reader = new FileReader();
        reader.readAsDataURL(audioBlob);
        reader.onloadend = async () => {
          const dataUri = reader.result as string;
          setIsLoading(true);
          setResult(null);
          setLoadingMessage('Transcribing audio...');
          try {
            const response = await transcribeAudioToPrayerPoints({ audioDataUri: dataUri });
            setResult({
              title: captureTitle,
              sourceType: 'live',
              sourceData: dataUri,
              notes: response.notes,
              prayerPoints: response.prayerPoints
            });
            setEditableNotes(response.notes);
            setSelectedPoints([]);
          } catch (error) {
              console.error("Error transcribing audio:", error);
              toast({ variant: 'destructive', title: 'Transcription Failed' });
          } finally {
              setIsLoading(false);
          }
        };
      };
      
      mediaRecorderRef.current.start();
      setIsRecording(true);
    } catch (err) {
      console.error("Error accessing microphone:", err);
      toast({
        variant: "destructive",
        title: "Microphone Access Denied",
        description: "Please allow microphone access in your browser settings.",
      });
    }
  };

  const handleStopRecording = () => {
    if (mediaRecorderRef.current && mediaRecorderRef.current.state === 'recording') {
        mediaRecorderRef.current.stop();
    }
    setIsRecording(false);
  };
  
  const handleSaveJournalEntry = () => {
    if (!result) return;
    addJournalEntry({ 
        title: captureTitle,
        notes: editableNotes,
        sourceType: result.sourceType,
        sourceData: result.sourceData,
        prayerPoints: [], // Prayer points are saved separately to the library
    });
    toast({ title: "Journal Entry Saved", description: `"${captureTitle}" has been added to your journal.` });
    resetAllTabs();
    onOpenChange(false);
  };
  
  const handleTogglePrayerPoint = (index: number) => {
    setSelectedPoints(prev => 
      prev.includes(index) ? prev.filter(i => i !== index) : [...prev, index]
    );
  };

  const handleAddPrayersClick = async () => {
    if (!result || selectedPoints.length === 0) return;
    setIsSuggestingCategory(true);
    setIsCategoryDialogOpen(true);

    try {
        const selectedPrayerPointsText = selectedPoints.map(index => result.prayerPoints[index].point);
        const availableCategories = categories.map(c => ({ id: c.id, name: c.name }));
        
        const { categoryId } = await suggestCategory({
            prayerPoints: selectedPrayerPointsText,
            categories: availableCategories,
        });

        form.setValue('categoryId', categoryId);
    } catch (error) {
        console.error("Failed to suggest category:", error);
        // Fallback to the first category if suggestion fails
        if (categories.length > 0) {
            form.setValue('categoryId', categories[0].id);
        }
    } finally {
        setIsSuggestingCategory(false);
    }
  };


  const onAddPrayersSubmit = (values: z.infer<typeof AddPrayersSchema>) => {
    if (!result || selectedPoints.length === 0) return;

    const prayersToAdd = selectedPoints.map(index => {
      const pp = result.prayerPoints[index];
      return {
        title: pp.point,
        bibleVerse: pp.bibleVerse,
        categoryId: values.categoryId,
        notes: result.sourceType === 'text' ? editableNotes : undefined,
      }
    });

    addPrayers(prayersToAdd);
    toast({
      title: `${selectedPoints.length} Prayer Point(s) Added`,
      description: `Added to the ${categories.find(c => c.id === values.categoryId)?.name} category.`,
    });
    
    setIsCategoryDialogOpen(false);
    resetAllTabs();
    onOpenChange(false);
  }

  const resetAllTabs = () => {
    setResult(null);
    setIsLoading(false);
    setTextInput("");
    if (imageInputRef.current) imageInputRef.current.value = "";
    if (audioInputRef.current) audioInputRef.current.value = "";
    setCaptureTitle("");
    setSelectedPoints([]);
    setEditableNotes('');
    form.reset();
  }
  
  const handleDialogClose = (isOpen: boolean) => {
    if (!isOpen) {
      resetAllTabs();
    }
    onOpenChange(isOpen);
  };

  const handleTabChange = (value: string) => {
    resetAllTabs();
    setCurrentTab(value);
    setCaptureTitle(`Capture - ${new Date().toLocaleString()}`);
  };

  const renderContent = () => {
    if (isLoading) {
      return (
        <div className="flex flex-col items-center justify-center h-[350px]">
          <Loader2 className="h-8 w-8 animate-spin text-primary"/>
          <p className="mt-2">{loadingMessage}</p>
        </div>
      );
    }

    if (result) {
      return (
        <div className="space-y-4">
            <div className="space-y-2">
                <Label htmlFor="capture-title">Title</Label>
                <Input id="capture-title" value={captureTitle} onChange={(e) => setCaptureTitle(e.target.value)} />
            </div>
            <div>
              <h3 className="font-semibold mb-2">Notes (Editable)</h3>
              <Textarea 
                value={editableNotes}
                onChange={(e) => setEditableNotes(e.target.value)}
                rows={5}
                className="text-sm"
              />
            </div>
            <div>
              <h3 className="font-semibold mb-2">Prayer Points (select to save)</h3>
              <ScrollArea className="h-32">
                <div className="space-y-2 p-1">
                  {result.prayerPoints.length > 0 ? result.prayerPoints.map((p, index) => (
                    <div 
                      key={index} 
                      className="flex items-start space-x-3 p-2 rounded-md border has-[:checked]:bg-secondary cursor-pointer"
                      onClick={() => handleTogglePrayerPoint(index)}
                    >
                      <Checkbox
                        id={`pp-${index}`}
                        checked={selectedPoints.includes(index)}
                        className="mt-1"
                      />
                      <div className="grid gap-1.5 leading-none">
                        <label htmlFor={`pp-${index}`} className="text-sm font-medium leading-none cursor-pointer">
                          {p.point}
                        </label>
                        <p className="text-sm text-muted-foreground">{p.bibleVerse}</p>
                      </div>
                    </div>
                  )) : <p className="text-sm text-muted-foreground text-center py-4">No prayer points generated.</p>}
                </div>
              </ScrollArea>
            </div>
            <div className="grid grid-cols-1 gap-2">
              <Button onClick={handleSaveJournalEntry} variant="outline">
                <Save className="mr-2 h-4 w-4"/> Save to Journal
              </Button>
               <Button onClick={handleAddPrayersClick} disabled={selectedPoints.length === 0}>
                <Library className="mr-2 h-4 w-4"/> Add Selected to Library ({selectedPoints.length})
              </Button>
            </div>
        </div>
      );
    }
    
    if (currentTab === 'text') {
        return (
            <div className="space-y-4">
                <Textarea
                    id="text-input"
                    value={textInput}
                    onChange={(e) => setTextInput(e.target.value)}
                    rows={12}
                    placeholder="Type or paste your notes, thoughts, or a transcribed sermon here..."
                />
                 <Button onClick={handleGenerateFromText} className="w-full">Generate Prayer Points</Button>
            </div>
        )
    }

    if (currentTab === 'image') {
        return (
            <div className="text-center space-y-4 p-4 border-2 border-dashed rounded-lg flex flex-col items-center justify-center h-[350px]">
                <p>Upload an image of a slide or notes.</p>
                <Button onClick={() => imageInputRef.current?.click()}><Upload className="mr-2 h-4 w-4"/> Upload Image</Button>
                <input type="file" accept="image/*" ref={imageInputRef} className="hidden" onChange={(e) => handleFileChange(e, 'image')} />
            </div>
        );
    }

    if (currentTab === 'audio') {
        return (
            <div className="text-center space-y-4 p-4 border-2 border-dashed rounded-lg flex flex-col items-center justify-center h-[350px]">
                <p>Upload a sermon or meeting recording.</p>
                <Button onClick={() => audioInputRef.current?.click()}><Mic className="mr-2 h-4 w-4"/> Upload Audio</Button>
                <input type="file" accept="audio/*" ref={audioInputRef} className="hidden" onChange={(e) => handleFileChange(e, 'audio')} />
            </div>
        )
    }

    if (currentTab === 'live') {
        return (
            <div className="text-center space-y-4 p-4 border-2 border-dashed rounded-lg flex flex-col items-center justify-center h-[350px]">
                <p className="text-lg font-medium">{isRecording ? "Recording in progress..." : "Start recording to capture live audio"}</p>
                <Button 
                    onClick={isRecording ? handleStopRecording : handleStartRecording} 
                    variant={isRecording ? "destructive" : "default"}
                    className="w-24 h-24 rounded-full"
                    size="icon"
                >
                    {isRecording ? <Square className="h-10 w-10" /> : <Mic className="h-10 w-10" />}
                </Button>
                 <p className="text-sm text-muted-foreground">
                    {isRecording ? "Click the square to stop." : "We'll process the audio when you stop."}
                </p>
            </div>
        )
    }

    return null;
  }

  return (
    <>
    <Dialog open={open} onOpenChange={handleDialogClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Intelligent Capture</DialogTitle>
          <DialogDescription>Save a new journal entry from text, an image, audio file, or live recording.</DialogDescription>
        </DialogHeader>
        <Tabs defaultValue="text" className="w-full" onValueChange={handleTabChange} value={currentTab}>
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="text"><NotebookText className="h-4 w-4 mr-1"/>Text</TabsTrigger>
            <TabsTrigger value="image">Image</TabsTrigger>
            <TabsTrigger value="audio">Audio</TabsTrigger>
            <TabsTrigger value="live">Live</TabsTrigger>
          </TabsList>
          
          <div className="mt-4 min-h-[380px]">
            {renderContent()}
          </div>

        </Tabs>
      </DialogContent>
    </Dialog>
    <AlertDialog open={isCategoryDialogOpen} onOpenChange={setIsCategoryDialogOpen}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Add to Prayer Library</AlertDialogTitle>
          <AlertDialogDescription>
            Select a category to add the {selectedPoints.length} selected prayer points to. We've suggested one for you.
          </AlertDialogDescription>
        </AlertDialogHeader>
        {isSuggestingCategory ? (
            <div className="flex items-center justify-center h-24">
                <Loader2 className="h-6 w-6 animate-spin" />
                <p className="ml-2">Suggesting category...</p>
            </div>
        ) : (
            <Form {...form}>
            <form id="add-prayers-form" onSubmit={form.handleSubmit(onAddPrayersSubmit)}>
                <FormField control={form.control} name="categoryId" render={({ field }) => (
                <FormItem>
                    <Label>Category</Label>
                    <Select onValueChange={field.onChange} value={field.value}>
                    <FormControl><SelectTrigger><SelectValue placeholder="Select a category" /></SelectTrigger></FormControl>
                    <SelectContent>
                        {categories.map(c => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}
                    </SelectContent>
                    </Select>
                    <FormMessage />
                </FormItem>
                )} />
            </form>
            </Form>
        )}
        <AlertDialogFooter>
          <AlertDialogCancel>Cancel</AlertDialogCancel>
          <AlertDialogAction type="submit" form="add-prayers-form" disabled={isSuggestingCategory}>Add Prayers</AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
    </>
  );
}
