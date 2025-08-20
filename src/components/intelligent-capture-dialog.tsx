
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
import { Loader2, Mic, Upload, Square, NotebookText, Save, FileText, Image as ImageIcon, Music, Check } from 'lucide-react';
import { ScrollArea } from './ui/scroll-area';
import { generatePrayerPointsFromText } from '@/ai/flows/generate-prayer-points-from-text';
import { Textarea } from './ui/textarea';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Checkbox } from './ui/checkbox';
import { suggestCategory } from '@/ai/flows/suggest-category-flow';
import { analyzeSermonDocument } from '@/ai/flows/analyze-sermon-document';
import mammoth from 'mammoth';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';


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
  prayerPoints: PrayerPoint[];
};

export function IntelligentCaptureDialog({ open, onOpenChange }: IntelligentCaptureDialogProps) {
  const { addJournalEntry } = useJournalStore();
  const { addPrayer, addPrayers, categories } = usePrayerStore();
  const { toast } = useToast();
  const imageInputRef = useRef<HTMLInputElement>(null);
  const audioInputRef = useRef<HTMLInputElement>(null);
  const documentInputRef = useRef<HTMLInputElement>(null);
  
  const [isLoading, setIsLoading] = useState(false);
  const [loadingMessage, setLoadingMessage] = useState('Analyzing...');
  const [result, setResult] = useState<CaptureResult | null>(null);
  const [editableNotes, setEditableNotes] = useState('');
  const [currentTab, setCurrentTab] = useState('text');
  const [textInput, setTextInput] = useState("");
  const [captureTitle, setCaptureTitle] = useState("");
  const [selectedPoints, setSelectedPoints] = useState<number[]>([]);
  const [savedPoints, setSavedPoints] = useState<number[]>([]);
  const [selectedCategoryId, setSelectedCategoryId] = useState<string | null>(null);
  
  // Live recording state
  const [isRecording, setIsRecording] = useState(false);
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
  
  useEffect(() => {
    // When results are generated, suggest a category
    if (result && result.prayerPoints.length > 0 && categories.length > 0) {
        const suggest = async () => {
            const prayerPointsText = result.prayerPoints.map(p => p.point);
            const availableCategories = categories.map(c => ({ id: c.id, name: c.name }));
            try {
                const suggestion = await suggestCategory({
                    prayerPoints: prayerPointsText,
                    categories: availableCategories,
                });
                setSelectedCategoryId(suggestion.categoryId);
            } catch (error) {
                console.error("Failed to suggest category, falling back to default.", error);
                if (categories.length > 0) {
                    setSelectedCategoryId(categories[0].id);
                }
            }
        };
        suggest();
    } else if (result && categories.length > 0) {
        setSelectedCategoryId(categories[0].id);
    }
  }, [result, categories]);

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
                setEditableNotes(response.notes);
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
                        setEditableNotes(response.coreMessageSummary);
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
        } else { // Handles Image and Audio
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
                        setEditableNotes(response.extractedText);
                        setSelectedPoints(response.prayerPoints.map((_, i) => i));
                    } else if (type === 'audio') {
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
          setEditableNotes(response.notes);
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
  
  const handleSaveWholeEntry = async () => {
    if (!result || !selectedCategoryId) {
        toast({ variant: 'destructive', title: 'Cannot Save', description: 'No category selected or no results to save.' });
        return;
    }
    setIsLoading(true);
    setLoadingMessage('Saving entry...');

    try {
      const unsavedSelectedPoints = selectedPoints.filter(index => !savedPoints.includes(index));
      const prayersToSave = unsavedSelectedPoints.map(index => result.prayerPoints[index]);
      
      if (prayersToSave.length > 0) {
        const prayersToAdd = prayersToSave.map(pp => ({
          title: pp.point,
          bibleVerse: pp.bibleVerse,
          categoryId: selectedCategoryId,
          notes: result.sourceType === 'text' ? editableNotes : undefined,
        }));
        
        await addPrayers(prayersToAdd);
      }
      
      addJournalEntry({ 
          title: captureTitle,
          notes: editableNotes,
          sourceType: result.sourceType,
          sourceData: result.sourceData,
          prayerPoints: prayersToSave,
          categoryId: selectedCategoryId,
      });
      
      const categoryName = categories.find(c => c.id === selectedCategoryId)?.name || 'a category';
      toast({
        title: "Entry Saved!",
        description: `Journal entry and ${prayersToSave.length} prayer point(s) added to ${categoryName}.`,
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

  const handleSaveIndividualPrayer = async (index: number) => {
    if (!result || !selectedCategoryId) return;

    const prayerPoint = result.prayerPoints[index];
    try {
      await addPrayer({
        title: prayerPoint.point,
        bibleVerse: prayerPoint.bibleVerse,
        categoryId: selectedCategoryId,
        notes: result.sourceType === 'text' ? editableNotes : undefined,
      });
      
      setSavedPoints(prev => [...prev, index]);
      
      toast({
        title: "Prayer Point Saved",
        description: `"${prayerPoint.point}" was added to your library.`,
      });

    } catch (error) {
       console.error("Error saving individual prayer:", error);
       toast({
         variant: "destructive",
         title: "Save Failed",
         description: "Could not save the prayer point.",
       });
    }
  };
  
  const handleTogglePrayerPoint = (index: number) => {
    setSelectedPoints(prev => 
      prev.includes(index) ? prev.filter(i => i !== index) : [...prev, index]
    );
  };

  const resetAllTabs = () => {
    setResult(null);
    setIsLoading(false);
    setTextInput("");
    if (imageInputRef.current) imageInputRef.current.value = "";
    if (audioInputRef.current) audioInputRef.current.value = "";
    if (documentInputRef.current) documentInputRef.current.value = "";
    setCaptureTitle("");
    setSelectedPoints([]);
    setSavedPoints([]);
    setEditableNotes('');
    setSelectedCategoryId(null);
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
            <div className="space-y-2">
                <Label htmlFor="category-select">Save to Category</Label>
                 <Select
                    value={selectedCategoryId || ''}
                    onValueChange={setSelectedCategoryId}
                    disabled={!selectedCategoryId}
                 >
                    <SelectTrigger id="category-select">
                        <SelectValue placeholder={!selectedCategoryId ? "Suggesting category..." : "Select a category"} />
                    </SelectTrigger>
                    <SelectContent>
                        {categories.map(c => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}
                    </SelectContent>
                 </Select>
            </div>
            <div>
              <h3 className="font-semibold mb-2">Prayer Points</h3>
              <ScrollArea className="h-40">
                <div className="space-y-2 p-1">
                  {result.prayerPoints.length > 0 ? result.prayerPoints.map((p, index) => {
                    const isSaved = savedPoints.includes(index);
                    const isSelected = selectedPoints.includes(index);
                    return (
                        <div key={index} className="flex items-center space-x-3 p-2 rounded-md border">
                          <Checkbox
                            id={`pp-${index}`}
                            checked={isSelected}
                            onCheckedChange={() => handleTogglePrayerPoint(index)}
                            disabled={isSaved}
                            className="mt-1"
                          />
                          <div className="grid gap-1.5 leading-none flex-1">
                            <label htmlFor={`pp-${index}`} className={cn("text-sm font-medium leading-none", isSaved && "line-through text-muted-foreground")}>
                              {p.point}
                            </label>
                            {p.bibleVerse && <p className="text-sm text-muted-foreground">{p.bibleVerse}</p>}
                          </div>
                          <Button 
                            size="sm" 
                            variant="outline"
                            disabled={isSaved || !selectedCategoryId}
                            onClick={() => handleSaveIndividualPrayer(index)}
                          >
                            {isSaved ? <Check className="mr-2 h-4 w-4"/> : <Save className="mr-2 h-4 w-4" />}
                            {isSaved ? 'Saved' : 'Save'}
                          </Button>
                        </div>
                    );
                  }) : <p className="text-sm text-muted-foreground text-center py-4">No prayer points generated.</p>}
                </div>
              </ScrollArea>
            </div>
            
            <div className="grid grid-cols-1 gap-2">
               <Button onClick={handleSaveWholeEntry} disabled={!selectedCategoryId || selectedPoints.filter(i => !savedPoints.includes(i)).length === 0}>
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
                <input type="file" accept="audio/*" ref={audioInputRef} className="hidden" onChange={(e) => handleFileChange(e, 'audio')} />
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
