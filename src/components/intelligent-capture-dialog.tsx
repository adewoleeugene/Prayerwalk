"use client";

import React, { useState, useRef, useEffect } from 'react';
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { convertImageTextToPrayerPoints, ConvertImageTextToPrayerPointsOutput } from '@/ai/flows/convert-image-text-to-prayer-points';
import { transcribeAudioToPrayerPoints, TranscribeAudioToPrayerPointsOutput } from '@/ai/flows/transcribe-audio-to-prayer-points';
import { useToast } from '@/hooks/use-toast';
import { Checkbox } from './ui/checkbox';
import { usePrayerStore } from '@/hooks/use-prayer-store';
import { Loader2, Mic, Upload, Square } from 'lucide-react';
import { ScrollArea } from './ui/scroll-area';
import { generatePrayerPointsFromText } from '@/ai/flows/generate-prayer-points-from-text';
import { Textarea } from './ui/textarea';

type IntelligentCaptureDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
};

type PrayerPoint = {
    point: string;
    bibleVerse: string;
};

export function IntelligentCaptureDialog({ open, onOpenChange }: IntelligentCaptureDialogProps) {
  const { addPrayers, categories } = usePrayerStore();
  const { toast } = useToast();
  const imageInputRef = useRef<HTMLInputElement>(null);
  const audioInputRef = useRef<HTMLInputElement>(null);
  
  const [isLoading, setIsLoading] = useState(false);
  const [results, setResults] = useState<PrayerPoint[] | null>(null);
  const [selectedPrayers, setSelectedPrayers] = useState<number[]>([]);
  const [currentTab, setCurrentTab] = useState('image');

  // Live recording state
  const [isRecording, setIsRecording] = useState(false);
  const [liveTranscript, setLiveTranscript] = useState("");
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);

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
    setResults(null);

    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onloadend = async () => {
      const dataUri = reader.result as string;
      try {
        let response: ConvertImageTextToPrayerPointsOutput | TranscribeAudioToPrayerPointsOutput;
        if (type === 'image') {
          response = await convertImageTextToPrayerPoints({ photoDataUri: dataUri });
        } else {
          response = await transcribeAudioToPrayerPoints({ audioDataUri: dataUri });
        }
        setResults(response.prayerPoints);
      } catch (error) {
        console.error(`Error processing ${type}:`, error);
        toast({
          variant: "destructive",
          title: `Failed to process ${type}`,
          description: "Please try another file.",
        });
      } finally {
        setIsLoading(false);
      }
    };
  };

  const handleStartRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      audioChunksRef.current = [];
      mediaRecorderRef.current = new MediaRecorder(stream, { mimeType: 'audio/webm' });
      mediaRecorderRef.current.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunksRef.current.push(event.data);
        }
      };
      mediaRecorderRef.current.onstop = async () => {
        const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
        if (audioBlob.size === 0) return;
        
        setIsLoading(true);
        const reader = new FileReader();
        reader.readAsDataURL(audioBlob);
        reader.onloadend = async () => {
          const audioDataUri = reader.result as string;
          try {
            const result = await transcribeAudioToPrayerPoints({ audioDataUri });
            setResults(result.prayerPoints);
          } catch (error) {
            console.error("Transcription error:", error);
            toast({
              variant: "destructive",
              title: "Generation Failed",
              description: "Could not generate prayer points from the recording.",
            });
          } finally {
            setIsLoading(false);
          }
        };
        stream.getTracks().forEach(track => track.stop());
      };
      
      const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
      if (SpeechRecognition) {
          const recognition = new SpeechRecognition();
          recognition.interimResults = true;
          recognition.continuous = true;
          recognition.onresult = (event) => {
              let transcript = '';
              for (let i = event.resultIndex; i < event.results.length; ++i) {
                  transcript += event.results[i][0].transcript;
              }
              setLiveTranscript(prev => prev + transcript);
          };
          recognition.start();
      }
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
  
  const handleAddSelectedPrayers = () => {
    if (!results || !categories.length) return;
    const defaultCategoryId = categories[0].id;

    const prayersToAdd = results
      .filter((_, index) => selectedPrayers.includes(index))
      .map(p => ({ title: p.point, bibleVerse: p.bibleVerse, categoryId: defaultCategoryId }));

    if (prayersToAdd.length > 0) {
        addPrayers(prayersToAdd);
        toast({ title: "Prayers Added", description: `${prayersToAdd.length} prayer points added to your library.` });
    }
    resetAllTabs();
    onOpenChange(false);
  };

  const resetAllTabs = () => {
    setResults(null);
    setSelectedPrayers([]);
    setIsLoading(false);
    if (imageInputRef.current) imageInputRef.current.value = "";
    if (audioInputRef.current) audioInputRef.current.value = "";
    
    if(isRecording) {
        handleStopRecording();
    }
    setLiveTranscript("");
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
  };

  const renderContent = () => {
    if (isLoading) {
      return (
        <div className="flex flex-col items-center justify-center h-[300px]">
          <Loader2 className="h-8 w-8 animate-spin text-primary"/>
          <p className="mt-2">Analyzing...</p>
        </div>
      );
    }

    if (results) {
      return (
        <div className="space-y-4">
          <p>Select the prayer points to add:</p>
          <ScrollArea className="h-64">
            <div className="space-y-2 p-1">
              {results.map((p, index) => (
                <div key={index} className="flex items-start space-x-2 p-2 rounded-md border">
                  <Checkbox id={`prayer-${index}`} checked={selectedPrayers.includes(index)} onCheckedChange={(checked) => setSelectedPrayers(prev => checked ? [...prev, index] : prev.filter(i => i !== index))} />
                  <div className="grid gap-1.5 leading-none">
                    <label htmlFor={`prayer-${index}`} className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">{p.point}</label>
                    <p className="text-sm text-muted-foreground">{p.bibleVerse}</p>
                  </div>
                </div>
              ))}
            </div>
          </ScrollArea>
          <Button onClick={handleAddSelectedPrayers} disabled={selectedPrayers.length === 0}>
            Add {selectedPrayers.length} Selected Prayers
          </Button>
        </div>
      );
    }
    
    if (currentTab === 'image') {
        return (
            <div className="text-center space-y-4 p-4 border-2 border-dashed rounded-lg flex flex-col items-center justify-center h-[300px]">
                <p>Upload an image of a slide or notes.</p>
                <Button onClick={() => imageInputRef.current?.click()}><Upload className="mr-2 h-4 w-4"/> Upload Image</Button>
                <input type="file" accept="image/*" ref={imageInputRef} className="hidden" onChange={(e) => handleFileChange(e, 'image')} />
            </div>
        );
    }

    if (currentTab === 'audio') {
        return (
            <div className="text-center space-y-4 p-4 border-2 border-dashed rounded-lg flex flex-col items-center justify-center h-[300px]">
                <p>Upload an audio recording of a sermon.</p>
                <Button onClick={() => audioInputRef.current?.click()}><Mic className="mr-2 h-4 w-4"/> Upload Audio</Button>
                <input type="file" accept="audio/*" ref={audioInputRef} className="hidden" onChange={(e) => handleFileChange(e, 'audio')} />
            </div>
        )
    }

    if (currentTab === 'live') {
        return (
            <div className="space-y-4">
                {isRecording ? (
                    <Button onClick={handleStopRecording} variant="destructive" className="w-full">
                        <Square className="mr-2 h-4 w-4" /> Stop & Generate
                    </Button>
                ) : (
                    <Button onClick={handleStartRecording} className="w-full">
                        <Mic className="mr-2 h-4 w-4" /> Start Recording
                    </Button>
                )}
                 <Textarea
                    id="live-transcription"
                    value={liveTranscript}
                    readOnly
                    rows={8}
                    placeholder={isRecording ? "Listening... Your live transcription will appear here." : "Your live transcription will appear here."}
                />
                 <p className="text-sm text-muted-foreground">
                    Stop the recording to generate prayer points from the transcript.
                </p>
            </div>
        )
    }

    return null;
  }

  return (
    <Dialog open={open} onOpenChange={handleDialogClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Intelligent Capture</DialogTitle>
          <DialogDescription>Generate prayer points from an image, audio file, or live recording.</DialogDescription>
        </DialogHeader>
        <Tabs defaultValue="image" className="w-full" onValueChange={handleTabChange} value={currentTab}>
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="image">From Image</TabsTrigger>
            <TabsTrigger value="audio">From Audio</TabsTrigger>
            <TabsTrigger value="live">Live</TabsTrigger>
          </TabsList>
          
          <TabsContent value="image" className="mt-4 min-h-[300px]">
            {renderContent()}
          </TabsContent>
          <TabsContent value="audio" className="mt-4 min-h-[300px]">
            {renderContent()}
          </TabsContent>
          <TabsContent value="live" className="mt-4 min-h-[300px]">
            {renderContent()}
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
}

declare global {
    interface Window {
        SpeechRecognition: any;
        webkitSpeechRecognition: any;
    }
}
