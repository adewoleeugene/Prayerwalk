"use client";

import { Button } from "@/components/ui/button";
import { CheckCircle, Home, Plus, Sparkles } from "lucide-react";

type MobileNavProps = {
  selectedView: string;
  setSelectedView: (view: string) => void;
  onCaptureClick: () => void;
};

export function MobileNav({ selectedView, setSelectedView, onCaptureClick }: MobileNavProps) {
  return (
    <div className="fixed bottom-0 left-0 z-50 w-full h-16 bg-background border-t md:hidden">
      <div className="grid h-full max-w-lg grid-cols-3 mx-auto font-medium">
        <Button
          variant="ghost"
          className={`inline-flex flex-col items-center justify-center px-5 rounded-none h-full ${selectedView === 'all' ? 'text-primary' : 'text-muted-foreground'}`}
          onClick={() => setSelectedView('all')}
        >
          <Home className="w-5 h-5 mb-1" />
          <span className="text-xs">All Prayers</span>
        </Button>
        <div className="flex items-center justify-center">
            <Button
              size="lg"
              className="w-16 h-16 rounded-full shadow-lg -translate-y-4"
              onClick={onCaptureClick}
            >
                <Sparkles className="w-6 h-6" />
                <span className="sr-only">Capture</span>
            </Button>
        </div>
        <Button
          variant="ghost"
          className={`inline-flex flex-col items-center justify-center px-5 rounded-none h-full ${selectedView === 'answered' ? 'text-primary' : 'text-muted-foreground'}`}
          onClick={() => setSelectedView('answered')}
        >
          <CheckCircle className="w-5 h-5 mb-1" />
          <span className="text-xs">Answered</span>
        </Button>
      </div>
    </div>
  );
}
