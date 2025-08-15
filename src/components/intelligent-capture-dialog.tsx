"use client";

import React, { useState, useRef } from 'react';
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { convertImageTextToPrayerPoints, ConvertImageTextToPrayerPointsOutput } from '@/ai/flows/convert-image-text-to-prayer-points';
import { transcribeAudioToPrayerPoints } from '@/ai/flows/transcribe-audio-to-prayer-points';
import { useToast } from '@/hooks/use-toast';
import { Checkbox } from './ui/checkbox';
import { Label } from './ui/label';
import { Textarea } from './ui/textarea';
import { usePrayerStore } from '@/hooks/use-prayer-store';
import { Loader2, Mic, Upload } from 'lucide-react';
import { ScrollArea } from './ui/scroll-area';

type IntelligentCaptureDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
};

export function IntelligentCaptureDialog({ open, onOpenChange }: IntelligentCaptureDialogProps) {
  const { addPrayers, categories } = usePrayerStore();
  const { toast } = useToast();
  const imageInputRef = useRef<HTMLInputElement>(null);
  const audioInputRef = useRef<HTMLInputElement>(null);
  
  const [isLoadingImage, setIsLoadingImage] = useState(false);
  const [imageResults, setImageResults] = useState<ConvertImageTextToPrayerPointsOutput | null>(null);
  const [selectedPrayers, setSelectedPrayers] = useState<number[]>([]);

  const [isLoadingAudio, setIsLoadingAudio] = useState(false);
  const [audioResult, setAudioResult] = useState<string | null>(null);
  const [transcribedText, setTranscribedText] = useState("");

  const handleFileChange = async (event: React.ChangeEvent<HTMLInputElement>, type: 'image' | 'audio') => {
    const file = event.target.files?.[0];
    if (!file) return;

    if (type === 'image') setIsLoadingImage(true);
    if (type === 'audio') setIsLoadingAudio(true);
    
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = async () => {
      const dataUri = reader.result as string;
      try {
        if (type === 'image') {
          const result = await convertImageTextToPrayerPoints({ photoDataUri: dataUri });
          setImageResults(result);
        }
        if (type === 'audio') {
          const result = await transcribeAudioToPrayerPoints({ audioDataUri: dataUri });
          setAudioResult(result.transcribedText);
          setTranscribedText(result.transcribedText);
        }
      } catch (error) {
        toast({ variant: "destructive", title: "AI Processing Failed", description: "Could not process the file. Please try again." });
        console.error(error);
      } finally {
        if (type === 'image') setIsLoadingImage(false);
        if (type === 'audio') setIsLoadingAudio(false);
      }
    };
    reader.onerror = () => {
        toast({ variant: "destructive", title: "File Read Error", description: "Could not read the selected file." });
        if (type === 'image') setIsLoadingImage(false);
        if (type === 'audio') setIsLoadingAudio(false);
    };
  };

  const handleAddSelectedPrayers = () => {
    if (!imageResults || !categories.length) return;
    const defaultCategoryId = categories[0].id;

    const prayersToAdd = imageResults.prayerPoints
      .filter((_, index) => selectedPrayers.includes(index))
      .map(p => ({ title: p.point, bibleVerse: p.bibleVerse, categoryId: defaultCategoryId }));

    addPrayers(prayersToAdd);
    toast({ title: "Prayers Added", description: `${prayersToAdd.length} prayer points added to your library.` });
    resetImageTab();
    onOpenChange(false);
  };
  
  const resetImageTab = () => {
    setImageResults(null);
    setSelectedPrayers([]);
    if (imageInputRef.current) imageInputRef.current.value = "";
  }
  
  const resetAudioTab = () => {
    setAudioResult(null);
    setTranscribedText("");
    if (audioInputRef.current) audioInputRef.current.value = "";
  }
  
  const handleDialogClose = (isOpen: boolean) => {
    if (!isOpen) {
      resetAudioTab();
      resetImageTab();
    }
    onOpenChange(isOpen);
  };

  const handleTabChange = (value: string) => {
    if (value === 'image') resetAudioTab();
    if (value === 'audio') resetImageTab();
  };

  return (
    <Dialog open={open} onOpenChange={handleDialogClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Intelligent Capture</DialogTitle>
          <DialogDescription>Generate prayer points from an image or audio file.</DialogDescription>
        </DialogHeader>
        <Tabs defaultValue="image" className="w-full" onValueChange={handleTabChange}>
          <TabsList className="grid w-full grid-cols-2"><TabsTrigger value="image">From Image</TabsTrigger><TabsTrigger value="audio">From Audio</TabsTrigger></TabsList>
          
          <TabsContent value="image" className="mt-4 min-h-[300px]">
            {!isLoadingImage && !imageResults && (
              <div className="text-center space-y-4 p-4 border-2 border-dashed rounded-lg flex flex-col items-center justify-center h-full">
                <p>Upload an image of a slide or notes.</p>
                <Button onClick={() => imageInputRef.current?.click()}><Upload className="mr-2 h-4 w-4"/> Upload Image</Button>
                <input type="file" accept="image/*" ref={imageInputRef} className="hidden" onChange={(e) => handleFileChange(e, 'image')} />
              </div>
            )}
            {isLoadingImage && (
              <div className="flex flex-col items-center justify-center h-[300px]"><Loader2 className="h-8 w-8 animate-spin text-primary"/><p className="mt-2">Analyzing image...</p></div>
            )}
            {imageResults && (
              <div className="space-y-4"><p>Select the prayer points to add:</p>
                <ScrollArea className="h-64"><div className="space-y-2 p-1">
                  {imageResults.prayerPoints.map((p, index) => (
                    <div key={index} className="flex items-start space-x-2 p-2 rounded-md border">
                       <Checkbox id={`prayer-${index}`} checked={selectedPrayers.includes(index)} onCheckedChange={(checked) => setSelectedPrayers(prev => checked ? [...prev, index] : prev.filter(i => i !== index))} />
                       <div className="grid gap-1.5 leading-none">
                         <label htmlFor={`prayer-${index}`} className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">{p.point}</label>
                         <p className="text-sm text-muted-foreground">{p.bibleVerse}</p>
                       </div>
                    </div>
                  ))}
                </div></ScrollArea>
                <Button onClick={handleAddSelectedPrayers} disabled={selectedPrayers.length === 0}>Add {selectedPrayers.length} Selected Prayers</Button>
              </div>
            )}
          </TabsContent>

          <TabsContent value="audio" className="mt-4 min-h-[300px]">
            {!isLoadingAudio && !audioResult && (
              <div className="text-center space-y-4 p-4 border-2 border-dashed rounded-lg flex flex-col items-center justify-center h-full">
                <p>Upload an audio recording of a sermon.</p>
                <Button onClick={() => audioInputRef.current?.click()}><Mic className="mr-2 h-4 w-4"/> Upload Audio</Button>
                <input type="file" accept="audio/*" ref={audioInputRef} className="hidden" onChange={(e) => handleFileChange(e, 'audio')} />
              </div>
            )}
            {isLoadingAudio && (
              <div className="flex flex-col items-center justify-center h-[300px]"><Loader2 className="h-8 w-8 animate-spin text-primary"/><p className="mt-2">Transcribing audio...</p></div>
            )}
            {audioResult && (
               <div className="space-y-4"><Label htmlFor="transcription">Transcription Result:</Label>
                 <Textarea id="transcription" value={transcribedText} onChange={e => setTranscribedText(e.target.value)} rows={10} />
                 <p className="text-sm text-muted-foreground">You can copy text from here to create new prayer points manually.</p>
              </div>
            )}
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
}
