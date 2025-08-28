"use client";

import React, { useRef, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Volume2, VolumeX } from 'lucide-react';

export default function AudioTestPage() {
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const [audioEnabled, setAudioEnabled] = useState(false);
  const audioEnabledRef = useRef(false);
  
  // Complete WAV beep sound - proper format
  const beepSoundDataUri = "data:audio/wav;base64,UklGRnoGAABXQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YQoGAACBhYqFbF1fdJivrJBhNjVgodDbq2EcBj+a2/LDciUFLIHO8tiJNwgZaLvt559NEAxQp+PwtmMcBjiR1/LMeSwFJHfH8N2QQAoUXrTp66hVFApGn+DyvmwhBSuBzvLZiTYIG2m98OScTgwOUarm7blmGgU7k9n1unEiBC13yO/eizEIHWq+8+OWTAAAAAA=";
  
  // Alternative: Simple online beep sound for testing
  const alternativeBeepUrl = "https://www.soundjay.com/misc/sounds/bell-ringing-05.wav";

  // Function to create beep using Web Audio API as fallback
  const createBeepSound = () => {
    try {
      console.log("Creating Web Audio API beep...");
      const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
      const oscillator = audioContext.createOscillator();
      const gainNode = audioContext.createGain();
      
      oscillator.connect(gainNode);
      gainNode.connect(audioContext.destination);
      
      oscillator.frequency.setValueAtTime(800, audioContext.currentTime); // 800Hz beep
      gainNode.gain.setValueAtTime(0.3, audioContext.currentTime);
      gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.2);
      
      oscillator.start(audioContext.currentTime);
      oscillator.stop(audioContext.currentTime + 0.2);
      console.log("Web Audio API beep created successfully");
    } catch (error) {
      console.error("Web Audio API failed:", error);
    }
  };

  // Function to enable audio with user interaction
  const enableAudio = async () => {
    console.log("enableAudio called, audioRef.current:", audioRef.current);
    console.log("Current audioEnabled state:", audioEnabled);
    
    if (audioRef.current) {
      try {
        console.log("Attempting HTML5 audio test...");
        // Test if audio can be played
        audioRef.current.currentTime = 0;
        const testPlayPromise = audioRef.current.play();
        if (testPlayPromise !== undefined) {
          await testPlayPromise;
          console.log("HTML5 audio test successful");
          audioRef.current.pause();
          audioRef.current.currentTime = 0;
        }
        setAudioEnabled(true);
        audioEnabledRef.current = true;
        console.log("Audio enabled successfully via HTML5");
        alert("Audio Enabled via HTML5!");
      } catch (error) {
        console.error("HTML5 audio failed, trying Web Audio API:", error);
        try {
          // Try Web Audio API as fallback
          console.log("Testing Web Audio API...");
          createBeepSound();
          setAudioEnabled(true);
          audioEnabledRef.current = true;
          console.log("Audio enabled successfully via Web Audio API");
          alert("Audio Enabled via Web Audio API!");
        } catch (webAudioError) {
          console.error("Web Audio API also failed:", webAudioError);
          alert("Audio Failed: Unable to enable audio on this device.");
        }
      }
    } else {
      console.log("No HTML5 audio element found, trying Web Audio API directly");
      // No HTML5 audio element, try Web Audio API directly
      try {
        createBeepSound();
        setAudioEnabled(true);
        audioEnabledRef.current = true;
        console.log("Audio enabled successfully via Web Audio API (no HTML5)");
        alert("Audio Enabled via Web Audio API (no HTML5)!");
      } catch (error) {
        console.error("Web Audio API failed:", error);
        alert("Audio Failed: Unable to enable audio on this device.");
      }
    }
  };

  const testBeep = () => {
    console.log("Testing beep sound...");
    if (audioEnabledRef.current) {
      if (audioRef.current) {
        // Reset audio position before playing to prevent interruption errors
        audioRef.current.currentTime = 0;
        
        // Properly handle audio playback promise
        const playPromise = audioRef.current.play();
        if (playPromise !== undefined) {
          playPromise.then(() => {
            console.log("HTML5 beep played successfully");
          }).catch((e: any) => {
            console.error("HTML5 audio failed, using Web Audio API:", e);
            // Fallback to Web Audio API
            createBeepSound();
          });
        }
      } else {
        // Use Web Audio API directly
        createBeepSound();
      }
    } else {
      alert("Please enable audio first!");
    }
  };
  
  const testAlternativeBeep = () => {
    console.log("Testing alternative online beep...");
    if (audioEnabledRef.current) {
      const audio = new Audio(alternativeBeepUrl);
      audio.play().then(() => {
        console.log("Alternative beep played successfully");
        alert("Alternative beep played!");
      }).catch((e: any) => {
        console.error("Alternative beep failed:", e);
        alert("Alternative beep failed: " + e.message);
      });
    } else {
      alert("Please enable audio first!");
    }
  };
  
  const testSimpleBeep = () => {
    console.log("Testing simple Web Audio API beep...");
    try {
      const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
      const oscillator = audioContext.createOscillator();
      const gainNode = audioContext.createGain();
      
      oscillator.connect(gainNode);
      gainNode.connect(audioContext.destination);
      
      oscillator.frequency.setValueAtTime(800, audioContext.currentTime);
      gainNode.gain.setValueAtTime(0.3, audioContext.currentTime);
      gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.3);
      
      oscillator.start(audioContext.currentTime);
      oscillator.stop(audioContext.currentTime + 0.3);
      
      console.log("Simple beep created successfully");
      alert("Simple beep should be playing!");
    } catch (error) {
      console.error("Simple beep failed:", error);
      alert("Simple beep failed: " + (error as Error).message);
    }
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-screen p-8 space-y-6">
      <h1 className="text-3xl font-bold">Audio Test Page</h1>
      
      <div className="space-y-4">
        <Button 
          variant={audioEnabled ? "default" : "outline"} 
          size="lg" 
          onClick={enableAudio}
          disabled={audioEnabled}
          className="flex items-center gap-2"
        >
          {audioEnabled ? <Volume2 className="h-5 w-5" /> : <VolumeX className="h-5 w-5" />}
          {audioEnabled ? "Audio Enabled" : "Enable Audio"}
        </Button>
        
        <Button 
          variant="secondary" 
          size="lg" 
          onClick={testBeep}
          className="w-full"
        >
          Test Beep Sound (Base64)
        </Button>
        
        <Button 
          variant="secondary" 
          size="lg" 
          onClick={testAlternativeBeep}
          className="w-full"
        >
          Test Alternative Beep (Online)
        </Button>
        
        <Button 
          variant="outline" 
          size="lg" 
          onClick={testSimpleBeep}
          className="w-full"
        >
          Test Simple Beep (No Files)
        </Button>
      </div>
      
      <div className="text-sm text-muted-foreground text-center max-w-md">
        <p>1. Click "Enable Audio" first (required for browser autoplay policies)</p>
        <p>2. Try each test button to find which audio method works</p>
        <p>3. Check browser console (F12) for detailed logs and error messages</p>
        <p>4. The "Simple Beep" test should work on most devices</p>
      </div>
      
      {/* Hidden audio element for beep sound */}
      <audio 
        ref={audioRef} 
        preload="auto" 
        style={{ display: 'none' }}
      >
        <source src={beepSoundDataUri} type="audio/wav" />
      </audio>
    </div>
  );
}