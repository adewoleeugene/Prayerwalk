
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
import { Loader2, Mic, Upload, Square, NotebookText, Save, FileText, Image as ImageIcon, Music, Check, Pause, Play } from 'lucide-react';
import { ScrollArea } from './ui/scroll-area';
import { generatePrayerPointsFromText } from '@/ai/flows/generate-prayer-points-from-text';
import { Textarea } from './ui/textarea';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Checkbox } from './ui/checkbox';
import { proposeCategory } from '@/ai/flows/propose-category-flow';
import { analyzeSermonDocument } from '@/ai/flows/analyze-sermon-document';
import mammoth from 'mammoth';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { cn } from '@/lib/utils';
import { extractTextFromDocument } from '@/ai/flows/extract-text-from-document';


type IntelligentCaptureDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
};

type PrayerPoint = { point: string; bibleVerse: string; };

type CaptureResult = {
  title: string;
  sourceType: 'text' | 'image' | 'audio' | 'live' | 'document';
  sourceData?: string;
  notes: string;
  summary?: string; // Add summary field
  prayerPoints: PrayerPoint[];
};

export function IntelligentCaptureDialog({ open, onOpenChange }: IntelligentCaptureDialogProps) {
  const { addJournalEntry } = useJournalStore();
  const { addPrayers, categories, addCategory } = usePrayerStore();
  const { toast } = useToast();
  const imageInputRef = useRef<HTMLInputElement>(null);
  const audioInputRef = useRef<HTMLInputElement>(null);
  const documentInputRef = useRef<HTMLInputElement>(null);
  
  const [isLoading, setIsLoading] = useState(false);
  const [loadingMessage, setLoadingMessage] = useState('Analyzing...');
  const [result, setResult] = useState<CaptureResult | null>(null);
  const [currentTab, setCurrentTab] = useState('text');
  const [textInput, setTextInput] = useState("");
  const [captureTitle, setCaptureTitle] = useState("");
  const [selectedPoints, setSelectedPoints] = useState<number[]>([]);
  
  // State for individual categories. Key is the prayer point index.
  const [pointCategories, setPointCategories] = useState<Record<number, string>>({});
  
  // Live recording state
  const [isRecording, setIsRecording] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);

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

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>, type: 'image' | 'audio' | 'document') => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsLoading(true);
    setResult(null);
    
    try {
        if (type === 'document') {
            if (file.name.endsWith('.docx')) {
                setLoadingMessage('Analyzing document...');
                const arrayBuffer = await file.arrayBuffer();
                const { value: text } = await mammoth.extractRawText({ arrayBuffer });
                
                const response = await generatePrayerPointsFromText({ text });
                setResult({
                    title: file.name,
                    sourceType: 'document',
                    notes: response.notes,
                    prayerPoints: response.prayerPoints,
                });
                setSelectedPoints(response.prayerPoints.map((_, i) => i));

            } else { // Handles PDF
                setLoadingMessage('Analyzing PDF document...');
                const reader = new FileReader();
                reader.readAsDataURL(file);
                reader.onloadend = async () => {
                    try {
                        const dataUri = reader.result as string;
                        const response = await analyzeSermonDocument({ documentDataUri: dataUri });
                        setResult({
                            title: response.title || captureTitle,
                            sourceType: 'document',
                            sourceData: dataUri,
                            notes: response.coreMessageSummary,
                            prayerPoints: response.prayerPoints.map(p => ({ point: p, bibleVerse: ''})),
                        });
                        setSelectedPoints(response.prayerPoints.map((_, i) => i));
                    } catch (error) {
                        console.error(`Error processing ${type}:`, error);
                        toast({ variant: "destructive", title: `Failed to process ${type}`, description: "An error occurred. Please try another file." });
                    } finally {
                        setIsLoading(false);
                    }
                 }
                 return; // Prevent outer finally from running early
            }
        } else if (type === 'audio') {
            setLoadingMessage('Transcribing audio...');
            const reader = new FileReader();
            reader.readAsDataURL(file);
            reader.onloadend = async () => {
              try {
                const dataUri = reader.result as string;
                const { text } = await extractTextFromDocument({ documentDataUri: dataUri });
                setTextInput(text);
                setCurrentTab('text');
                toast({
                  title: 'Transcription Complete',
                  description: 'Review the text and generate prayer points.',
                });
              } catch (error) {
                console.error('Error transcribing audio:', error);
                toast({ variant: 'destructive', title: 'Transcription Failed' });
              } finally {
                setIsLoading(false);
              }
            };
            return;
        } else { // Handles Image
            const reader = new FileReader();
            reader.readAsDataURL(file);
            reader.onloadend = async () => {
                try {
                    const dataUri = reader.result as string;
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
                        setSelectedPoints(response.prayerPoints.map((_, i) => i));
                    }
                } catch (error) {
                    console.error(`Error processing ${type}:`, error);
                    toast({ variant: "destructive", title: `Failed to process ${type}`, description: "An error occurred. Please try another file." });
                } finally {
                    setIsLoading(false);
                }
            }
            return; // Prevent outer finally from running early
      }
    } catch (error) {
      console.error(`Error processing ${type}:`, error);
      toast({
        variant: "destructive",
        title: `Failed to process ${type}`,
        description: "An error occurred. Please try another file.",
      });
    }
    setIsLoading(false);
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
          setSelectedPoints(response.prayerPoints.map((_, i) => i));
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
          setLoadingMessage('Transcribing & Summarizing...');
          try {
            const response = await transcribeAudioToPrayerPoints({ audioDataUri: dataUri });
            setResult({
              title: captureTitle,
              sourceType: 'live',
              sourceData: dataUri,
              summary: response.summary,
              notes: response.notes,
              prayerPoints: response.prayerPoints
            });
            setSelectedPoints(response.prayerPoints.map((_, i) => i));
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
      setIsPaused(false);
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
    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
        mediaRecorderRef.current.stop();
    }
    setIsRecording(false);
    setIsPaused(false);
  };
  
  const handlePauseRecording = () => {
    if (mediaRecorderRef.current && mediaRecorderRef.current.state === 'recording') {
      mediaRecorderRef.current.pause();
      setIsPaused(true);
    }
  };

  const handleResumeRecording = () => {
    if (mediaRecorderRef.current && mediaRecorderRef.current.state === 'paused') {
      mediaRecorderRef.current.resume();
      setIsPaused(false);
    }
  };


  const handleSaveEntry = async () => {
    if (!result) return;
    if (selectedPoints.length === 0) {
        toast({
            variant: "destructive",
            title: "No Prayer Points Selected",
            description: "Please select at least one prayer point to save.",
        });
        return;
    }

    setIsLoading(true);
    setLoadingMessage('Saving entry and prayers...');

    try {
      const prayersToSaveWithCategories = selectedPoints.map(index => {
        const prayerPoint = result.prayerPoints[index];
        const categoryId = pointCategories[index];
        return {
          title: prayerPoint.point,
          bibleVerse: prayerPoint.bibleVerse,
          categoryId: categoryId,
          notes: result.sourceType === 'text' ? result.notes : undefined,
        };
      });

      if (prayersToSaveWithCategories.some(p => !p.categoryId)) {
        toast({
          variant: 'destructive',
          title: 'Category Missing',
          description: 'Please select a category for all selected prayer points.'
        });
        setIsLoading(false);
        return;
      }
      
      addPrayers(prayersToSaveWithCategories);
      
      // The journal entry notes will be the summary if available, otherwise the full notes.
      const journalNotes = result.summary || result.notes;

      addJournalEntry({ 
          title: captureTitle,
          notes: journalNotes,
          sourceType: result.sourceType,
          sourceData: result.sourceData,
          prayerPoints: result.prayerPoints.filter((_, index) => selectedPoints.includes(index)),
      });
      
      toast({
        title: "Entry Saved!",
        description: `Journal entry and ${prayersToSaveWithCategories.length} prayer point(s) added.`,
      });


      resetAllTabs();
      onOpenChange(false);
    } catch(error) {
       console.error("Error saving entry:", error);
       toast({
         variant: "destructive",
         title: "Save Failed",
         description: "An error occurred while saving your entry. Please try again.",
       });
    } finally {
      setIsLoading(false);
    }
  };
  
  const handleTogglePrayerPoint = (index: number) => {
    setSelectedPoints(prev => 
      prev.includes(index) ? prev.filter(i => i !== index) : [...prev, index]
    );
  };
  
  const handlePointCategoryChange = (index: number, categoryId: string) => {
    setPointCategories(prev => ({...prev, [index]: categoryId}));
  }
  
  const handleAutoCategorize = async () => {
    if (!result || result.prayerPoints.length === 0) return;

    setLoadingMessage("Categorizing...");
    setIsLoading(true);

    try {
        const prayerPointsText = result.prayerPoints.map(p => p.point);
        const availableCategories = categories.map(c => ({ id: c.id, name: c.name }));

        const suggestion = await proposeCategory({
            prayerPoints: prayerPointsText,
            categories: availableCategories,
        });

        let finalCategoryId: string | undefined = suggestion.existingCategoryId;

        if (suggestion.newCategoryName) {
            toast({ title: "New Category Suggested", description: `Creating and selecting "${suggestion.newCategoryName}"`});
            const newCategory = await addCategory({ name: suggestion.newCategoryName });
            finalCategoryId = newCategory.id;
        }
        
        if (finalCategoryId) {
            const newPointCategories = result.prayerPoints.reduce((acc, _, index) => {
                if (selectedPoints.includes(index)) { // Only set for selected points
                    acc[index] = finalCategoryId!;
                }
                return acc;
            }, {} as Record<number, string>);
            setPointCategories(prev => ({ ...prev, ...newPointCategories }));
        }
    } catch (error) {
        console.error("Failed to auto-categorize:", error);
        toast({ variant: 'destructive', title: 'Auto-categorization failed.' });
    } finally {
        setIsLoading(false);
    }
};

useEffect(() => {
    if (result && result.prayerPoints.length > 0) {
        handleAutoCategorize();
    }
// eslint-disable-next-line react-hooks/exhaustive-deps
}, [result]);


  const resetAllTabs = () => {
    setResult(null);
    setIsLoading(false);
    setTextInput("");
    if (imageInputRef.current) imageInputRef.current.value = "";
    if (audioInputRef.current) audioInputRef.current.value = "";
    if (documentInputRef.current) documentInputRef.current.value = "";
    setCaptureTitle("");
    setSelectedPoints([]);
    setPointCategories({});
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

            {result.summary && (
              <div>
                  <h3 className="font-semibold mb-2">Summary</h3>
                  <p className="text-sm text-muted-foreground p-3 bg-secondary/50 rounded-md border">{result.summary}</p>
              </div>
            )}
            
            <div>
              <h3 className="font-semibold mb-2">Prayer Points</h3>
              <ScrollArea className="h-48">
                <div className="space-y-3 p-1">
                  {result.prayerPoints.length > 0 ? result.prayerPoints.map((p, index) => {
                    const isSelected = selectedPoints.includes(index);
                    const categoryId = pointCategories[index] || '';
                    return (
                        <div key={index} className="flex items-start space-x-3 p-2 rounded-md border">
                          <Checkbox
                            id={`pp-${index}`}
                            checked={isSelected}
                            onCheckedChange={() => handleTogglePrayerPoint(index)}
                            className="mt-1"
                          />
                          <div className="grid gap-1.5 leading-none flex-1">
                            <label htmlFor={`pp-${index}`} className={cn("text-sm font-medium leading-none")}>
                              {p.point}
                            </label>
                            {p.bibleVerse && <p className="text-xs text-muted-foreground">{p.bibleVerse}</p>}
                            <Select
                                value={categoryId}
                                onValueChange={(value) => handlePointCategoryChange(index, value)}
                            >
                                <SelectTrigger className="h-8 text-xs mt-1">
                                    <SelectValue placeholder="Select category..." />
                                </SelectTrigger>
                                <SelectContent>
                                    {categories.map(c => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}
                                </SelectContent>
                            </Select>
                          </div>
                        </div>
                    );
                  }) : <p className="text-sm text-muted-foreground text-center py-4">No prayer points generated.</p>}
                </div>
              </ScrollArea>
            </div>
            
            <div className="grid grid-cols-1 gap-2">
               <Button onClick={handleSaveEntry} disabled={selectedPoints.length === 0}>
                <Save className="mr-2 h-4 w-4"/> Save Entry &amp; Selected Point(s)
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
                <Button onClick={() => audioInputRef.current?.click()}><Upload className="mr-2 h-4 w-4"/> Upload Audio</Button>
                <input type="file" accept="audio/mp3, audio/mpeg, audio/wav, audio/aac, audio/ogg, audio/webm, audio/flac" ref={audioInputRef} className="hidden" onChange={(e) => handleFileChange(e, 'audio')} />
            </div>
        )
    }
    
    if (currentTab === 'file') {
        return (
            <div className="text-center space-y-4 p-4 border-2 border-dashed rounded-lg flex flex-col items-center justify-center h-[350px]">
                <p>Upload a document file (pdf, docx).</p>
                <Button onClick={() => documentInputRef.current?.click()}><Upload className="mr-2 h-4 w-4"/> Upload File</Button>
                <input type="file" accept=".pdf,.doc,.docx,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document" ref={documentInputRef} className="hidden" onChange={(e) => handleFileChange(e, 'document')} />
            </div>
        );
    }

    if (currentTab === 'live') {
        return (
            <div className="text-center space-y-4 p-4 border-2 border-dashed rounded-lg flex flex-col items-center justify-center h-[350px]">
                {!isRecording && (
                    <>
                        <p className="text-lg font-medium">Start recording to capture live audio</p>
                        <Button 
                            onClick={handleStartRecording} 
                            className="w-24 h-24 rounded-full"
                            size="icon"
                        >
                            <Mic className="h-10 w-10" />
                        </Button>
                         <p className="text-sm text-muted-foreground">
                            We'll process the audio when you stop.
                        </p>
                    </>
                )}
                {isRecording && (
                    <div className="flex flex-col items-center gap-4">
                        <p className="text-lg font-medium">
                            {isPaused ? "Recording Paused" : "Recording in progress..."}
                        </p>
                        <div className="flex items-center gap-4">
                            <Button 
                                onClick={isPaused ? handleResumeRecording : handlePauseRecording}
                                variant="secondary"
                                size="lg"
                            >
                                {isPaused ? <Play className="mr-2" /> : <Pause className="mr-2" />}
                                {isPaused ? "Resume" : "Pause"}
                            </Button>
                            <Button
                                onClick={handleStopRecording}
                                variant="destructive"
                                size="lg"
                            >
                                <Square className="mr-2" />
                                Stop
                            </Button>
                        </div>
                    </div>
                )}
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
           <TabsList className="grid w-full grid-cols-5">
              <TabsTrigger value="text" className="flex items-center gap-1">
                <NotebookText className="h-4 w-4" />
                <span>Text</span>
              </TabsTrigger>
              <TabsTrigger value="image" className="flex items-center gap-1">
                <ImageIcon className="h-4 w-4" />
                <span>Image</span>
              </TabsTrigger>
              <TabsTrigger value="audio" className="flex items-center gap-1">
                <Music className="h-4 w-4" />
                <span>Audio</span>
              </TabsTrigger>
              <TabsTrigger value="file" className="flex items-center gap-1">
                <FileText className="h-4 w-4" />
                <span>File</span>
              </TabsTrigger>
              <TabsTrigger value="live" className="flex items-center gap-1">
                <Mic className="h-4 w-4" />
                <span>Live</span>
              </TabsTrigger>
          </TabsList>
          
          <div className="mt-4 min-h-[420px]">
            {renderContent()}
          </div>

        </Tabs>
      </DialogContent>
    </Dialog>
    </>
  );
}
