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
import { Loader2, Mic, Upload, Square, NotebookText } from 'lucide-react';
import { ScrollArea } from './ui/scroll-area';
import { generatePrayerPointsFromText, GeneratePrayerPointsFromTextOutput } from '@/ai/flows/generate-prayer-points-from-text';
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
  const [loadingMessage, setLoadingMessage] = useState('Analyzing...');
  const [results, setResults] = useState<PrayerPoint[] | null>(null);
  const [selectedPrayers, setSelectedPrayers] = useState<number[]>([]);
  const [currentTab, setCurrentTab] = useState('text');
  const [textInput, setTextInput] = useState("");

  // Live recording state
  const [isRecording, setIsRecording] = useState(false);
  const [liveTranscript, setLiveTranscript] = useState("");
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const recognitionRef = useRef<any>(null);

  useEffect(() => {
    if (open && isRecording) {
      handleStopRecording(false);
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
          setLoadingMessage('Analyzing image...');
          response = await convertImageTextToPrayerPoints({ photoDataUri: dataUri });
        } else {
          setLoadingMessage('Transcribing audio...');
          toast({
            title: "Audio Processing",
            description: "For best results, please use audio files under 1 minute.",
          });
          response = await transcribeAudioToPrayerPoints({ audioDataUri: dataUri });
        }
        if (response.prayerPoints.length > 0) {
            setResults(response.prayerPoints);
            setSelectedPrayers(response.prayerPoints.map((_, i) => i));
        } else {
            toast({ variant: "default", title: "No prayer points found." });
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
      setResults(null);
      setLoadingMessage('Generating prayer points...');
      try {
          const response = await generatePrayerPointsFromText({ text: textInput });
          if (response.prayerPoints.length > 0) {
            setResults(response.prayerPoints);
            setSelectedPrayers(response.prayerPoints.map((_, i) => i));
          } else {
            toast({ variant: "default", title: "No prayer points found." });
          }
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
      mediaRecorderRef.current = new MediaRecorder(stream);
      
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
          setResults(null);
          setLoadingMessage('Transcribing audio...');
          try {
            const response = await transcribeAudioToPrayerPoints({ audioDataUri: dataUri });
            if (response.prayerPoints.length > 0) {
                setResults(response.prayerPoints);
                setSelectedPrayers(response.prayerPoints.map((_, i) => i));
            } else {
                toast({ variant: "default", title: "No prayer points found." });
            }
          } catch (error) {
              console.error("Error transcribing audio:", error);
              toast({ variant: 'destructive', title: 'Transcription Failed' });
          } finally {
              setIsLoading(false);
          }
        };
      };
      
      const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
      if (SpeechRecognition) {
          recognitionRef.current = new SpeechRecognition();
          recognitionRef.current.interimResults = true;
          recognitionRef.current.continuous = true;
          setLiveTranscript('');
          
          recognitionRef.current.onresult = (event: any) => {
              let finalTranscript = '';
              let interimTranscript = '';
              for (let i = event.resultIndex; i < event.results.length; ++i) {
                  if (event.results[i].isFinal) {
                      finalTranscript += event.results[i][0].transcript;
                  } else {
                      interimTranscript += event.results[i][0].transcript;
                  }
              }
              setLiveTranscript(prev => prev + finalTranscript + interimTranscript);
          };
          
          recognitionRef.current.start();
          mediaRecorderRef.current.start();
          setIsRecording(true);
      } else {
        toast({
            variant: "destructive",
            title: "Speech Recognition not supported",
            description: "Your browser does not support live transcription.",
          });
      }
    } catch (err) {
      console.error("Error accessing microphone:", err);
      toast({
        variant: "destructive",
        title: "Microphone Access Denied",
        description: "Please allow microphone access in your browser settings.",
      });
    }
  };

  const handleStopRecording = (process = true) => {
    if (recognitionRef.current) {
      recognitionRef.current.stop();
    }
    if (mediaRecorderRef.current && mediaRecorderRef.current.state === 'recording') {
        mediaRecorderRef.current.stop();
    }
    setIsRecording(false);
    
    // Logic to process the transcript is now in onstop of MediaRecorder
    if (process && liveTranscript) {
      setCurrentTab('text');
      setTextInput(liveTranscript);
      handleGenerateFromText();
    }
  };
  
  const handleAddSelectedPrayers = () => {
    if (!results || !categories.length) return;
    const defaultCategoryId = categories.find(c => c.id === 'personal')?.id || categories[0].id;

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
    setTextInput("");
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
          <p className="mt-2">{loadingMessage}</p>
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
    
    if (currentTab === 'text') {
        return (
            <div className="space-y-4">
                <Textarea
                    id="text-input"
                    value={textInput}
                    onChange={(e) => setTextInput(e.target.value)}
                    rows={8}
                    placeholder="Type or paste your notes, thoughts, or a transcribed sermon here..."
                />
                 <Button onClick={handleGenerateFromText} className="w-full">Generate Prayer Points</Button>
            </div>
        )
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
                <p>Upload a sermon or meeting recording.</p>
                <Button onClick={() => audioInputRef.current?.click()}><Mic className="mr-2 h-4 w-4"/> Upload Audio</Button>
                <input type="file" accept="audio/*" ref={audioInputRef} className="hidden" onChange={(e) => handleFileChange(e, 'audio')} />
            </div>
        )
    }

    if (currentTab === 'live') {
        return (
            <div className="space-y-4">
                {isRecording ? (
                    <Button onClick={() => handleStopRecording()} variant="destructive" className="w-full">
                        <Square className="mr-2 h-4 w-4" /> Stop Recording
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
                    When you stop recording, we'll process the audio to generate prayer points.
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
          <DialogDescription>Generate prayer points from text, an image, audio file, or live recording.</DialogDescription>
        </DialogHeader>
        <Tabs defaultValue="text" className="w-full" onValueChange={handleTabChange} value={currentTab}>
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="text"><NotebookText className="h-4 w-4 mr-1"/>Text</TabsTrigger>
            <TabsTrigger value="image">Image</TabsTrigger>
            <TabsTrigger value="audio">Audio</TabsTrigger>
            <TabsTrigger value="live">Live</TabsTrigger>
          </TabsList>
          
          <TabsContent value="text" className="mt-4 min-h-[300px]">
            {renderContent()}
          </TabsContent>
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
